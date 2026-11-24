"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SafeImg } from "@/components/common/safe-img";
import {
  IconArrowRight,
  IconBrandWhatsapp,
  IconCalendarEvent,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconGift,
  IconMapPin,
  IconMessageCircle,
  IconMusic,
  IconPhoto,
  IconPlus,
} from "@tabler/icons-react";
import { AI_THEME_PRESETS } from "@/lib/ai-design/presets";
import type { CatalogItem } from "@/lib/catalog-shared";
import { CoverThumb } from "@/components/templates/ai-design/cover-thumb";
import { GUEST_ADDON_PRICE, GUEST_ADDON_SIZE, PAID_PLANS, PLAN_LIMITS, type PlanType } from "@/lib/limits";
import { DEFAULT_LANDING_CONTENT, type LandingContent } from "@/lib/landing-content-shared";
import { Display, Eyebrow, L, Phone, Reveal, Rule } from "./primitives";
import { Wordmark } from "./navbar";

// ─── Desain AI demo ──────────────────────────────────────────────────────

const DEMO_PROMPTS: { key: keyof typeof AI_THEME_PRESETS; prompt: string }[] = [
  { key: "kawung-sogan", prompt: "Adat Jawa klasik, motif kawung, cokelat sogan dan emas tua." },
  { key: "malam-keemasan", prompt: "Black & gold yang mewah, ornamen filigree, nuansa resepsi malam." },
  { key: "taman-pastel", prompt: "Pesta kebun pagi hari, hijau sage, modern dan santai." },
  { key: "sekar-arum", prompt: "Klasik dan hangat, krem dengan sentuhan emas lembut." },
];

