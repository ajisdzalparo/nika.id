import { Cormorant_Garamond } from "next/font/google";
import type { CSSProperties } from "react";

/** Display face shared by the landing page, dashboards and auth pages. */
export const studioDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-landing-display",
});

/** Root class for every app shell: palette scope (see globals.css) + display font. */
export const studioClass = `studio ${studioDisplay.variable}`;

/** Sidebar tokens in the same ivory & antique-gold palette. */
export const shellTokens = {
  "--sidebar-width": "calc(var(--spacing) * 68)",
  "--header-height": "calc(var(--spacing) * 14)",
  "--sidebar": "#F1ECE3",
  "--sidebar-foreground": "#1E1B17",
  "--sidebar-accent": "#E6DECF",
  "--sidebar-accent-foreground": "#1E1B17",
  "--sidebar-border": "#E1D8C9",
  "--sidebar-primary": "#1E1B17",
  "--sidebar-primary-foreground": "#F7F3EC",
  "--sidebar-ring": "#8A6A2F",
} as CSSProperties;
