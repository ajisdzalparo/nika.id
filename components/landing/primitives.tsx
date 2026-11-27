"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import AiDesignTemplate from "@/components/templates/ai-design";
import { MOCK_WEDDING_DATA } from "@/lib/constants/mock-wedding-data";
import type { AiTheme } from "@/lib/ai-design/schema";
import type { WeddingData } from "@/types/wedding";

/** Landing palette: champagne paper, espresso ink and gold. Scoped to the landing so the dashboard keeps its own tokens. */
export const L = {
  bg: "#FCF8F1",
  surface: "#FFFFFF",
  blush: "#F6EEDF", // champagne, alternate section background
  ink: "#1F1A14",
  muted: "#6B5F50", // 6.1:1 on bg
  line: "#E9DDC6",
  accent: "#8A6424", // deep gold, readable as text on champagne (5.0:1)
  accentSoft: "#F3E6C8",
  accentBright: "#D9B56A", // bright gold for text on the night background
  night: "#1A1510", // espresso, warmer than black
  nightText: "#F6EEDD",
  nightMuted: "#CDBF9F",
  nightLine: "#3A3122",
  /** Gold foil for primary buttons; ink text on it stays above 7:1 */
  foil: "linear-gradient(120deg, #B8903F 0%, #E6CB86 45%, #C9A24E 70%, #A8823A 100%)",
};

type RevealDirection = "up" | "down" | "left" | "right" | "scale";

const HIDDEN_STATE: Record<RevealDirection, string> = {
  up: "translate-y-4 opacity-0",
  down: "-translate-y-4 opacity-0",
  left: "-translate-x-5 opacity-0",
  right: "translate-x-5 opacity-0",
  scale: "scale-[0.96] opacity-0",
};

export function Reveal({ children, className = "", delay = 0, direction = "up" }: { children: ReactNode; className?: string; delay?: number; direction?: RevealDirection }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setShown(true), io.disconnect()), { rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      data-shown={shown}
      style={{ transitionDelay: `${delay}ms` }}
      className={`group/reveal transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${shown ? "translate-x-0 translate-y-0 scale-100 opacity-100" : `${HIDDEN_STATE[direction]} motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100`} ${className}`}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.28em]" style={{ color: light ? L.accentBright : L.accent }}>
      {children}
    </p>
  );
}

export function Display({ children, className = "", as: Tag = "h2" }: { children: ReactNode; className?: string; as?: "h1" | "h2" | "h3" }) {
  return <Tag className={`font-(family-name:--font-landing-display) font-normal lining-nums leading-[1.08] tracking-[-0.02em] ${className}`}>{children}</Tag>;
}

/** Thin gold rule with a diamond, the landing's single ornament. */
export function Rule({ light = false, className = "" }: { light?: boolean; className?: string }) {
  const c = light ? L.accentBright : L.accent;
  return (
    <svg viewBox="0 0 160 12" className={`h-3 w-40 ${className}`} aria-hidden="true">
      <path d="M0 6H68M92 6H160" stroke={c} strokeWidth="1" opacity=".6" />
      <path d="M80 1L85 6L80 11L75 6Z" fill={c} />
    </svg>
  );
}

/**
 * A phone showing a real invitation rendered by the AI theme engine.
 * `zoom` keeps scrolling and hit-testing correct (unlike transform: scale).
 */
const AUTOPLAY_SPEED = 70; // px per second inside the phone
const AUTOPLAY_HOLD_TOP_MS = 2200;
const AUTOPLAY_HOLD_BOTTOM_MS = 1600;
const AUTOPLAY_FADE_MS = 450;

/**
 * Scrolls an element from top to bottom and loops, like a screen recording. Runs only while the element
 * is on screen and the tab is visible; with reduced motion it stays still on the cover.
 * Returns the current opacity so the jump back to the top can fade.
 */
function useAutoScroll(ref: RefObject<HTMLDivElement | null>, enabled: boolean) {
  const [faded, setFaded] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let visible = false;
    let raf = 0;
    let last = 0;
    let holdUntil = performance.now() + AUTOPLAY_HOLD_TOP_MS;
    let resetting = false;
    let position = 0;
    const timers: number[] = [];

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(now - last, 250) : 0;
      last = now;
      if (!visible || document.hidden || resetting || now < holdUntil) return;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      position = Math.min(max, position + (AUTOPLAY_SPEED * dt) / 1000);
      el.scrollTop = position;
      if (position >= max) {
        resetting = true;
        timers.push(
          window.setTimeout(() => {
            setFaded(true);
            timers.push(
              window.setTimeout(() => {
                position = 0;
                el.scrollTop = 0;
                setFaded(false);
                resetting = false;
                holdUntil = performance.now() + AUTOPLAY_HOLD_TOP_MS;
              }, AUTOPLAY_FADE_MS),
            );
          }, AUTOPLAY_HOLD_BOTTOM_MS),
        );
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(el);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [ref, enabled]);
  return faded;
}

/**
 * Phone mockup with a live invitation inside.
 * - default: a still cover (decorative).
 * - `autoplay`: the opened invitation scrolls itself in a loop. It never takes touches, so on phones
 *   the page keeps scrolling when a finger lands on the mockup.
 * - `interactive`: the visitor scrolls and taps inside (avoid on mobile-heavy pages: it traps the scroll).
 */
export function Phone({
  theme,
  zoom = 0.78,
  interactive = false,
  autoplay = false,
  className = "",
  guestName = "Bapak & Ibu Tamu",
  data,
}: {
  theme: AiTheme;
  zoom?: number;
  interactive?: boolean;
  autoplay?: boolean;
  className?: string;
  guestName?: string;
  data?: WeddingData;
}) {
  const width = Math.round(375 * zoom);
  const height = Math.round(720 * zoom);
  const scrollRef = useRef<HTMLDivElement>(null);
  const live = interactive && !autoplay;
  const faded = useAutoScroll(scrollRef, autoplay);
  return (
    <div className={`relative shrink-0 rounded-[38px] bg-[#111] p-[7px] shadow-[0_30px_60px_-20px_rgba(26,21,16,.45)] ${className}`} style={{ width: width + 14 }}>
      <div className="absolute left-1/2 top-[13px] z-20 h-[18px] w-[76px] -translate-x-1/2 rounded-full bg-[#111]" />
      <div className={`overflow-hidden rounded-[31px] bg-white ${live ? "" : "pointer-events-none select-none"}`} style={{ width, height }} aria-hidden={autoplay || undefined}>
        <div
          ref={scrollRef}
          className={`h-full transition-opacity ease-out ${live ? "overflow-y-auto overscroll-contain [scrollbar-width:none]" : "overflow-hidden"}`}
          style={{ opacity: faded ? 0 : 1, transitionDuration: `${AUTOPLAY_FADE_MS}ms` }}
        >
          <div style={{ zoom, width: 375 }}>
            <AiDesignTemplate data={{ ...(data ?? MOCK_WEDDING_DATA), guestName }} theme={theme} embedded forceOpened={autoplay} />
          </div>
        </div>
      </div>
    </div>
  );
}
