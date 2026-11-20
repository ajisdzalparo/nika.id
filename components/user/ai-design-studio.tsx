"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowRight, IconCheck, IconLoader2, IconPalette, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AiDesignTemplate from "@/components/templates/ai-design";
import { ReferenceUploader } from "@/components/common/reference-uploader";
import { CoverThumb } from "@/components/templates/ai-design/cover-thumb";
import type { AiTheme } from "@/lib/ai-design/schema";
import { AI_THEME_PRESETS } from "@/lib/ai-design/presets";
import type { WeddingData } from "@/types/wedding";

interface Design {
  id: string;
  prompt: string;
  createdAt: string;
  theme: AiTheme;
}
interface Quota {
  used: number;
  total: number;
  remaining: number;
}

const INSPIRATIONS = [
  "Black & gold mewah, ornamen filigree, nuansa malam",
  "Adat Jawa klasik, motif kawung, cokelat sogan dan emas",
  "Garden party pastel, bunga liar, lembut dan romantis",
  "Islami elegan, hijau zamrud dan emas, ornamen arabesque",
  "Minimalis modern, hitam putih, tipografi tegas",
  "Pantai Bali saat senja, terakota dan pasir",
  "Sunda sage & krem, sederhana dan hangat",
  "Vintage rustic, kertas kraft, dedaunan kering",
];

const STEPS = ["Membaca konsep Anda…", "Memilih palet warna…", "Memadukan tipografi…", "Menata ornamen dan layout…", "Menulis kata pengantar…"];

function Swatches({ theme, size = "h-5 w-5" }: { theme: AiTheme; size?: string }) {
  const p = theme.palette;
  return (
    <div className="flex -space-x-1.5">
      {[p.background, p.surface, p.accent, p.ink].map((c, i) => (
        <span key={i} className={`${size} rounded-full ring-2 ring-background`} style={{ background: c }} />
      ))}
    </div>
  );
}

