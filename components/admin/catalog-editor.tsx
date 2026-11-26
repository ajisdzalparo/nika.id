"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowLeft, IconCheck, IconCode, IconCopy, IconDeviceDesktop, IconDeviceMobile, IconLoader2, IconMaximize, IconPalette, IconShieldCheck, IconUpload, IconX } from "@tabler/icons-react";
import AiDesignTemplate from "@/components/templates/ai-design";
import { templateRegistry } from "@/components/templates/registry";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  ADMIN_AI_HTML_CONTEXT_PROMPT,
  CUSTOM_HTML_PLACEHOLDERS,
  SAMPLE_WEDDING_HTML_STARTER,
  sanitizeCustomHtml,
  STANDARD_HTML_SECTIONS,
  validateStandardHtmlStructure,
} from "@/lib/ai-design/html-sanitize";
import { MOCK_WEDDING_DATA } from "@/lib/constants/mock-wedding-data";
import {
  BODY_FONTS,
  COUPLE_LAYOUTS,
  COVER_LAYOUTS,
  DEFAULT_AI_THEME,
  DISPLAY_FONTS,
  EVENT_LAYOUTS,
  GALLERY_LAYOUTS,
  ORNAMENTS,
  SCRIPT_FONTS,
  TEXTURES,
  type AiTheme,
} from "@/lib/ai-design/schema";
import { CATALOG_CATEGORIES, type TemplateDefaultMusic } from "@/lib/catalog-shared";
import { ImageUploadField } from "./image-upload-field";
import { ReferenceUploader } from "@/components/common/reference-uploader";
import { MusicSourcePicker } from "@/components/common/music-source-picker";
import { NumberInput } from "@/components/common/number-input";
import { SelectField } from "@/components/ui/select";

export interface CatalogDraft {
  id?: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tier: "Gratis" | "Premium";
  kind: "ENGINE" | "CODE";
  theme: AiTheme | null;
  defaultMusic?: TemplateDefaultMusic | null;
  componentSlug: string | null;
  thumbnail: string;
  referenceUrl: string;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  sortOrder: number;
}

