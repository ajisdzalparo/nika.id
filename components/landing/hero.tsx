"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { AI_THEME_PRESETS } from "@/lib/ai-design/presets";
import { DEFAULT_LANDING_CONTENT, type LandingContent } from "@/lib/landing-content-shared";
import { Display, Eyebrow, L, Phone } from "./primitives";

const HERO_PHONES: { key: keyof typeof AI_THEME_PRESETS; label: string; tags: string }[] = [
  { key: "malam-keemasan", label: "Malam Keemasan", tags: "Mewah · Filigree · Resepsi malam" },
  { key: "taman-pastel", label: "Taman Pastel", tags: "Pesta kebun · Sage · Santai" },
  { key: "kawung-sogan", label: "Kawung Sogan", tags: "Adat Jawa · Kawung · Klasik" },
];

const SLIDE_MS = 6000;

/** Splits a headline into words that rise in one after another, starting at `offset`. */
function Words({ text, offset = 0, className = "" }: { text: string; offset?: number; className?: string }) {
  let word = 0;
  return (
    <>
      {text.split(/(\s+)/).map((part, i) => {
        if (!part || /^\s+$/.test(part)) return part;
        const delay = offset + word++ * 45;
        return (
          <span key={i} className={`uy-word ${className}`} style={{ animationDelay: `${delay}ms` }}>
            {part}
          </span>
        );
      })}
    </>
  );
}

/**
 * Three real invitations in a fan. The front one changes every few seconds: the cards trade places
 * (left → front → right) instead of re-rendering, so the motion stays smooth.
 */
function PhoneFan({ active, onPick }: { active: number; onPick: (i: number) => void }) {
  const n = HERO_PHONES.length;
  return (
    <div className="relative mx-auto h-[380px] w-full max-w-[520px] [--fan-x:92px] sm:h-[520px] sm:[--fan-x:150px]">
      {HERO_PHONES.map((p, i) => {
        // -1 = left, 0 = front, 1 = right
        const slot = ((i - active + n + 1) % n) - 1;
        const front = slot === 0;
        return (
          <div
            key={p.key}
            aria-hidden={!front || undefined}
            className="absolute left-1/2 top-0 origin-bottom transition-[transform,filter,opacity] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{
              transform: `translateX(calc(-50% + var(--fan-x) * ${slot})) translateY(${front ? 0 : 28}px) rotate(${slot * 7}deg) scale(${front ? 1 : 0.84})`,
              zIndex: front ? 20 : 10,
              filter: front ? "none" : "saturate(.85)",
              opacity: front ? 1 : 0.92,
            }}
          >
            <div className="[zoom:0.74] sm:[zoom:1]">
              <Phone theme={AI_THEME_PRESETS[p.key].theme} zoom={0.66} />
            </div>
            {/* The phone itself ignores clicks; a side card brings its design to the front */}
            {!front && <button type="button" tabIndex={-1} onClick={() => onPick(i)} className="absolute inset-0 cursor-pointer rounded-[38px]" aria-label={`Tampilkan desain ${p.label}`} />}
          </div>
        );
      })}
    </div>
  );
}

