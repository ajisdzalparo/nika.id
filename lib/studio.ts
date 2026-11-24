import { Bodoni_Moda, Plus_Jakarta_Sans } from "next/font/google";
import type { CSSProperties } from "react";

/** Root class for every app shell: palette + fonts scope (see globals.css). Font variables are set on <body>. */
export const studioClass = "studio";

/** Sidebar tokens in the same ivory & antique-gold palette. */
export const shellTokens = {
  "--sidebar-width": "calc(var(--spacing) * 68)",
  "--header-height": "calc(var(--spacing) * 14)",
  "--sidebar": "#F4EDDF",
  "--sidebar-foreground": "#1F1A14",
  "--sidebar-accent": "#EEE2C9",
  "--sidebar-accent-foreground": "#1F1A14",
  "--sidebar-border": "#E9DDC6",
  "--sidebar-primary": "#1F1A14",
  "--sidebar-primary-foreground": "#FCF8F1",
  "--sidebar-ring": "#8A6424",
} as CSSProperties;

/** Brand fonts for the landing and every app shell: high-contrast Bodoni for headlines (gold-foil stationery feel) and a warm sans for text. */
export const landingDisplay = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-landing-display",
});

export const landingSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-landing-sans",
});

/** Root class for the landing and collection pages. */
export const landingFontClass = `${landingDisplay.variable} ${landingSans.variable} font-(family-name:--font-landing-sans)`;