export const EMPTY_DRAFT: CatalogDraft = {
  slug: "",
  name: "",
  description: "",
  category: "Elegan",
  tier: "Gratis",
  kind: "ENGINE",
  theme: DEFAULT_AI_THEME,
  defaultMusic: null,
  componentSlug: null,
  thumbnail: "",
  referenceUrl: "",
  isActive: true,
  isFeatured: false,
  isNew: true,
  sortOrder: 0,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const input = "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-[15px] outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-[#8A6424]/20";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      {children}
      {hint && <span className="block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

function Select<T extends string>({ value, options, onChange }: { value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <SelectField value={value} onChange={(e) => onChange(e.target.value as T)} className="h-11 px-3.5 text-[15px]">

      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </SelectField>
  );
}

function Panel({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-2xl">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Phone mockup screen size (px) and the scale of the 1280px mini desktop preview. */
const PHONE_W = 316;
const PHONE_H = 640;
const DESKTOP_THUMB_SCALE = 420 / 1280;

export function CatalogEditor({ initial }: { initial: CatalogDraft }) {
  const router = useRouter();
  const [d, setD] = useState<CatalogDraft>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [references, setReferences] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [htmlMode, setHtmlMode] = useState(Boolean(initial.theme?.customHtml?.trim()));
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "pc">("mobile");
  const [pcPreviewOpen, setPcPreviewOpen] = useState(false);
  const [showContextPrompt, setShowContextPrompt] = useState(false);
  const [copiedContext, setCopiedContext] = useState(false);

  const set = <K extends keyof CatalogDraft>(k: K, v: CatalogDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const theme = d.theme ?? DEFAULT_AI_THEME;
  const setTheme = (patch: Partial<AiTheme>) => set("theme", { ...theme, ...patch });
  const htmlAudit = useMemo(() => sanitizeCustomHtml(theme.customHtml ?? ""), [theme.customHtml]);
  const structureAudit = useMemo(() => validateStandardHtmlStructure(htmlAudit.html), [htmlAudit.html]);

  const htmlEditorRef = useRef<HTMLTextAreaElement>(null);
  const insertPlaceholder = (token: string) => {
    const el = htmlEditorRef.current;
    const current = theme.customHtml ?? "";
    const startPos = el ? el.selectionStart : current.length;
    const endPos = el ? el.selectionEnd : current.length;
    const next = current.slice(0, startPos) + token + current.slice(endPos);
    setTheme({ customHtml: next });
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(startPos + token.length, startPos + token.length);
    });
  };

  const copyContextPrompt = async () => {
    try {
      await navigator.clipboard.writeText(ADMIN_AI_HTML_CONTEXT_PROMPT);
      setCopiedContext(true);
      toast.success("Context Prompt AI berhasil disalin! Tempel ke ChatGPT / Claude / Gemini.");
      setTimeout(() => setCopiedContext(false), 2500);
    } catch {
      setShowContextPrompt(true);
      toast.error("Salin manual dari kotak Context Prompt di bawah.");
    }
  };

  const handleUploadHtmlFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.html?$/i.test(file.name) && file.type && !file.type.includes("html") && !file.type.includes("text")) {
      toast.error("Pilih file .html atau .htm.");
      return;
    }
    const raw = await file.text();
    const { html, strippedWarnings } = sanitizeCustomHtml(raw);
    if (!html) {
      toast.error("File HTML kosong atau tidak memiliki markup yang valid.");
      return;
    }
    set("kind", "ENGINE");
    setHtmlMode(true);
    setTheme({ customHtml: html });
    toast.success(
      strippedWarnings.length
        ? "HTML diunggah & tag berisiko dibersihkan otomatis."
        : "Template HTML berhasil dimuat!",
    );
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/catalog/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, references }) });
      const j = await res.json();
      if (!res.ok) return toast.error(j.message || "Gagal membuat tema");
      setD((p) => ({ ...p, theme: j.theme, name: p.name || j.theme.name, slug: slugTouched ? p.slug : slugify(p.name || j.theme.name), description: p.description || j.theme.mood }));
      toast.success("Tema dibuat. Sesuaikan detailnya lalu simpan.");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (d.kind === "ENGINE" && htmlMode) {
      if (!htmlAudit.html) {
        toast.error("Masukkan kode HTML atau unggah file .html terlebih dahulu.");
        return;
      }
      if (!structureAudit.isValid) {
        const missing = structureAudit.missingSections.join(", ");
        const extra = structureAudit.extraSections.join(", ");
        const dup = structureAudit.duplicateSections.join(", ");
        toast.error(
          [
            missing ? `Section wajib kurang: ${missing}` : "",
            extra ? `Section tambahan di luar standar dilarang: ${extra}` : "",
            dup ? `Section ganda: ${dup}` : "",
          ]
            .filter(Boolean)
            .join(" | "),
        );
        return;
      }
    }
    setSaving(true);
    try {
      const res = await fetch(d.id ? `/api/admin/catalog/${d.id}` : "/api/admin/catalog", {
        method: d.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...d,
          id: undefined,
          theme: d.kind === "ENGINE" ? theme : null,
          defaultMusic: d.defaultMusic?.url ? d.defaultMusic : null,
        }),
      });
      const j = await res.json();
      if (!res.ok) return toast.error(j.message || "Gagal menyimpan");
      toast.success("Template disimpan");
      router.push("/admin/templates");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <Link href="/admin/templates" className="inline-flex min-h-11 items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
          <IconArrowLeft size={16} /> Kembali ke koleksi
        </Link>

        <Panel title="Informasi">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama template">
              <input
                className={input}
                value={d.name}
                onChange={(e) => setD((p) => ({ ...p, name: e.target.value, slug: slugTouched ? p.slug : slugify(e.target.value) }))}
                placeholder="Mis. Sekar Jagad"
              />
            </Field>
            <Field label="Slug" hint="Dipakai di link pratinjau.">
              <input
                className={input}
                value={d.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
              />
            </Field>
          </div>
          <Field label="Deskripsi">
            <textarea className={`${input} h-24 resize-none py-3`} value={d.description} onChange={(e) => set("description", e.target.value)} maxLength={400} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Kategori">
              {/* Fixed list so the public filter chips stay tidy; an older custom category stays selectable */}
              <Select
                value={d.category}
                options={(CATALOG_CATEGORIES as readonly string[]).includes(d.category) || !d.category ? CATALOG_CATEGORIES : [...CATALOG_CATEGORIES, d.category]}
                onChange={(v) => set("category", v)}
              />
            </Field>
            <Field label="Paket">
              <Select value={d.tier} options={["Gratis", "Premium"] as const} onChange={(v) => set("tier", v)} />
            </Field>
            <Field label="Urutan" hint="Kecil = tampil lebih dulu.">
              <NumberInput className={input} maxDigits={4} value={String(d.sortOrder)} onValueChange={(v) => set("sortOrder", Number(v || 0))} />
            </Field>
          </div>
          <Field label="Link referensi inspirasi (opsional)" hint="Catatan internal untuk admin, tidak tampil ke publik. Pakai sebagai inspirasi gaya, jangan menyalin desain orang lain.">
            <input className={input} value={d.referenceUrl} onChange={(e) => set("referenceUrl", e.target.value)} placeholder="https://…" />
          </Field>
          <div className="flex flex-wrap gap-5 pt-1">
            {(
              [
                ["isActive", "Aktif"],
                ["isFeatured", "Unggulan (masuk karosel)"],
                ["isNew", "Tandai baru"],
              ] as const
            ).map(([k, l]) => (
              <label key={k} className="flex min-h-11 items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" checked={d[k]} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4 accent-[#1F1A14]" />
                {l}
              </label>
            ))}
          </div>
        </Panel>

        <Panel
          title="Musik default template (opsional)"
          aside={
            <button
              type="button"
              onClick={() => set("defaultMusic", d.defaultMusic ? null : { type: "upload", url: "" })}
              className={`h-9 rounded-full border px-4 text-xs font-medium transition-colors ${
                d.defaultMusic ? "border-zinc-900 bg-zinc-900 text-zinc-50" : "border-zinc-300 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {d.defaultMusic ? "Aktif · Klik untuk matikan" : "Pasang musik default"}
            </button>
          }
        >
          {d.defaultMusic ? (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">Lagu ini otomatis terpasang saat user memilih template ini (jika user belum mengatur musik sendiri).</p>
              <MusicSourcePicker
                type={d.defaultMusic.type}
                url={d.defaultMusic.url}
                onChangeType={(t) => set("defaultMusic", { ...(d.defaultMusic ?? { url: "" }), type: t })}
                onChangeUrl={(u) => set("defaultMusic", { ...(d.defaultMusic ?? { type: "upload" }), url: u })}
              />
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Belum ada musik bawaan pada template ini. Klik &ldquo;Pasang musik default&rdquo; jika ingin menyertakan lagu.</p>
          )}
        </Panel>

        <Panel
          title="Desain"
          aside={
            <div className="flex flex-wrap rounded-full border border-zinc-200 p-1 text-xs sm:text-sm">
              {(
                [
                  ["VISUAL", "Mesin tema"],
                  ["HTML", "Upload / Kode HTML"],
                  ["CODE", "Komponen kode"],
                ] as const
              ).map(([mode, label]) => {
                const active =
                  mode === "CODE"
                    ? d.kind === "CODE"
                    : mode === "HTML"
                      ? d.kind === "ENGINE" && htmlMode
                      : d.kind === "ENGINE" && !htmlMode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      if (mode === "CODE") {
                        set("kind", "CODE");
                      } else if (mode === "HTML") {
                        set("kind", "ENGINE");
                        setHtmlMode(true);
                        if (!theme.customHtml?.trim()) {
                          setTheme({ customHtml: SAMPLE_WEDDING_HTML_STARTER });
                        }
                      } else {
                        set("kind", "ENGINE");
                        setHtmlMode(false);
                        if (theme.customHtml) setTheme({ customHtml: undefined });
                      }
                    }}
                    className={`h-8 rounded-full px-3 transition ${active ? "bg-zinc-900 text-zinc-50" : "text-zinc-600 hover:text-zinc-900"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          }
        >
          {d.kind === "ENGINE" && htmlMode ? (
            <div className="space-y-5">
              {/* Toolbar: what this is + how to load code */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="flex max-w-md items-start gap-2 text-xs leading-relaxed text-[#6B5F50]">
                  <IconShieldCheck size={16} className="mt-px shrink-0 text-[#8A6424]" />
                  <span>
                    Khusus admin. Script, event inline (<code className="font-mono">on*</code>) dan URL <code className="font-mono">javascript:</code> otomatis
                    dibersihkan, lalu dirender di iframe sandbox.
                  </span>
                </p>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme({ customHtml: SAMPLE_WEDDING_HTML_STARTER })}
                    className="h-9 rounded-full border border-[#DDD5C7] bg-white px-3.5 text-xs font-medium text-[#40372B] hover:bg-[#F6EEDF]"
                  >
                    Muat contoh
                  </button>
                  <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[#1A1510] px-4 text-xs font-medium text-[#FCF8F1] hover:bg-[#2B241B]">
                    <IconUpload size={14} /> Upload .html
                    <input
                      type="file"
                      accept=".html,.htm,text/html"
                      className="sr-only"
                      onChange={(e) => {
                        void handleUploadHtmlFile(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Secondary: prompt for an external AI */}
              <div className="rounded-xl border border-[#EDE3CF] bg-[#FCF8F1]">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1F1A14]">Buat dengan AI lain</p>
                    <p className="text-xs text-[#6B5F50]">Prompt berisi aturan 11 bagian dan placeholder, agar HTML dari ChatGPT, Claude atau Gemini langsung cocok.</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowContextPrompt((v) => !v)}
                      aria-expanded={showContextPrompt}
                      className="h-9 rounded-full px-3 text-xs font-medium text-[#8A6424] hover:bg-[#F6EEDF]"
                    >
                      {showContextPrompt ? "Tutup" : "Lihat"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyContextPrompt()}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#DDD5C7] bg-white px-3.5 text-xs font-medium text-[#1F1A14] hover:bg-[#F6EEDF]"
                    >
                      {copiedContext ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      {copiedContext ? "Tersalin" : "Salin prompt"}
                    </button>
                  </div>
                </div>
                {showContextPrompt && (
                  <pre className="max-h-56 overflow-auto whitespace-pre-wrap border-t border-[#EDE3CF] px-4 py-3 font-mono text-[11px] leading-relaxed text-[#40372B]">
                    {ADMIN_AI_HTML_CONTEXT_PROMPT}
                  </pre>
                )}
              </div>

              {/* Structure check: one status line; only problems get colour */}
              <div className="space-y-2.5">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={`h-2 w-2 rounded-full ${structureAudit.isValid ? "bg-[#4E7A55]" : "bg-[#B4483E]"}`} aria-hidden />
                  <span className="font-medium text-[#1F1A14]">
                    {structureAudit.isValid ? "Struktur lengkap" : "Struktur belum sesuai"}
                  </span>
                  <span className="text-[#6B5F50]">
                    {structureAudit.presentSections.length} dari 11 bagian {structureAudit.isValid ? "terdeteksi" : "terdeteksi, tiap bagian wajib ada tepat satu"}
                  </span>
                </p>
                <ul className="flex flex-wrap gap-1.5" aria-label="Bagian wajib">
                  {STANDARD_HTML_SECTIONS.map((sec) => {
                    const ok = structureAudit.presentSections.includes(sec.id) && !structureAudit.duplicateSections.includes(sec.id);
                    return (
                      <li
                        key={sec.id}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[11px] ${
                          ok ? "border-[#E9DDC6] bg-white text-[#4A443B]" : "border-[#E3B7B1] bg-[#FBEFED] text-[#9A3A31]"
                        }`}
                      >
                        {ok ? <IconCheck size={12} className="text-[#4E7A55]" /> : <IconX size={12} />}
                        {sec.id}
                      </li>
                    );
                  })}
                </ul>
                {structureAudit.extraSections.length > 0 && (
                  <p className="text-xs text-[#9A3A31]">
                    Bagian di luar standar tidak diizinkan: <code className="font-mono">{structureAudit.extraSections.join(", ")}</code>
                  </p>
                )}
                {structureAudit.duplicateSections.length > 0 && (
                  <p className="text-xs text-[#9A3A31]">
                    Bagian ganda: <code className="font-mono">{structureAudit.duplicateSections.join(", ")}</code>
                  </p>
                )}
              </div>

              {htmlAudit.strippedWarnings.length > 0 && (
                <div className="rounded-xl border border-[#E7D4A8] bg-[#FBF5E6] px-4 py-3 text-xs text-[#6E4F1C]">
                  <p className="font-medium">Bagian yang dibersihkan demi keamanan:</p>
                  <ul className="mt-1 list-disc pl-4">
                    {htmlAudit.strippedWarnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Code editor with an attached header: insert data at the cursor, character count */}
              <div className="overflow-hidden rounded-xl border border-[#2B241B] bg-[#1A1510]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
                  <label htmlFor="custom-html-code" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#E8E1D4]">
                    <IconCode size={14} /> HTML &amp; CSS
                  </label>
                  <div className="flex items-center gap-3">
                    <SelectField
                      aria-label="Sisipkan data undangan"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) insertPlaceholder(e.target.value);
                      }}
                      size="sm" className="w-auto border-white/15 bg-white/5 text-[#E8E1D4] hover:border-[#D9B56A]/60 focus-visible:border-[#D9B56A] data-[state=open]:border-[#D9B56A] data-[placeholder]:text-[#E8E1D4]"
                    >
                      <option value="" className="text-[#1F1A14]">
                        Sisipkan data…
                      </option>
                      {CUSTOM_HTML_PLACEHOLDERS.map((ph) => (
                        <option key={ph.token} value={ph.token} className="text-[#1F1A14]">
                          {ph.label} · {ph.token}
                        </option>
                      ))}
                    </SelectField>
                    <span className="text-[11px] tabular-nums text-[#A59B8C]">
                      {(theme.customHtml?.length ?? 0).toLocaleString("id-ID")} / 150.000
                    </span>
                  </div>
                </div>
                <textarea
                  id="custom-html-code"
                  ref={htmlEditorRef}
                  spellCheck={false}
                  value={theme.customHtml ?? ""}
                  onChange={(e) => setTheme({ customHtml: e.target.value })}
                  placeholder="Tempel kode HTML + <style> di sini, atau upload file .html…"
                  className="block min-h-[380px] w-full resize-y bg-transparent p-4 font-mono text-xs leading-relaxed text-[#F4EDDF] outline-none placeholder:text-[#6B5F50]"
                />
              </div>
            </div>
          ) : d.kind === "CODE" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Komponen" hint="Template yang sudah ditulis developer di components/templates. Template baru dari admin dibuat lewat Mesin tema.">
                <SelectField value={d.componentSlug ?? ""} onChange={(e) => set("componentSlug", e.target.value || null)}>
                  <option value="" disabled>
                    Pilih komponen…
                  </option>
                  {Object.entries(templateRegistry)
                    .filter(([k]) => k !== "ai-design")
                    .map(([k, t]) => (
                      <option key={k} value={k}>
                        {t.name} ({k})
                      </option>
                    ))}
                </SelectField>
              </Field>
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-zinc-800">Gambar thumbnail</span>
                <ImageUploadField value={d.thumbnail} onChange={(url) => set("thumbnail", url)} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2 rounded-xl bg-zinc-50 p-4">
                <p className="text-sm font-medium text-zinc-800">Rancang dengan AI</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input className={input} aria-label="Deskripsi gaya template" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Mis. Adat Bali, merah marun dan emas, ornamen ukiran, nuansa sakral" />
                  <button onClick={generate} disabled={generating || (prompt.trim().length < 8 && !references.length)} type="button" className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 disabled:opacity-50">
                    {generating ? <IconLoader2 size={16} className="animate-spin" /> : <IconPalette size={16} />} {generating ? "Merancang…" : "Rancang"}
                  </button>
                </div>
                <ReferenceUploader value={references} onChange={setReferences} disabled={generating} />
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-zinc-800">Palet</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(Object.keys(theme.palette) as (keyof AiTheme["palette"])[]).map((k) => (
                    <label key={k} className="flex items-center gap-2 rounded-xl border border-zinc-200 p-2 text-xs text-zinc-600">
                      <input type="color" value={theme.palette[k]} onChange={(e) => setTheme({ palette: { ...theme.palette, [k]: e.target.value } })} className="h-8 w-8 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent" />
                      {k}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Font judul">
                  <Select value={theme.typography.display} options={DISPLAY_FONTS} onChange={(v) => setTheme({ typography: { ...theme.typography, display: v } })} />
                </Field>
                <Field label="Font nama">
                  <Select value={theme.typography.names} options={[...DISPLAY_FONTS, ...SCRIPT_FONTS] as const} onChange={(v) => setTheme({ typography: { ...theme.typography, names: v } })} />
                </Field>
                <Field label="Font teks">
                  <Select value={theme.typography.body} options={BODY_FONTS} onChange={(v) => setTheme({ typography: { ...theme.typography, body: v } })} />
                </Field>
                <Field label="Ornamen">
                  <Select value={theme.ornament} options={ORNAMENTS} onChange={(v) => setTheme({ ornament: v })} />
                </Field>
                <Field label="Tekstur">
                  <Select value={theme.texture} options={TEXTURES} onChange={(v) => setTheme({ texture: v })} />
                </Field>
                <Field label="Bingkai">
                  <Select value={theme.frame} options={["none", "hairline", "double", "dotted"] as const} onChange={(v) => setTheme({ frame: v })} />
                </Field>
                <Field label="Sudut">
                  <Select value={theme.corners} options={["sharp", "soft", "arch"] as const} onChange={(v) => setTheme({ corners: v })} />
                </Field>
                <Field label="Gaya label">
                  <Select value={theme.typography.labelStyle} options={["uppercase-tracked", "small-caps", "plain"] as const} onChange={(v) => setTheme({ typography: { ...theme.typography, labelStyle: v } })} />
                </Field>
                <div className="flex flex-col justify-end gap-2 pb-1">
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input type="checkbox" checked={theme.metallic} onChange={(e) => setTheme({ metallic: e.target.checked })} className="h-4 w-4 accent-[#1F1A14]" /> Efek foil metalik
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input type="checkbox" checked={theme.typography.displayItalic} onChange={(e) => setTheme({ typography: { ...theme.typography, displayItalic: e.target.checked } })} className="h-4 w-4 accent-[#1F1A14]" /> Judul miring
                  </label>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <Field label="Sampul">
                  <Select value={theme.layout.cover} options={COVER_LAYOUTS} onChange={(v) => setTheme({ layout: { ...theme.layout, cover: v } })} />
                </Field>
                <Field label="Mempelai">
                  <Select value={theme.layout.couple} options={COUPLE_LAYOUTS} onChange={(v) => setTheme({ layout: { ...theme.layout, couple: v } })} />
                </Field>
                <Field label="Acara">
                  <Select value={theme.layout.events} options={EVENT_LAYOUTS} onChange={(v) => setTheme({ layout: { ...theme.layout, events: v } })} />
                </Field>
                <Field label="Galeri">
                  <Select value={theme.layout.gallery} options={GALLERY_LAYOUTS} onChange={(v) => setTheme({ layout: { ...theme.layout, gallery: v } })} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Label sampul">
                  <input className={input} value={theme.copy.coverEyebrow} onChange={(e) => setTheme({ copy: { ...theme.copy, coverEyebrow: e.target.value } })} />
                </Field>
                <Field label="Tombol buka">
                  <input className={input} value={theme.copy.openButton} onChange={(e) => setTheme({ copy: { ...theme.copy, openButton: e.target.value } })} />
                </Field>
                <Field label="Salam pembuka">
                  <input className={input} value={theme.copy.greeting} onChange={(e) => setTheme({ copy: { ...theme.copy, greeting: e.target.value } })} />
                </Field>
                <Field label="Nama tema (di undangan)">
                  <input className={input} value={theme.name} onChange={(e) => setTheme({ name: e.target.value })} />
                </Field>
              </div>
              <Field label="Kalimat pembuka">
                <textarea className={`${input} h-20 resize-none py-3`} value={theme.copy.opening} onChange={(e) => setTheme({ copy: { ...theme.copy, opening: e.target.value } })} />
              </Field>
              <Field label="Kalimat penutup">
                <textarea className={`${input} h-20 resize-none py-3`} value={theme.copy.closing} onChange={(e) => setTheme({ copy: { ...theme.copy, closing: e.target.value } })} />
              </Field>

              <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
                <div>
                  <p className="text-sm font-medium text-zinc-800">Aset gambar tema (opsional)</p>
                  <p className="text-xs text-zinc-500">Unggah gambar latar atau ornamen sudut kustom untuk memperkaya tema ini.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-700">Gambar latar belakang</span>
                    <ImageUploadField
                      value={theme.assets?.backgroundImage || ""}
                      onChange={(url) => setTheme({ assets: { ...theme.assets, backgroundImage: url || undefined } })}
                      aspect="aspect-[3/4]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-zinc-700">Ornamen sudut (PNG transparan)</span>
                    <ImageUploadField
                      value={theme.assets?.ornamentImage || ""}
                      onChange={(url) => setTheme({ assets: { ...theme.assets, ornamentImage: url || undefined } })}
                      aspect="aspect-square"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </Panel>

        <div className="flex justify-end gap-3">
          <Link href="/admin/templates" className="flex h-11 items-center rounded-full border border-zinc-300 px-6 text-sm">
            Batal
          </Link>
          <button onClick={save} disabled={saving || !d.name || !d.slug} className="flex h-11 items-center gap-2 rounded-full bg-zinc-900 px-7 text-sm font-medium text-zinc-50 disabled:opacity-50">
            {saving && <IconLoader2 size={16} className="animate-spin" />} Simpan template
          </button>
        </div>
      </div>

      {/* Live preview: phone mockup, or a mini desktop that opens full screen */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div role="tablist" aria-label="Perangkat pratinjau" className="inline-flex rounded-full border border-[#E9DDC6] bg-white p-1 text-xs shadow-sm">
            {(
              [
                ["mobile", IconDeviceMobile, "Mobile"],
                ["pc", IconDeviceDesktop, "Desktop"],
              ] as const
            ).map(([key, Icon, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={previewDevice === key}
                onClick={() => setPreviewDevice(key)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 font-medium transition-colors ${
                  previewDevice === key ? "bg-[#1F1A14] text-[#F6EEDD] shadow-sm" : "text-[#6B5F50] hover:text-[#1F1A14]"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPcPreviewOpen(true)}
            disabled={d.kind !== "ENGINE"}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E9DDC6] bg-white px-3.5 text-xs font-medium text-[#8A6424] transition-colors hover:border-[#8A6424] disabled:opacity-40"
          >
            <IconMaximize size={14} /> Layar penuh
          </button>
        </div>

        {d.kind !== "ENGINE" ? (
          <div className="mx-auto w-full max-w-[330px] overflow-hidden rounded-[38px] bg-[#111] p-[7px] shadow-[0_30px_60px_-24px_rgba(26,21,16,.45)]">
            <div className="relative h-[640px] overflow-hidden rounded-[31px] bg-[#F6EEDF]">
              {d.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <p className="p-10 pt-40 text-center text-sm text-[#6B5F50]">Isi URL thumbnail untuk melihat pratinjau.</p>
              )}
            </div>
          </div>
        ) : previewDevice === "mobile" ? (
          // Phone mockup: content scrolls inside the screen with no visible scrollbars
          <div className="mx-auto w-fit rounded-[40px] bg-[#111] p-[7px] shadow-[0_30px_60px_-24px_rgba(26,21,16,.45)] ring-1 ring-black/5">
            <div className="relative overflow-hidden rounded-[33px] bg-white" style={{ width: PHONE_W, height: PHONE_H }}>
              <span aria-hidden className="pointer-events-none absolute left-1/2 top-2.5 z-20 h-[18px] w-[76px] -translate-x-1/2 rounded-full bg-[#111]" />
              {theme.customHtml?.trim() ? (
                <div className="h-full">
                  <AiDesignTemplate data={MOCK_WEDDING_DATA} theme={theme} embedded />
                </div>
              ) : (
                <div className="h-full overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div style={{ zoom: PHONE_W / 375, width: 375 }}>
                    <AiDesignTemplate data={MOCK_WEDDING_DATA} theme={theme} embedded />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Mini desktop: a scaled 1280px render; clicking it opens the full-screen preview
          <button
            type="button"
            onClick={() => setPcPreviewOpen(true)}
            aria-label="Buka pratinjau desktop layar penuh"
            className="group mx-auto block w-full max-w-[420px] text-left"
          >
            <div className="overflow-hidden rounded-xl border border-[#2B241B] bg-[#1F1A14] shadow-[0_24px_50px_-24px_rgba(26,21,16,.5)]">
              <div className="flex items-center gap-1.5 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#F06A5D]" />
                <span className="h-2 w-2 rounded-full bg-[#F4BE4F]" />
                <span className="h-2 w-2 rounded-full bg-[#61C454]" />
                <span className="ml-2 h-4 flex-1 truncate rounded bg-white/10 px-2 text-[9px] leading-4 text-white/50">satumoment.id/{d.slug || "template"}</span>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden bg-white">
                <div className="pointer-events-none absolute left-0 top-0 origin-top-left" style={{ width: 1280, height: 800, transform: `scale(${DESKTOP_THUMB_SCALE})` }}>
                  <div className="h-full overflow-hidden" style={{ ["--uy-stage-h" as string]: "800px" }}>
                    <AiDesignTemplate data={MOCK_WEDDING_DATA} theme={theme} forceOpened sampleMode />
                  </div>
                </div>
                <span className="absolute inset-0 flex items-center justify-center bg-[#1A1510]/0 transition-colors duration-300 group-hover:bg-[#1A1510]/45">
                  <span className="inline-flex translate-y-1 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#1F1A14] opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <IconMaximize size={14} /> Lihat layar penuh
                  </span>
                </span>
              </div>
            </div>
            <div className="mx-auto h-2.5 w-[22%] rounded-b-lg bg-[#2B241B]" />
            <p className="mt-3 text-center text-xs text-[#6B5F50]">Klik pratinjau untuk membuka tampilan desktop layar penuh.</p>
          </button>
        )}
      </aside>

      <Dialog open={pcPreviewOpen} onOpenChange={setPcPreviewOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex! top-0! left-0! h-dvh! max-h-none! w-screen! max-w-none! translate-x-0! translate-y-0! flex-col gap-0 overflow-hidden rounded-none! border-0 bg-[#1A1510] p-0"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5 text-[#F6EEDD] sm:px-6">
            <DialogTitle className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <IconDeviceDesktop size={18} className="shrink-0 text-[#D9B56A]" />
              <span className="truncate">Pratinjau desktop · {d.name || theme.name}</span>
              <span className="hidden rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-[#CDBF9F] sm:inline">{htmlMode ? "HTML sandbox" : "Mesin tema"}</span>
            </DialogTitle>
            <DialogClose asChild>
              <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3.5 text-xs font-medium hover:bg-white/20">
                <IconX size={15} /> Tutup
              </button>
            </DialogClose>
          </div>
          <div
            className={`min-h-0 flex-1 overscroll-contain bg-white ${theme.customHtml?.trim() ? "overflow-hidden" : "overflow-y-auto"}`}
            style={{ ["--uy-stage-h" as string]: "calc(100dvh - 53px)" }}
          >
            {d.kind === "ENGINE" ? (
              <AiDesignTemplate data={MOCK_WEDDING_DATA} theme={theme} forceOpened sampleMode />
            ) : (
              <p className="p-10 text-center text-sm text-zinc-500">Pratinjau desktop tersedia untuk Mesin Tema &amp; HTML.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
