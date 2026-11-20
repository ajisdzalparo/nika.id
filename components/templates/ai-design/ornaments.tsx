"use client";

import { useId, type ReactNode } from "react";
import type { AiTheme } from "@/lib/ai-design/schema";

type Ornament = AiTheme["ornament"];

function shade(hex: string, amount: number) {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const mix = (c: number) => Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Metallic foil gradient for text (used on couple names when theme.metallic). */
export function foilTextStyle(theme: AiTheme) {
  if (!theme.metallic) return { color: "var(--accent)" };
  const a = theme.palette.accent;
  return {
    backgroundImage: `linear-gradient(115deg, ${shade(a, -0.25)} 0%, ${shade(a, 0.45)} 28%, ${a} 50%, ${shade(a, 0.55)} 72%, ${shade(a, -0.2)} 100%)`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  } as const;
}

/** Wraps SVG content with a paint that is either the flat accent or a foil gradient. */
function Svg({ theme, viewBox, className, children }: { theme: AiTheme; viewBox: string; className?: string; children: (paint: string) => ReactNode }) {
  const id = useId().replace(/:/g, "");
  const a = theme.palette.accent;
  const paint = theme.metallic ? `url(#foil-${id})` : "var(--accent)";
  return (
    <svg viewBox={viewBox} className={className} aria-hidden="true" fill="none">
      {theme.metallic && (
        <defs>
          <linearGradient id={`foil-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={shade(a, -0.25)} />
            <stop offset=".35" stopColor={shade(a, 0.5)} />
            <stop offset=".55" stopColor={a} />
            <stop offset=".8" stopColor={shade(a, 0.4)} />
            <stop offset="1" stopColor={shade(a, -0.2)} />
          </linearGradient>
        </defs>
      )}
      {children(paint)}
    </svg>
  );
}

const leaf = (x: number, y: number, rot: number, s = 1) => (
  <path key={`${x}-${y}-${rot}`} d="M0 0C5-6 14-6 20 0C14 6 5 6 0 0Z" transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} />
);

// ─── Divider ─────────────────────────────────────────────────────────────
export function Divider({ theme, className = "w-56 h-7 mx-auto" }: { theme: AiTheme; className?: string }) {
  const type: Ornament = theme.ornament;
  return (
    <Svg theme={theme} viewBox="0 0 240 30" className={className}>
      {(p) => {
        switch (type) {
          case "none":
            return <circle cx="120" cy="15" r="2" fill={p} />;
          case "minimal-rule":
            return (
              <g stroke={p} strokeWidth="1">
                <path d="M30 15H108M132 15H210" />
                <path d="M120 8L127 15L120 22L113 15Z" fill={p} stroke="none" />
              </g>
            );
          case "floral-line":
            return (
              <g stroke={p} strokeWidth="1" fill={p}>
                <path d="M20 15H96M144 15H220" fill="none" />
                <g stroke="none" opacity=".9">{[leaf(98, 15, -30, 0.7), leaf(98, 15, 30, 0.7), leaf(142, 15, 210, 0.7), leaf(142, 15, 150, 0.7)]}</g>
                <circle cx="120" cy="15" r="5" fill="none" />
                <circle cx="120" cy="15" r="1.8" stroke="none" />
              </g>
            );
          case "botanical":
            return (
              <g stroke={p} strokeWidth="1.1" fill={p}>
                <path d="M40 18C80 10 160 10 200 18" fill="none" />
                <g stroke="none">{[60, 80, 100].map((x, i) => leaf(x, 14 - i * 0.6, -35 + i * 4, 0.8))}{[140, 160, 180].map((x, i) => leaf(x, 13 + i * 0.6, 215 - i * 4, 0.8))}</g>
                <circle cx="120" cy="12.5" r="2.4" stroke="none" />
              </g>
            );
          case "art-deco":
            return (
              <g stroke={p} strokeWidth="1">
                <path d="M20 15H92M148 15H220M40 19H96M144 19H200" />
                {[-60, -40, -20, 0, 20, 40, 60].map((r) => (
                  <path key={r} d="M120 24V6" transform={`rotate(${r} 120 24)`} />
                ))}
                <path d="M104 24H136" />
              </g>
            );
          case "batik-kawung":
            return (
              <g stroke={p} strokeWidth="1">
                <path d="M20 15H98M142 15H220" />
                {[0, 90, 180, 270].map((r) => (
                  <ellipse key={r} cx="120" cy="8" rx="4" ry="7" transform={`rotate(${r} 120 15)`} />
                ))}
                {[34, 56, 78, 162, 184, 206].map((x) => (
                  <circle key={x} cx={x} cy="15" r="1.6" fill={p} stroke="none" />
                ))}
              </g>
            );
          case "arabesque":
            return (
              <g stroke={p} strokeWidth="1">
                <path d="M20 15H100M140 15H220" />
                <rect x="111" y="6" width="18" height="18" />
                <rect x="111" y="6" width="18" height="18" transform="rotate(45 120 15)" />
                <circle cx="120" cy="15" r="3" fill={p} stroke="none" />
                <path d="M60 15l4-4 4 4-4 4zM172 15l4-4 4 4-4 4z" fill={p} stroke="none" />
              </g>
            );
          case "wave-line":
            return (
              <g stroke={p} strokeWidth="1.1">
                <path d="M20 13C40 5 60 21 80 13S120 5 140 13 180 21 200 13 220 9 220 9" />
                <path d="M20 19C40 11 60 27 80 19S120 11 140 19 180 27 200 19" opacity=".5" />
              </g>
            );
          case "flourish":
          default:
            return (
              <g stroke={p} strokeWidth="1.1" strokeLinecap="round">
                <path d="M120 15C108 4 92 4 88 12C85 18 92 22 96 18C99 15 96 11 92 13M120 15C132 4 148 4 152 12C155 18 148 22 144 18C141 15 144 11 148 13" />
                <path d="M88 15C70 15 52 9 30 15M152 15C170 15 188 9 210 15" />
                <path d="M120 9L124 15L120 21L116 15Z" fill={p} stroke="none" />
                <circle cx="30" cy="15" r="1.6" fill={p} stroke="none" />
                <circle cx="210" cy="15" r="1.6" fill={p} stroke="none" />
              </g>
            );
        }
      }}
    </Svg>
  );
}

// ─── Corner ornament (top-left orientation; mirror with CSS for other corners) ───
export function Corner({ theme, className }: { theme: AiTheme; className?: string }) {
  const type: Ornament = theme.ornament;
  if (type === "none") return null;
  return (
    <Svg theme={theme} viewBox="0 0 140 140" className={className}>
      {(p) => {
        switch (type) {
          case "minimal-rule":
            return <path d="M12 70V12H70" stroke={p} strokeWidth="1" />;
          case "art-deco":
            return (
              <g stroke={p} strokeWidth="1">
                <path d="M10 90V10H90M18 72V18H72M26 54V26H54" />
                {[0, 15, 30, 45, 60, 75, 90].map((r) => (
                  <path key={r} d="M26 26L26 4" transform={`rotate(${r + 90} 26 26)`} opacity=".7" />
                ))}
              </g>
            );
          case "batik-kawung":
            return (
              <g stroke={p} strokeWidth="1">
                {[
                  [24, 24],
                  [56, 24],
                  [24, 56],
                ].map(([cx, cy]) =>
                  [0, 90, 180, 270].map((r) => <ellipse key={`${cx}${cy}${r}`} cx={cx} cy={cy - 8} rx="5" ry="8" transform={`rotate(${r} ${cx} ${cy})`} />),
                )}
                <path d="M8 90V8H90" />
              </g>
            );
          case "arabesque":
            return (
              <g stroke={p} strokeWidth="1">
                <path d="M8 100V8H100" />
                <path d="M8 60C30 60 60 30 60 8M8 36C20 36 36 20 36 8" />
                <rect x="20" y="20" width="16" height="16" transform="rotate(45 28 28)" fill={p} stroke="none" opacity=".85" />
              </g>
            );
          case "wave-line":
            return (
              <g stroke={p} strokeWidth="1.1">
                <path d="M10 120C10 60 60 10 120 10M22 120C22 68 68 22 120 22" />
                <path d="M34 120C34 76 76 34 120 34" opacity=".5" />
              </g>
            );
          case "flourish":
            return (
              <g stroke={p} strokeWidth="1.2" strokeLinecap="round">
                <path d="M10 130C10 70 30 30 70 18C96 10 120 14 130 10" />
                <path d="M10 90C22 70 44 64 52 74C58 82 50 92 42 88C36 85 38 77 44 78" />
                <path d="M50 10C70 22 76 44 66 52C58 58 48 50 52 42C55 36 63 38 62 44" />
                <path d="M18 40C30 36 38 28 40 16" opacity=".7" />
                <circle cx="30" cy="30" r="3" fill={p} stroke="none" />
              </g>
            );
          case "floral-line":
          case "botanical":
          default:
            return (
              <g stroke={p} strokeWidth="1.1" fill={p}>
                <path d="M6 134C14 80 46 34 128 8" fill="none" />
                <path d="M30 70C44 64 56 66 66 76" fill="none" opacity=".8" />
                <g stroke="none" opacity=".9">
                  {[
                    [14, 104, -70],
                    [20, 84, -10],
                    [30, 64, -80],
                    [40, 50, -20],
                    [56, 36, -95],
                    [70, 28, -35],
                    [90, 20, -110],
                    [108, 14, -40],
                    [52, 68, 10],
                  ].map(([x, y, r]) => leaf(x, y, r, 1.25))}
                </g>
                {type === "floral-line" && (
                  <g>
                    <circle cx="66" cy="76" r="6" fill="none" />
                    <circle cx="66" cy="76" r="2.2" stroke="none" />
                    <circle cx="124" cy="9" r="3.5" fill="none" />
                  </g>
                )}
              </g>
            );
        }
      }}
    </Svg>
  );
}

/** Four corners for a framed area. */
export function Corners({ theme, size = "w-24 h-24", opacity = "opacity-80" }: { theme: AiTheme; size?: string; opacity?: string }) {
  if (theme.ornament === "none") return null;
  const base = `pointer-events-none absolute ${size} ${opacity}`;
  return (
    <>
      <Corner theme={theme} className={`${base} left-0 top-0`} />
      <Corner theme={theme} className={`${base} right-0 top-0 -scale-x-100`} />
      <Corner theme={theme} className={`${base} left-0 bottom-0 -scale-y-100`} />
      <Corner theme={theme} className={`${base} right-0 bottom-0 -scale-100`} />
    </>
  );
}

/** Leafy sprigs growing in from both page edges, used between sections. */
export function EdgeSprigs({ theme }: { theme: AiTheme }) {
  if (theme.ornament === "none" || theme.ornament === "minimal-rule") return null;
  return (
    <div className="pointer-events-none relative h-16" aria-hidden="true">
      <Corner theme={theme} className="absolute -left-2 top-0 w-20 h-20 opacity-70 rotate-[-20deg]" />
      <Corner theme={theme} className="absolute -right-2 top-0 w-20 h-20 opacity-70 -scale-x-100 rotate-20" />
    </div>
  );
}
