"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { SURVEY_ACTIONS_BETWEEN_ASKS, SURVEY_SOURCES } from "@/lib/survey-shared";

/** Wait until the person has settled on the page before asking anything. */
const SETTLE_MS = 6_000;
/** Pages left before asking again after "Nanti saja" (localStorage, survives reloads). */
const WAIT_KEY = "uy-survey-wait";
/** Server answer cached for this tab: "0" = not eligible or already answered. */
const DUE_KEY = "uy-survey-due";
const LAST_PATH_KEY = "uy-survey-last-path";
/** Never interrupt work in progress: only ask on overview pages. */
const BUSY_PAGES = ["/editor", "/kanvas", "/desain-ai", "/check-in", "/upgrade"];

function readNumber(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}
function store(storage: "local" | "session", key: string, value: string | null) {
  try {
    const s = storage === "local" ? localStorage : sessionStorage;
    if (value === null) s.removeItem(key);
    else s.setItem(key, value);
  } catch {
    /* storage unavailable: the survey simply asks per page load */
  }
}

type Answers = {
  recommend: number | null;
  source: (typeof SURVEY_SOURCES)[number] | null;
  designScore: number | null;
  easeScore: number | null;
  priceScore: number | null;
  wish: string;
};

const EMPTY: Answers = { recommend: null, source: null, designScore: null, easeScore: null, priceScore: null, wish: "" };

function Question({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3 border-t border-[#F3EBDB] pt-5 first:border-t-0 first:pt-0">
      <legend className="text-[15px] font-medium leading-snug text-[#1F1A14]">
        <span className="mr-1.5 font-(family-name:--font-landing-display) text-[#8A6424]">{n}.</span>
        {title}
      </legend>
      {hint && <p className="-mt-1 text-xs text-[#8E8268]">{hint}</p>}
      {children}
    </fieldset>
  );
}

/** A row of tappable choices (radio semantics, 40px tall). */
function Choices<T extends string | number>({ name, options, value, onChange, label }: { name: string; options: readonly T[]; value: T | null; onChange: (v: T) => void; label?: (v: T) => string }) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value === o;
        return (
          <button
            key={String(o)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o)}
            className={`min-h-10 min-w-10 rounded-full border px-3.5 text-sm transition-all ${
              on ? "border-[#8A6424] bg-[#8A6424] font-semibold text-white shadow-[0_6px_14px_-8px_rgba(138,100,36,.8)]" : "border-[#E9DDC6] bg-white text-[#40372B] hover:border-[#8A6424]"
            }`}
          >
            {label ? label(o) : String(o)}
          </button>
        );
      })}
    </div>
  );
}

const SCALE = [1, 2, 3, 4, 5] as const;
const NPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/**
 * A short survey that keeps coming back until it is answered, without nagging: it waits until the
 * page has been open a while, never shows on work pages (editor, canvas…), and after "Nanti saja"
 * it comes back only after the user has moved through a few more pages.
 */