export function Hero({ content = DEFAULT_LANDING_CONTENT.hero }: { content?: LandingContent["hero"] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setActive((x) => (x + 1) % HERO_PHONES.length), SLIDE_MS);
    return () => clearTimeout(id);
  }, [active, paused]);

  const current = HERO_PHONES[active];
  const prefixWords = content.headlinePrefix.split(/\s+/).filter(Boolean).length;
  const highlightWords = (content.headlineHighlight ?? "").split(/\s+/).filter(Boolean).length;

  return (
    <section className="relative overflow-hidden pb-16 pt-24 sm:pb-20 md:pb-24 md:pt-32">
      {/* Soft champagne wash + lattice behind everything */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(60% 50% at 78% 28%, ${L.accentSoft} 0%, transparent 70%), radial-gradient(40% 40% at 8% 90%, ${L.blush} 0%, transparent 70%)` }} />
      <div aria-hidden className="uy-lattice pointer-events-none absolute inset-0" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6">
        <div className="order-2 space-y-8 lg:order-1">
          <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-700">
            <span className="rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white" style={{ background: L.accent }}>
              Desain AI
            </span>
            <Eyebrow>{content.eyebrow}</Eyebrow>
          </div>

          <Display as="h1" className="text-[2.45rem] sm:text-[3.4rem] lg:text-[3.8rem] xl:text-[4.2rem]">
            <Words text={content.headlinePrefix} offset={80} />
            {content.headlineHighlight ? (
              <em className="italic" style={{ color: L.accent }}>
                <Words text={content.headlineHighlight} offset={80 + prefixWords * 45} />
              </em>
            ) : null}
            <Words text={content.headlineSuffix} offset={80 + (prefixWords + highlightWords) * 45} />
          </Display>

          <p className="max-w-lg text-[17px] leading-relaxed animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:350ms] [animation-fill-mode:backwards]" style={{ color: L.muted }}>
            {content.subheadline}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:430ms] [animation-fill-mode:backwards]">
            <Link
              href="/register"
              className="uy-sheen group flex h-13 items-center justify-center gap-3 rounded-full pl-7 pr-2 text-[15px] font-semibold shadow-[0_14px_30px_-12px_rgba(176,138,62,.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-12px_rgba(176,138,62,.8)]"
              style={{ background: L.foil, color: L.ink }}
            >
              {content.primaryCta}
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1F1A14] text-[#F6EEDD] transition-transform duration-300 group-hover:translate-x-0.5">
                <IconArrowRight size={18} />
              </span>
            </Link>
            <a href="#desain-ai" className="flex h-13 items-center justify-center rounded-full border bg-white/70 px-7 text-[15px] font-medium backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white" style={{ borderColor: L.line, color: L.ink }}>
              {content.secondaryCta}
            </a>
          </div>

          <dl className="grid max-w-md grid-cols-3 gap-4 border-t pt-6 animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:520ms] [animation-fill-mode:backwards]" style={{ borderColor: L.line }}>
            {content.highlights.map((item) => (
              <div key={item.title} className="space-y-1">
                <dt className="font-(family-name:--font-landing-display) text-lg leading-tight sm:text-xl" style={{ color: L.accent }}>
                  {item.title}
                </dt>
                <dd className="text-xs leading-snug" style={{ color: L.muted }}>
                  {item.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Real invitations rendered by the theme engine */}
        <div
          className="order-1 flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-1000 lg:order-2"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="w-full animate-uy-float">
            <PhoneFan active={active} onPick={setActive} />
          </div>

          <div className="w-full max-w-xs space-y-3 text-center">
            <p key={current.key} className="animate-in fade-in slide-in-from-bottom-1 duration-500">
              <span className="font-(family-name:--font-landing-display) text-2xl italic" style={{ color: L.ink }}>
                {current.label}
              </span>
              <span className="mt-0.5 block text-xs" style={{ color: L.muted }}>
                {current.tags}
              </span>
            </p>
            <div className="flex items-center gap-2" role="tablist" aria-label="Contoh desain">
              {HERO_PHONES.map((p, i) => (
                <button
                  key={p.key}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={p.label}
                  onClick={() => setActive(i)}
                  className="flex h-8 flex-1 items-center"
                >
                  <span className="relative block h-1 w-full overflow-hidden rounded-full" style={{ background: L.line }}>
                    {i < active && <span className="absolute inset-0 rounded-full" style={{ background: L.accent }} />}
                    {i === active && (
                      <span
                        key={`${active}-${paused}`}
                        className={`absolute inset-0 rounded-full ${paused ? "" : "uy-fill"}`}
                        style={{ background: L.accent, ["--uy-fill-duration" as string]: `${SLIDE_MS}ms` }}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