export function AiDemo() {
  const [active, setActive] = useState(0);
  const current = DEMO_PROMPTS[active];
  // Number of characters typed so far; reset to 0 when a new example is chosen
  const [chars, setChars] = useState(current.prompt.length);
  const typed = current.prompt.slice(0, chars);

  useEffect(() => {
    if (chars >= current.prompt.length) return;
    const t = setTimeout(() => setChars((c) => c + 2), 18);
    return () => clearTimeout(t);
  }, [chars, current.prompt.length]);

  const choose = (i: number) => {
    setActive(i);
    setChars(0);
  };

  const theme = AI_THEME_PRESETS[current.key].theme;

  return (
    <section id="desain-ai" className="relative scroll-mt-16 overflow-hidden py-24 md:py-32" style={{ background: L.night, color: "#F3EBDD" }}>
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
        <div className="space-y-10">
          <Reveal className="space-y-5">
            <Eyebrow light>Studio Desain AI</Eyebrow>
            <Display className="text-[2.6rem] sm:text-5xl lg:text-6xl">
              Tulis suasananya. <em className="italic" style={{ color: L.accentBright }}>Desainnya menyusul.</em>
            </Display>
            <p className="max-w-lg text-[17px] leading-relaxed text-[#B8AD9A]">
              Tidak perlu memilah ratusan template. Ceritakan konsep pernikahan kalian, dan AI menyusun tema lengkap yang bisa langsung dipakai, diganti, atau dibandingkan.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="rounded-2xl border p-5" style={{ borderColor: "#2E2A23", background: "#1B1915" }}>
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#8C8272]">Konsep kalian</p>
              <p className="min-h-[3.5rem] text-lg leading-relaxed">
                {typed}
                <span className="ml-0.5 inline-block h-5 w-px translate-y-1 animate-pulse" style={{ background: L.accentBright }} />
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {DEMO_PROMPTS.map((p, i) => (
                <button
                  key={p.key}
                  onClick={() => choose(i)}
                  className="h-10 rounded-full border px-4 text-sm transition-colors"
                  style={i === active ? { background: "#F3EBDD", color: L.night, borderColor: "#F3EBDD" } : { borderColor: "#3A352C", color: "#CFC5B4" }}
                >
                  {AI_THEME_PRESETS[p.key].label}
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal delay={140}>
            <ul className="grid gap-4 text-[15px] text-[#CFC5B4] sm:grid-cols-3">
              {["Palet dan tipografi dipadukan seperti desainer", "Ornamen menyesuaikan adat dan suasana", "Ganti desain kapan saja tanpa mengisi ulang data"].map((t) => (
                <li key={t} className="flex gap-3 border-t pt-4" style={{ borderColor: "#2E2A23" }}>
                  <IconCheck size={18} className="mt-0.5 shrink-0" style={{ color: L.accentBright }} />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={100} direction="scale" className="flex flex-col items-center gap-4">
          <div key={current.key} className="animate-in fade-in zoom-in-95 duration-500">
            <Phone theme={theme} zoom={0.8} interactive />
          </div>
          <p className="text-xs text-[#8C8272]">Tema: {theme.name} · ketuk “Buka Undangan” untuk melihat isinya</p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Koleksi desain (Karosel) ────────────────────────────────────────────

export function Collection({ items }: { items: CatalogItem[] }) {
  const templates = items;
  const categories = ["Semua", ...Array.from(new Set(templates.map((t) => t.category)))];
  const [cat, setCat] = useState("Semua");
  const shown = cat === "Semua" ? templates : templates.filter((t) => t.category === cat);
  const totalSlides = shown.length + (cat === "Semua" ? 1 : 0);

  const trackRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollToSlide = useCallback((idx: number) => {
    const track = trackRef.current;
    if (!track || totalSlides === 0) return;
    const clamped = ((idx % totalSlides) + totalSlides) % totalSlides;
    const card = track.children[clamped] as HTMLElement | undefined;
    if (!card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
    setActiveSlide(clamped);
  }, [totalSlides]);

  const chooseCategory = (c: string) => {
    setCat(c);
    setActiveSlide(0);
    trackRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const cards = Array.from(track.children) as HTMLElement[];
        if (!cards.length) return;
        const left = track.scrollLeft + track.offsetLeft;
        let closest = 0;
        let best = Infinity;
        cards.forEach((el, i) => {
          const d = Math.abs(el.offsetLeft - left);
          if (d < best) {
            best = d;
            closest = i;
          }
        });
        setActiveSlide(closest);
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener("scroll", onScroll);
    };
  }, [cat, totalSlides]);

  // Autoplay runs only while the carousel is on screen and the visitor hasn't asked for less motion
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    const el = sectionRef.current;
    const io = el ? new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 }) : null;
    if (el && io) io.observe(el);
    return () => {
      mq.removeEventListener("change", sync);
      io?.disconnect();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  // Touch pauses, then autoplay picks up again a few seconds after the finger lifts
  const pauseForTouch = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    setPaused(true);
  };
  const resumeAfterTouch = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 6000);
  };

  useEffect(() => {
    if (paused || !inView || reducedMotion || totalSlides < 2) return;
    const id = setInterval(() => {
      const track = trackRef.current;
      // Once the last cards are fully visible the track can't move further: loop back to the start
      const atEnd = track ? track.scrollLeft + track.clientWidth >= track.scrollWidth - 8 : false;
      scrollToSlide(atEnd ? 0 : activeSlide + 1);
    }, 5000);
    return () => clearInterval(id);
  }, [paused, inView, reducedMotion, activeSlide, totalSlides, scrollToSlide]);

  return (
    <section ref={sectionRef} id="koleksi" className="scroll-mt-16 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl space-y-4">
            <Eyebrow>Koleksi desain</Eyebrow>
            <Display className="text-[2.5rem] sm:text-5xl">Atau mulai dari desain yang sudah jadi.</Display>
            <div className="flex flex-wrap items-center gap-5">
              <Link href="/desain" className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium transition-transform hover:translate-x-0.5" style={{ color: L.accent }}>
                Lihat semua koleksi <IconArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => chooseCategory(c)}
                className="h-10 rounded-full border px-4 text-sm transition-all duration-300"
                style={c === cat ? { background: L.ink, color: L.bg, borderColor: L.ink } : { borderColor: L.line, color: L.muted }}
              >
                {c}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Carousel track */}
      <div className="relative mx-auto mt-10 max-w-6xl">
        <div
          ref={trackRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onTouchStart={pauseForTouch}
          onTouchEnd={resumeAfterTouch}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-6 pt-2 [scrollbar-width:none] md:px-6"
        >
          {cat === "Semua" && (
            <a href="#desain-ai" className="group w-[250px] shrink-0 snap-start sm:w-[280px]">
              <div className="relative flex aspect-[3/4.2] flex-col justify-between overflow-hidden rounded-[26px] p-6 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_48px_-20px_rgba(21,19,15,0.45)]" style={{ background: L.night, color: "#F3EBDD" }}>
                <Eyebrow light>Desain AI</Eyebrow>
                <div className="space-y-5">
                  <div className="flex -space-x-2">
                    {Object.values(AI_THEME_PRESETS).map(({ theme }) => (
                      <span key={theme.name} className="h-9 w-9 rounded-full ring-2 ring-[#15130F] transition-transform duration-500 group-hover:scale-105" style={{ background: `linear-gradient(135deg, ${theme.palette.background} 50%, ${theme.palette.accent} 50%)` }} />
                    ))}
                  </div>
                  <p className="font-(family-name:--font-landing-display) text-3xl leading-tight">Desain unik yang hanya dimiliki kalian.</p>
                  <span className="inline-flex items-center gap-2 text-sm transition-transform duration-300 group-hover:translate-x-1" style={{ color: L.accentBright }}>
                    Coba sekarang <IconArrowRight size={16} />
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <p className="font-(family-name:--font-landing-display) text-xl" style={{ color: L.ink }}>
                  Rancang dengan AI
                </p>
                <p className="text-sm" style={{ color: L.muted }}>
                  Sesuai konsep kalian
                </p>
              </div>
            </a>
          )}
          {shown.map((t) => (
            <Link key={t.slug} href={`/preview/t/${t.slug}`} className="group w-[250px] shrink-0 snap-start sm:w-[280px]">
              <div className="relative aspect-[3/4.2] overflow-hidden rounded-[26px] border transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_48px_-20px_rgba(30,27,23,0.22)]" style={{ borderColor: L.line, background: L.surface }}>
                {t.kind === "ENGINE" && t.theme ? (
                  <CoverThumb theme={t.theme} zoom={0.7} className="h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]" />
                ) : (
                  <SafeImg src={t.thumbnail} alt={t.name} className="absolute inset-0 h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]" />
                )}
                <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-end opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#1E1B17]/90 px-3 py-1.5 text-xs font-medium text-[#F7F3EC] backdrop-blur-sm">
                    Pratinjau <IconArrowRight size={13} />
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-(family-name:--font-landing-display) text-xl" style={{ color: L.ink }}>
                    {t.name}
                  </p>
                  <p className="text-sm" style={{ color: L.muted }}>
                    {t.category}
                  </p>
                </div>
                <span className="mt-1 shrink-0 rounded-full border px-2.5 py-0.5 text-[11px]" style={{ borderColor: L.line, color: t.tier === "Premium" ? L.accent : L.muted }}>
                  {t.tier}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Carousel controls & progress dots */}
        {totalSlides > 1 && (
          <div className="mt-2 flex items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
              {Array.from({ length: totalSlides }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToSlide(idx)}
                  aria-label={`Desain ${idx + 1}`}
                  className="flex h-11 items-center px-0.5"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeSlide ? "w-8 bg-[#1E1B17]" : "w-2 bg-[#CFC5B4] hover:bg-[#A59B8C]"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => scrollToSlide(activeSlide - 1)}
                aria-label="Desain sebelumnya"
                className="flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 hover:bg-white active:scale-95"
                style={{ borderColor: L.line, color: L.ink }}
              >
                <IconChevronLeft size={18} />
              </button>
              <button
                onClick={() => scrollToSlide(activeSlide + 1)}
                aria-label="Desain berikutnya"
                className="flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 hover:bg-white active:scale-95"
                style={{ borderColor: L.line, color: L.ink }}
              >
                <IconChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Langkah ─────────────────────────────────────────────────────────────

export function Steps({ content = DEFAULT_LANDING_CONTENT.steps }: { content?: LandingContent["steps"] }) {
  return (
    <section className="border-y py-24 md:py-28" style={{ borderColor: L.line, background: L.surface }}>
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal className="mb-14 space-y-4">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <Display className="max-w-2xl text-[2.5rem] sm:text-5xl">{content.heading}</Display>
        </Reveal>
        <ol className="grid gap-10 md:grid-cols-3 md:gap-12">
          {content.items.map((step, i) => (
            <Reveal key={`${step.title}-${i}`} delay={i * 90}>
              <li className="space-y-4 border-t pt-6" style={{ borderColor: L.ink }}>
                <span className="font-(family-name:--font-landing-display) text-6xl italic lining-nums leading-none" style={{ color: L.accent }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-medium" style={{ color: L.ink }}>
                  {step.title}
                </h3>
                <p className="leading-relaxed" style={{ color: L.muted }}>
                  {step.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─── Fitur ───────────────────────────────────────────────────────────────

const FEATURE_ICONS = [IconMessageCircle, IconGift, IconMusic, IconPhoto, IconCalendarEvent, IconMapPin];

export function Features({ content = DEFAULT_LANDING_CONTENT.features }: { content?: LandingContent["features"] }) {
  return (
    <section id="fitur" className="scroll-mt-16 py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-16 px-4 md:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <Reveal className="space-y-8">
          <div className="space-y-4">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <Display className="text-[2.5rem] sm:text-5xl">{content.heading}</Display>
            <p className="max-w-md text-[17px] leading-relaxed" style={{ color: L.muted }}>
              {content.description}
            </p>
          </div>
          {/* WhatsApp message mock */}
          <div className="max-w-sm rounded-2xl p-4" style={{ background: "#E7DFD2" }}>
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#DCF3C8] p-3 text-[14px] leading-relaxed text-[#1E2A1A] shadow-sm">
              <p>Kepada Yth. Bapak Andi Wijaya,</p>
              <p className="mt-2">Tanpa mengurangi rasa hormat, kami mengundang Bapak untuk hadir di pernikahan kami.</p>
              <p className="mt-2 break-all text-[#1C6EA4] underline">undanginyuk.id/adit-sarah?to=Bapak+Andi</p>
              <p className="mt-1 text-right text-[11px] text-[#6B7A63]">09.41 ✓✓</p>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: L.muted }}>
              <IconBrandWhatsapp size={16} /> Terkirim dari daftar tamu UNDANGIN YUK
            </div>
          </div>
        </Reveal>

        <div className="grid gap-x-10 sm:grid-cols-2">
          {content.items.map((item, i) => {
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
            return (
              <Reveal key={`${item.title}-${i}`} delay={(i % 2) * 70}>
                <div className="flex gap-4 border-t py-6" style={{ borderColor: L.line }}>
                  <Icon size={22} stroke={1.5} className="mt-0.5 shrink-0" style={{ color: L.accent }} />
                  <div className="space-y-1.5">
                    <h3 className="font-medium" style={{ color: L.ink }}>
                      {item.title}
                    </h3>
                    <p className="text-[15px] leading-relaxed" style={{ color: L.muted }}>
                      {item.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Harga ───────────────────────────────────────────────────────────────

const rupiah = (n: number) => (n === 0 ? "Gratis" : `Rp ${new Intl.NumberFormat("id-ID").format(n)}`);
const count = (n: number) => (n === Infinity ? "Tanpa batas" : String(n));

function planFeatures(key: PlanType) {
  const p = PLAN_LIMITS[key];
  const f: string[] = [
    `${count(p.maxGuests)} tamu bernama`,
    p.aiDesignQuota ? `${p.aiDesignQuota}× desain AI` : "",
    p.maxGalleryPhotos ? `Galeri ${count(p.maxGalleryPhotos)} foto` : "",
    p.canUseMusic ? "Musik latar" : "",
    p.canUseRSVP ? "RSVP & buku tamu" : "",
    p.canUseLoveStory ? "Kisah cinta" : "",
    p.canUseDigitalGift ? "Amplop digital" : "",
    p.canUseVideo ? "Video" : "",
    p.canRemoveWatermark ? "Tanpa watermark" : "",
    p.activeDays === null ? "Aktif selamanya" : `Aktif ${p.activeDays} hari`,
  ];
  return f.filter(Boolean);
}

export function Pricing() {
  const keys = PAID_PLANS;
  const featured = "EKSKLUSIF";
  return (
    <section id="harga" className="scroll-mt-16 border-t py-24 md:py-32" style={{ borderColor: L.line, background: L.surface }}>
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal className="mx-auto mb-14 max-w-2xl space-y-4 text-center">
          <Eyebrow>Harga</Eyebrow>
          <Display className="text-[2.5rem] sm:text-5xl">Sekali bayar untuk satu acara.</Display>
          <p className="text-[17px]" style={{ color: L.muted }}>
            Coba dan pratinjau undangan gratis sebelum bayar. Upgrade kapan saja cukup bayar selisih, atau tambah kuota +{GUEST_ADDON_SIZE} tamu {rupiah(GUEST_ADDON_PRICE)}.
          </p>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {keys.map((k, i) => {
            const p = PLAN_LIMITS[k];
            const hot = k === featured;
            return (
              <Reveal key={k} delay={i * 80}>
                <div
                  className="flex h-full flex-col rounded-2xl border p-7"
                  style={hot ? { background: L.night, color: "#F3EBDD", borderColor: L.night } : { background: L.bg, borderColor: L.line, color: L.ink }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-(family-name:--font-landing-display) text-2xl">{p.name}</h3>
                    {hot && (
                      <span className="rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: L.accentBright, color: L.night }}>
                        Paling lengkap
                      </span>
                    )}
                  </div>
                  <p className="mt-6 font-(family-name:--font-landing-display) text-5xl lining-nums">{rupiah(p.price)}</p>
                  <p className="mt-1 text-sm" style={{ color: hot ? "#B8AD9A" : L.muted }}>
                    per acara
                  </p>
                  <ul className="mt-8 flex-1 space-y-3 text-[15px]">
                    {planFeatures(k).map((f) => (
                      <li key={f} className="flex gap-3">
                        <IconCheck size={18} className="mt-0.5 shrink-0" style={{ color: hot ? L.accentBright : L.accent }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className="mt-8 flex h-12 items-center justify-center rounded-full text-[15px] font-medium transition-opacity hover:opacity-90"
                    style={hot ? { background: "#F3EBDD", color: L.night } : { border: `1px solid ${L.ink}`, color: L.ink }}
                  >
                    Pilih {p.name}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Mitra / Vendor B2B ──────────────────────────────────────────────────

export interface PartnerVendor {
  id: string;
  agencyName: string;
  agencyLogo: string | null;
  agencyInstagram: string | null;
  agencyVerified: boolean;
}

/** Below this many partners the logos sit still instead of running. */
const MARQUEE_MIN = 6;

/** One partner in the strip: the logo only (muted until hovered), or the business name as a wordmark when there is no logo. */
function PartnerLogo({ partner, focusable }: { partner: PartnerVendor; focusable: boolean }) {
  const mark = partner.agencyLogo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={partner.agencyLogo}
      alt={partner.agencyName}
      loading="lazy"
      className="h-10 w-auto max-w-[140px] object-contain opacity-60 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 md:h-12 md:max-w-[160px]"
    />
  ) : (
    <span className="whitespace-nowrap font-(family-name:--font-landing-display) text-2xl font-medium opacity-70 transition duration-300 group-hover:opacity-100 md:text-[1.7rem]" style={{ color: L.ink }}>
      {partner.agencyName}
    </span>
  );
  const title = partner.agencyVerified ? `${partner.agencyName} · Mitra terverifikasi` : partner.agencyName;

  return partner.agencyInstagram ? (
    <a
      href={`https://instagram.com/${partner.agencyInstagram.replace(/^@/, "")}`}
      target="_blank"
      rel="noreferrer"
      title={title}
      tabIndex={focusable ? undefined : -1}
      className="group flex h-14 items-center rounded-lg outline-offset-4"
    >
      {mark}
    </a>
  ) : (
    <span title={title} className="group flex h-14 items-center">
      {mark}
    </span>
  );
}

export function PartnerVendors({ partners }: { partners: PartnerVendor[] }) {
  return (
    <section id="mitra" className="scroll-mt-16 border-t py-20 md:py-24" style={{ borderColor: L.line }}>
      <div className="mx-auto max-w-6xl space-y-10 px-4 md:px-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-3">
            <Eyebrow>Mitra &amp; Vendor</Eyebrow>
            <Display className="text-[2.1rem] sm:text-4xl">Wedding Organizer &amp; vendor rekanan.</Display>
            <p className="max-w-xl text-[15px]" style={{ color: L.muted }}>
              Vendor yang terdaftar di program Mitra UNDANGIN YUK otomatis tampil di sini untuk menjangkau lebih banyak calon pengantin.
            </p>
          </div>
          <Link
            href="/mitra"
            className="inline-flex h-11 w-fit shrink-0 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors hover:bg-black/5"
            style={{ borderColor: L.line, color: L.ink }}
          >
            Gabung jadi Mitra <IconArrowRight size={16} />
          </Link>
        </div>

        {partners.length > 0 ? (
          partners.length >= MARQUEE_MIN ? (
            // Enough partners: a slow running strip (pauses on hover/focus, static for reduced motion)
            <div
              className="uy-marquee-viewport -mx-4 overflow-hidden md:mx-0"
              style={{
                maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
              }}
            >
              <div className="uy-marquee flex w-max" style={{ ["--uy-marquee-duration" as string]: `${Math.max(30, partners.length * 5)}s` }}>
                {[0, 1].map((copy) => (
                  <ul key={copy} aria-hidden={copy === 1 ? true : undefined} className="flex shrink-0 items-center gap-14 pr-14">
                    {partners.map((p) => (
                      <li key={p.id} className="shrink-0">
                        <PartnerLogo partner={p} focusable={copy === 0} />
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          ) : (
            // Few partners: a calm static row; looping 1–3 logos looks thin
            <ul className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8 py-2">
              {partners.map((p) => (
                <li key={p.id}>
                  <PartnerLogo partner={p} focusable />
                </li>
              ))}
            </ul>
          )
        ) : (
          <div
            className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed p-6 sm:flex-row sm:items-center"
            style={{ borderColor: L.line, background: L.surface }}
          >
            <p className="text-sm" style={{ color: L.muted }}>
              Punya usaha Wedding Organizer, MUA, fotografer, atau percetakan? Daftar di halaman Mitra dan logo usaha Anda otomatis tampil di sini.
            </p>
            <Link
              href="/mitra"
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-5 text-xs font-medium"
              style={{ background: L.ink, color: L.bg }}
            >
              Aktifkan Akun Mitra <IconArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────

export function Faq({ content = DEFAULT_LANDING_CONTENT.faq }: { content?: LandingContent["faq"] }) {
  return (
    <section id="faq" className="scroll-mt-16 py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 md:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal className="space-y-4">
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <Display className="text-[2.5rem] sm:text-5xl">{content.heading}</Display>
        </Reveal>
        <div>
          {content.items.map((qa, i) => (
            <details key={`${qa.question}-${i}`} className="group border-t py-2 last:border-b" style={{ borderColor: L.line }}>
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 text-[17px] font-medium [&::-webkit-details-marker]:hidden" style={{ color: L.ink }}>
                {qa.question}
                <IconPlus size={20} className="shrink-0 transition-transform duration-300 group-open:rotate-45" style={{ color: L.accent }} />
              </summary>
              <p className="pb-5 pr-10 leading-relaxed" style={{ color: L.muted }}>
                {qa.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA & footer ────────────────────────────────────────────────────────

export function FinalCta({ content = DEFAULT_LANDING_CONTENT.finalCta }: { content?: LandingContent["finalCta"] }) {
  return (
    <section className="px-4 pb-24 md:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] px-6 py-20 text-center md:py-28" style={{ background: L.night, color: "#F3EBDD" }}>
        <Reveal className="mx-auto max-w-2xl space-y-8">
          <Rule light className="mx-auto" />
          <Display className="text-[2.6rem] sm:text-6xl">
            {content.headingPrefix}
            {content.headingHighlight ? (
              <em className="italic" style={{ color: L.accentBright }}>
                {content.headingHighlight}
              </em>
            ) : null}
            {content.headingSuffix}
          </Display>
          <p className="text-[17px] text-[#B8AD9A]">{content.description}</p>
          <Link href="/register" className="mx-auto flex h-13 w-fit items-center gap-2 rounded-full px-8 text-[15px] font-medium transition-opacity hover:opacity-90" style={{ background: "#F3EBDD", color: L.night }}>
            {content.buttonLabel} <IconArrowRight size={18} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingFooter({ content = DEFAULT_LANDING_CONTENT.footer }: { content?: LandingContent["footer"] }) {
  return (
    <footer className="border-t pb-28 pt-14 md:pb-14" style={{ borderColor: L.line }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 md:flex-row md:items-start md:justify-between md:px-6">
        <div className="max-w-xs space-y-3">
          <Wordmark />
          <p className="text-sm leading-relaxed" style={{ color: L.muted }}>
            {content.tagline}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          {[
            ["Produk", [["Desain AI", "/#desain-ai"], ["Koleksi", "/desain"], ["Harga", "/#harga"]]],
            ["Akun", [["Masuk", "/login"], ["Daftar", "/register"]]],
            ["Bantuan", [["FAQ", "/#faq"]]],
          ].map(([title, links]) => (
            <div key={title as string} className="space-y-1">
              <p className="pb-1 font-medium" style={{ color: L.ink }}>
                {title as string}
              </p>
              {(links as string[][]).map(([l, h]) => (
                <Link key={l} href={h} className="flex min-h-10 items-center transition-colors hover:text-(--ink)" style={{ color: L.muted, ["--ink" as string]: L.ink }}>
                  {l}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl px-4 text-xs md:px-6" style={{ color: L.muted }}>
        {content.copyright}
      </p>
    </footer>
  );
}

/** Mobile-only CTA that appears after the hero. */
export function StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 640);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 p-3 transition-transform duration-300 md:hidden ${show ? "translate-y-0" : "translate-y-full"}`}>
      <Link href="/register" className="flex h-13 items-center justify-between rounded-full pl-6 pr-2 text-[15px] font-medium shadow-lg" style={{ background: L.ink, color: L.bg }}>
        Buat undangan kalian
        <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: L.accentBright, color: L.night }}>
          <IconArrowRight size={18} />
        </span>
      </Link>
    </div>
  );
}