export function CustomerSurvey() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [a, setA] = useState<Answers>(EMPTY);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Every move to another page (client navigation or full load) is one action; it counts down the
    // wait set by "Nanti saja". Reloading the same page does not count.
    let lastPath: string | null = null;
    try {
      lastPath = sessionStorage.getItem(LAST_PATH_KEY);
    } catch {}
    if (lastPath !== pathname) {
      const wait = readNumber(WAIT_KEY);
      if (lastPath !== null && wait !== null && wait > 0) store("local", WAIT_KEY, String(wait - 1));
      store("session", LAST_PATH_KEY, pathname);
    }

    if ((readNumber(WAIT_KEY) ?? 0) > 0) return;
    if (BUSY_PAGES.some((p) => pathname.startsWith(p))) return;
    let due: string | null = null;
    try {
      due = sessionStorage.getItem(DUE_KEY);
    } catch {}
    if (due === "0") return;

    let cancelled = false;
    const ask = async () => {
      if (document.visibilityState !== "visible") {
        // Tab in the background: ask when the user comes back instead of skipping this page
        document.addEventListener("visibilitychange", onVisible, { once: true });
        return;
      }
      if (due !== "1") {
        const res = await fetch("/api/user/survey").catch(() => null);
        const data = res?.ok ? ((await res.json()) as { due?: boolean }) : null;
        if (!data) return;
        store("session", DUE_KEY, data.due ? "1" : "0");
        if (!data.due) return;
      }
      if (!cancelled) setOpen(true);
    };
    let visibleTimer: ReturnType<typeof setTimeout> | undefined;
    const onVisible = () => {
      visibleTimer = setTimeout(() => void ask(), 1_500);
    };
    const timer = setTimeout(() => void ask(), SETTLE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(visibleTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);

  const later = async () => {
    setOpen(false);
    store("local", WAIT_KEY, String(SURVEY_ACTIONS_BETWEEN_ASKS));
    await fetch("/api/user/survey", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "later" }) }).catch(() => null);
  };

  const complete = a.recommend !== null && a.source && a.designScore && a.easeScore && a.priceScore;

  const submit = async () => {
    if (!complete) return;
    setSending(true);
    const res = await fetch("/api/user/survey", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "submit", ...a, wish: a.wish.trim() || undefined }),
    }).catch(() => null);
    setSending(false);
    if (!res?.ok) {
      toast.error("Survei belum terkirim, coba lagi ya.");
      return;
    }
    setOpen(false);
    store("session", DUE_KEY, "0");
    store("local", WAIT_KEY, null);
    toast.success("Terima kasih! Masukan kalian membantu kami jadi lebih baik.");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) void later();
      }}
    >
      <DialogContent className="flex! max-h-[88vh] flex-col gap-0 overflow-hidden rounded-2xl border-[#EDE3CF] bg-[#FFFDF8] p-0 sm:max-w-lg">
        <div className="relative overflow-hidden bg-[#1A1510] px-6 pb-5 pt-6 text-[#F6EEDD]">
          <div aria-hidden className="uy-lattice-light pointer-events-none absolute inset-0" />
          <p className="relative text-[11px] uppercase tracking-[0.22em] text-[#D9B56A]">Survei singkat · 1 menit</p>
          <DialogTitle className="relative mt-1 font-(family-name:--font-landing-display) text-2xl font-normal">Bagaimana pengalaman kalian?</DialogTitle>
          <DialogDescription className="relative mt-1 text-sm text-[#CDBF9F]">Jawaban kalian langsung dibaca tim kami untuk memperbaiki SatuMoment.</DialogDescription>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <Question n={1} title="Seberapa mungkin kalian merekomendasikan SatuMoment ke teman atau keluarga?" hint="0 = tidak mungkin, 10 = pasti merekomendasikan">
            <Choices name="Rekomendasi" options={NPS} value={a.recommend} onChange={(v) => setA((s) => ({ ...s, recommend: v }))} />
          </Question>
          <Question n={2} title="Dari mana kalian tahu SatuMoment?">
            <Choices name="Sumber" options={SURVEY_SOURCES} value={a.source} onChange={(v) => setA((s) => ({ ...s, source: v }))} />
          </Question>
          <Question n={3} title="Seberapa puas dengan desain undangannya?" hint="1 = kurang puas, 5 = sangat puas">
            <Choices name="Desain" options={SCALE} value={a.designScore} onChange={(v) => setA((s) => ({ ...s, designScore: v }))} />
          </Question>
          <Question n={4} title="Seberapa mudah membuat dan mengelola undangan?" hint="1 = sulit, 5 = sangat mudah">
            <Choices name="Kemudahan" options={SCALE} value={a.easeScore} onChange={(v) => setA((s) => ({ ...s, easeScore: v }))} />
          </Question>
          <Question n={5} title="Bagaimana penilaian kalian tentang harganya?" hint="1 = terlalu mahal, 5 = sangat sepadan">
            <Choices name="Harga" options={SCALE} value={a.priceScore} onChange={(v) => setA((s) => ({ ...s, priceScore: v }))} />
          </Question>
          <Question n={6} title="Ada fitur yang ingin kalian lihat? (opsional)">
            <Textarea
              value={a.wish}
              onChange={(e) => setA((s) => ({ ...s, wish: e.target.value }))}
              maxLength={500}
              placeholder="Contoh: QR untuk tamu saat datang ke acara"
              className="min-h-20 rounded-xl border-[#E9DDC6] bg-white"
            />
          </Question>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#F3EBDB] px-6 py-4">
          <Button type="button" variant="ghost" onClick={() => void later()} className="h-10 rounded-full px-4 text-[#6B5F50]">
            Nanti saja
          </Button>
          <Button type="button" variant="gold" disabled={!complete || sending} onClick={submit} className="h-11 px-6">
            {sending && <IconLoader2 size={16} className="animate-spin" />} Kirim jawaban
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