export function AiDesignStudio({ previewData, usesSampleData }: { previewData: WeddingData; usesSampleData: boolean }) {
  const router = useRouter();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [references, setReferences] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [step, setStep] = useState(0);
  const [presetKey, setPresetKey] = useState("malam-keemasan");
  const [preserveContext, setPreserveContext] = useState(true);

  useEffect(() => {
    fetch("/api/ai/design")
      .then((r) => r.json())
      .then((d) => {
        setDesigns(d.designs ?? []);
        setQuota(d.quota ?? null);
        setActiveId(d.activeId ?? null);
        setSelectedId(d.activeId ?? d.designs?.[0]?.id ?? null);
      })
      .catch(() => toast.error("Gagal memuat desain"));
  }, []);

  useEffect(() => {
    if (!generating) return;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2600);
    return () => clearInterval(t);
  }, [generating]);

  const selected = designs.find((d) => d.id === selectedId) ?? null;
  // Before the first generation, show hand-made example themes (no quota used)
  const previewTheme = selected?.theme ?? AI_THEME_PRESETS[presetKey]?.theme ?? null;
  const outOfQuota = quota !== null && quota.remaining <= 0;

  const generate = async () => {
    if (prompt.trim().length < 8 && !references.length) return toast.error("Ceritakan gaya yang Anda inginkan, atau lampirkan screenshot referensi.");
    setGenerating(true);
    try {
      const baseThemeId = preserveContext && selected ? selected.id : undefined;
      const res = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, references, baseThemeId }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d.quota) setQuota(d.quota);
        toast.error(d.message || "Gagal membuat desain");
        return;
      }
      setDesigns((prev) => [d.design, ...prev]);
      setSelectedId(d.design.id);
      setQuota(d.quota);
    } catch {
      toast.error("Koneksi bermasalah, coba lagi.");
    } finally {
      setGenerating(false);
    }
  };

  const apply = async () => {
    if (!selected) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/ai/design/${selected.id}/apply`, { method: "POST" });
      if (!res.ok) throw new Error();
      setActiveId(selected.id);
      toast.success(`Desain "${selected.theme.name}" dipakai untuk undangan Anda`);
      router.refresh();
    } catch {
      toast.error("Gagal memakai desain");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8 lg:py-12">
        {/* ── Composer ── */}
        <div className="space-y-8">
          <header className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">Studio Desain</p>
            <h1 className="font-serif text-4xl leading-tight text-zinc-900 dark:text-zinc-50 md:text-5xl">Ceritakan undangan impian Anda</h1>
            <p className="max-w-xl text-zinc-600 dark:text-zinc-400">
              Tulis suasana, warna, atau adat yang Anda inginkan. AI akan merancang tema lengkap: palet, tipografi, ornamen, dan tata letak, lalu langsung tampil di pratinjau.
            </p>
          </header>

          <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="ai-prompt" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Konsep desain
              </label>
              {quota && (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(quota.total, 10) }).map((_, i) => (
                      <span key={i} className={`h-1.5 w-3 rounded-full ${i < quota.remaining ? "bg-primary" : "bg-zinc-200 dark:bg-zinc-700"}`} />
                    ))}
                  </div>
                  <span>
                    {quota.remaining} dari {quota.total} tersisa
                  </span>
                </div>
              )}
            </div>
            <Textarea
              id="ai-prompt"
              value={prompt}
              maxLength={600}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Contoh: Pernikahan adat Jawa di pendopo, nuansa hangat cokelat sogan dan emas, elegan tapi tidak ramai, ada sentuhan bunga melati."
              className="min-h-32 resize-none border-zinc-200 bg-zinc-50 text-[15px] leading-relaxed dark:border-zinc-800 dark:bg-zinc-950"
              disabled={generating}
            />
            <ReferenceUploader value={references} onChange={setReferences} disabled={generating} />
            {selected && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {preserveContext ? (
                    <>
                      Mengingat konteks gaya <strong className="font-medium text-zinc-900 dark:text-zinc-100">{selected.theme.name}</strong>
                    </>
                  ) : (
                    "Membuat gaya baru dari awal (tanpa konteks sebelumnya)"
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setPreserveContext((v) => !v)}
                  className="font-medium text-[#8A6A2F] hover:underline"
                >
                  {preserveContext ? "Mulai gaya baru" : "Ikuti gaya aktif"}
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {INSPIRATIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPrompt(s)}
                  disabled={generating}
                  className="min-h-9 rounded-full border border-zinc-200 px-3.5 text-[13px] text-zinc-600 transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {s.split(",")[0]}
                </button>
              ))}
            </div>
            <div className="flex flex-col-reverse items-stretch justify-between gap-3 pt-2 sm:flex-row sm:items-center">
              <span className="text-xs text-zinc-400">{prompt.length}/600</span>
              {outOfQuota ? (
                <Button asChild className="h-11 rounded-lg px-6">
                  <Link href="/upgrade">
                    Tambah kuota desain <IconArrowRight size={16} className="ml-1" />
                  </Link>
                </Button>
              ) : (
                <Button onClick={generate} disabled={generating || !quota} className="h-11 rounded-lg px-6">
                  {generating ? <IconLoader2 size={18} className="mr-2 animate-spin" /> : designs.length ? <IconRefresh size={18} className="mr-2" /> : <IconPalette size={18} className="mr-2" />}
                  {generating ? "Merancang…" : designs.length ? "Buat desain lain" : "Rancang desain"}
                </Button>
              )}
            </div>
          </section>

          {selected && !generating && (
            <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Desain terpilih</p>
                  <h2 className="font-serif text-2xl text-zinc-900 dark:text-zinc-50">{selected.theme.name}</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{selected.theme.mood}</p>
                </div>
                <Swatches theme={selected.theme} size="h-7 w-7" />
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-zinc-400">Judul</dt>
                  <dd className="text-zinc-800 dark:text-zinc-200">{selected.theme.typography.display}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400">Nama</dt>
                  <dd className="text-zinc-800 dark:text-zinc-200">{selected.theme.typography.names}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-400">Teks</dt>
                  <dd className="text-zinc-800 dark:text-zinc-200">{selected.theme.typography.body}</dd>
                </div>
              </dl>
              {activeId === selected.id ? (
                <div className="flex h-11 items-center gap-2 rounded-lg border border-[#DFD2BC] bg-[#F5EFE3] px-4 text-sm font-medium text-[#5C4620]">
                  <IconCheck size={17} className="text-[#8A6A2F]" /> Sedang dipakai di undangan Anda
                </div>
              ) : (
                <Button onClick={apply} disabled={applying} className="h-11 w-full rounded-lg">
                  {applying && <IconLoader2 size={18} className="mr-2 animate-spin" />}
                  Pakai desain ini
                </Button>
              )}
            </section>
          )}

          {!designs.length && !generating && (
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Contoh hasil desain AI</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(AI_THEME_PRESETS).map(([key, { label, theme }]) => (
                  <button
                    key={key}
                    onClick={() => setPresetKey(key)}
                    className={`overflow-hidden rounded-xl border text-left transition ${key === presetKey ? "border-primary ring-2 ring-primary/20" : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"}`}
                  >
                    <CoverThumb theme={theme} data={previewData} zoom={0.42} className="h-52 w-full" />
                    <p className="bg-white px-3 py-2 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">{label}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {designs.length > 1 && (
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Riwayat desain</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {designs.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className={`group overflow-hidden rounded-xl border text-left transition ${d.id === selectedId ? "border-primary ring-2 ring-primary/20" : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"}`}
                  >
                    <CoverThumb theme={d.theme} data={previewData} zoom={0.42} className="h-52 w-full" />
                    <div className="space-y-1 bg-white p-3 dark:bg-zinc-900">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">{d.theme.name}</p>
                        {d.id === activeId && <span className="shrink-0 rounded-full border border-[#DFD2BC] bg-[#F5EFE3] px-2 py-0.5 text-[10px] font-medium text-[#6E5426]">Aktif</span>}
                      </div>
                      <p className="line-clamp-1 text-xs text-zinc-500">{d.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Phone preview ── */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="mx-auto w-full max-w-[380px]">
            <div className="relative overflow-hidden rounded-[44px] border-[10px] border-zinc-900 bg-zinc-900 shadow-2xl shadow-zinc-900/20 dark:border-zinc-800">
              <div className="absolute left-1/2 top-2 z-50 h-5 w-24 -translate-x-1/2 rounded-full bg-zinc-900" />
              <div className="h-[700px] overflow-y-auto overscroll-contain [scrollbar-width:none]">
                {generating ? (
                  <div className="flex h-full flex-col items-center justify-center gap-6 bg-zinc-50 px-10 text-center dark:bg-zinc-950">
                    <div className="grid w-full gap-3">
                      <div className="h-40 animate-pulse rounded-t-full rounded-b-2xl bg-zinc-200 dark:bg-zinc-800" />
                      <div className="mx-auto h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                      <div className="mx-auto h-8 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                    <p key={step} className="animate-in fade-in text-sm text-zinc-500 duration-500">
                      {STEPS[step]}
                    </p>
                  </div>
                ) : previewTheme ? (
                  <AiDesignTemplate key={selected?.id ?? presetKey} data={previewData} theme={previewTheme} embedded />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 bg-zinc-50 px-10 text-center dark:bg-zinc-950">
                    <IconPalette size={28} className="text-zinc-300" />
                    <p className="text-sm text-zinc-500">Pratinjau desain akan muncul di sini.</p>
                  </div>
                )}
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-zinc-400">
              {usesSampleData ? "Pratinjau memakai data contoh. Isi data di Editor Undangan untuk melihat nama Anda." : "Pratinjau memakai data undangan Anda."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
