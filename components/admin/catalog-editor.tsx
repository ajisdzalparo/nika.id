"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowLeft, IconLoader2, IconPalette } from "@tabler/icons-react";
import AiDesignTemplate from "@/components/templates/ai-design";
import { templateRegistry } from "@/components/templates/registry";
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
import { CATALOG_CATEGORIES } from "@/lib/catalog-shared";
import { ImageUploadField } from "./image-upload-field";
import { ReferenceUploader } from "@/components/common/reference-uploader";

export interface CatalogDraft {
  id?: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tier: "Gratis" | "Premium";
  kind: "ENGINE" | "CODE";
  theme: AiTheme | null;
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

const input = "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-[15px] outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-[#8A6A2F]/20";

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
    <select value={value} onChange={(e) => onChange(e.target.value as T)} className={input}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
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

export function CatalogEditor({ initial }: { initial: CatalogDraft }) {
  const router = useRouter();
  const [d, setD] = useState<CatalogDraft>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [references, setReferences] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const set = <K extends keyof CatalogDraft>(k: K, v: CatalogDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const theme = d.theme ?? DEFAULT_AI_THEME;
  const setTheme = (patch: Partial<AiTheme>) => set("theme", { ...theme, ...patch });

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
    setSaving(true);
    try {
      const res = await fetch(d.id ? `/api/admin/catalog/${d.id}` : "/api/admin/catalog", {
        method: d.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, id: undefined, theme: d.kind === "ENGINE" ? theme : null }),
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
              <input className={input} list="catalog-categories" value={d.category} onChange={(e) => set("category", e.target.value)} />
              <datalist id="catalog-categories">
                {CATALOG_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Paket">
              <Select value={d.tier} options={["Gratis", "Premium"] as const} onChange={(v) => set("tier", v)} />
            </Field>
            <Field label="Urutan" hint="Kecil = tampil lebih dulu.">
              <input type="number" className={input} value={d.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
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
                <input type="checkbox" checked={d[k]} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4 accent-[#1E1B17]" />
                {l}
              </label>
            ))}
          </div>
        </Panel>

        <Panel
          title="Desain"
          aside={
            <div className="flex rounded-full border border-zinc-200 p-1 text-sm">
              {(
                [
                  ["ENGINE", "Mesin tema"],
                  ["CODE", "Komponen kode"],
                ] as const
              ).map(([k, l]) => (
                <button key={k} type="button" onClick={() => set("kind", k)} className={`h-8 rounded-full px-3 ${d.kind === k ? "bg-zinc-900 text-zinc-50" : "text-zinc-600"}`}>
                  {l}
                </button>
              ))}
            </div>
          }
        >
          {d.kind === "CODE" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Komponen" hint="Template yang sudah ditulis developer di components/templates. Template baru dari admin dibuat lewat Mesin tema.">
                <select value={d.componentSlug ?? ""} onChange={(e) => set("componentSlug", e.target.value || null)} className={input}>
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
                </select>
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
                  <input className={input} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Mis. Adat Bali, merah marun dan emas, ornamen ukiran, nuansa sakral" />
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
                    <input type="checkbox" checked={theme.metallic} onChange={(e) => setTheme({ metallic: e.target.checked })} className="h-4 w-4 accent-[#1E1B17]" /> Efek foil metalik
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input type="checkbox" checked={theme.typography.displayItalic} onChange={(e) => setTheme({ typography: { ...theme.typography, displayItalic: e.target.checked } })} className="h-4 w-4 accent-[#1E1B17]" /> Judul miring
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

      {/* Live preview */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <p className="mb-3 text-center text-xs uppercase tracking-[0.2em] text-zinc-500">Pratinjau</p>
        <div className="mx-auto w-[340px] overflow-hidden rounded-[40px] border-[9px] border-[#111] bg-white">
          <div className="h-[660px] overflow-y-auto overscroll-contain [scrollbar-width:none]">
            {d.kind === "ENGINE" ? (
              <div style={{ zoom: 322 / 375, width: 375 }}>
                <AiDesignTemplate data={MOCK_WEDDING_DATA} theme={theme} embedded />
              </div>
            ) : d.thumbnail ? (
              <div className="relative h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </div>
            ) : (
              <p className="p-10 text-center text-sm text-zinc-500">Isi URL thumbnail untuk melihat pratinjau.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
