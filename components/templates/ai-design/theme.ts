import type { CSSProperties } from "react";
import type { AiTheme } from "@/lib/ai-design/schema";

// Google Fonts axes per family. Each family loads in its own <link> so one bad
// request can never break the others.
const FONT_SPECS: Record<string, { axes?: string; italic: boolean; fallback: "serif" | "sans-serif" | "cursive" }> = {
  "Cormorant Garamond": { axes: "ital,wght@0,400;0,500;0,600;1,400;1,500", italic: true, fallback: "serif" },
  "Playfair Display": { axes: "ital,wght@0,400;0,500;0,600;1,400;1,500", italic: true, fallback: "serif" },
  Cinzel: { axes: "wght@400;500;600", italic: false, fallback: "serif" },
  Italiana: { italic: false, fallback: "serif" },
  Marcellus: { italic: false, fallback: "serif" },
  "Bodoni Moda": { axes: "ital,wght@0,400;0,500;0,600;1,400;1,500", italic: true, fallback: "serif" },
  "DM Serif Display": { axes: "ital@0;1", italic: true, fallback: "serif" },
  Fraunces: { axes: "ital,wght@0,400;0,500;0,600;1,400;1,500", italic: true, fallback: "serif" },
  "Gilda Display": { italic: false, fallback: "serif" },
  "Tenor Sans": { italic: false, fallback: "sans-serif" },
  "Great Vibes": { italic: false, fallback: "cursive" },
  Parisienne: { italic: false, fallback: "cursive" },
  "Pinyon Script": { italic: false, fallback: "cursive" },
  Allura: { italic: false, fallback: "cursive" },
  "Alex Brush": { italic: false, fallback: "cursive" },
  Jost: { axes: "wght@300;400;500;600", italic: false, fallback: "sans-serif" },
  Manrope: { axes: "wght@300;400;500;600", italic: false, fallback: "sans-serif" },
  "DM Sans": { axes: "wght@300;400;500;600", italic: false, fallback: "sans-serif" },
  Figtree: { axes: "wght@300;400;500;600", italic: false, fallback: "sans-serif" },
  Lora: { axes: "ital,wght@0,400;0,500;0,600;1,400", italic: true, fallback: "serif" },
  "EB Garamond": { axes: "ital,wght@0,400;0,500;0,600;1,400", italic: true, fallback: "serif" },
  Karla: { axes: "wght@300;400;500;600", italic: false, fallback: "sans-serif" },
  Outfit: { axes: "wght@300;400;500;600", italic: false, fallback: "sans-serif" },
};

export function fontHref(family: string) {
  const spec = FONT_SPECS[family];
  const name = family.replace(/ /g, "+");
  return `https://fonts.googleapis.com/css2?family=${name}${spec?.axes ? `:${spec.axes}` : ""}&display=swap`;
}

function stack(family: string) {
  return `"${family}", ${FONT_SPECS[family]?.fallback ?? "serif"}`;
}

export function themeFonts(theme: AiTheme) {
  return Array.from(new Set([theme.typography.display, theme.typography.names, theme.typography.body]));
}

/** Italic only when the display face actually ships an italic (no faux slanting). */
export function displayItalic(theme: AiTheme) {
  return theme.typography.displayItalic && !!FONT_SPECS[theme.typography.display]?.italic;
}

export function isScript(family: string) {
  return FONT_SPECS[family]?.fallback === "cursive";
}

const TEXTURES: Record<AiTheme["texture"], string | undefined> = {
  none: undefined,
  paper: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  grain: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .08 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  linen: `repeating-linear-gradient(0deg, rgba(0,0,0,.018) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,.018) 0 1px, transparent 1px 3px)`,
};

export function themeStyle(theme: AiTheme): CSSProperties {
  const p = theme.palette;
  return {
    "--bg": p.background,
    "--surface": p.surface,
    "--ink": p.ink,
    "--muted": p.muted,
    "--accent": p.accent,
    "--accent-soft": p.accentSoft,
    "--on-accent": p.onAccent,
    "--font-display": stack(theme.typography.display),
    "--font-names": stack(theme.typography.names),
    "--font-body": stack(theme.typography.body),
    backgroundColor: p.background,
    backgroundImage: TEXTURES[theme.texture],
    color: p.ink,
    fontFamily: stack(theme.typography.body),
  } as CSSProperties;
}

export function labelClass(theme: AiTheme) {
  switch (theme.typography.labelStyle) {
    case "uppercase-tracked":
      return "uppercase tracking-[0.32em] text-[11px] font-medium";
    case "small-caps":
      return "[font-variant:small-caps] lowercase tracking-[0.14em] text-[15px]";
    default:
      return "text-sm tracking-wide";
  }
}

export function photoShape(theme: AiTheme) {
  if (theme.corners === "arch") return "rounded-t-full rounded-b-[18px]";
  if (theme.corners === "soft") return "rounded-[18px]";
  return "rounded-none";
}

export function cardShape(theme: AiTheme) {
  return theme.corners === "sharp" ? "rounded-none" : "rounded-[18px]";
}
