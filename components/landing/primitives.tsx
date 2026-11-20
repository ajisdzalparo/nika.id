"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import AiDesignTemplate from "@/components/templates/ai-design";
import { MOCK_WEDDING_DATA } from "@/lib/constants/mock-wedding-data";
import type { AiTheme } from "@/lib/ai-design/schema";
import type { WeddingData } from "@/types/wedding";

/** Landing palette — scoped to the landing page so the dashboard keeps its own tokens. */
export const L = {
  bg: "#F7F3EC",
  surface: "#FFFDF9",
  ink: "#1E1B17",
  muted: "#6B6358",
  line: "#E4DCCF",
  accent: "#8A6A2F", // deep antique gold: readable as text on ivory (5.1:1)
  accentBright: "#C9A45C",
  night: "#15130F",
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
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${shown ? "translate-x-0 translate-y-0 scale-100 opacity-100" : `${HIDDEN_STATE[direction]} motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100`} ${className}`}
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
  return <Tag className={`font-(family-name:--font-landing-display) font-medium lining-nums leading-[1.04] tracking-[-0.01em] ${className}`}>{children}</Tag>;
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
export function Phone({ theme, zoom = 0.78, interactive = false, className = "", guestName = "Bapak & Ibu Tamu", data }: { theme: AiTheme; zoom?: number; interactive?: boolean; className?: string; guestName?: string; data?: WeddingData }) {
  const width = Math.round(375 * zoom);
  const height = Math.round(720 * zoom);
  return (
    <div className={`relative shrink-0 rounded-[38px] bg-[#111] p-[7px] shadow-[0_30px_60px_-20px_rgba(30,27,23,.45)] ${className}`} style={{ width: width + 14 }}>
      <div className="absolute left-1/2 top-[13px] z-20 h-[18px] w-[76px] -translate-x-1/2 rounded-full bg-[#111]" />
      <div className={`overflow-hidden rounded-[31px] bg-white ${interactive ? "" : "pointer-events-none select-none"}`} style={{ width, height }}>
        <div className={`h-full ${interactive ? "overflow-y-auto overscroll-contain [scrollbar-width:none]" : "overflow-hidden"}`}>
          <div style={{ zoom, width: 375 }}>
            <AiDesignTemplate data={{ ...(data ?? MOCK_WEDDING_DATA), guestName }} theme={theme} embedded />
          </div>
        </div>
      </div>
    </div>
  );
}
