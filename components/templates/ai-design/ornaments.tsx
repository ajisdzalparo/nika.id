"use client";

import { Fragment, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  IconCopy,
  IconFlipHorizontal,
  IconFlipVertical,
  IconLayersSubtract,
  IconLock,
  IconLockOpen,
  IconRefresh,
  IconStackForward,
  IconTrash,
} from "@tabler/icons-react";
import { getPresetOrnament } from "@/lib/ai-design/ornament-library";
import type { AiTheme, CanvasLayer, CanvasSectionId, LayerAnimation, SectionEntrance } from "@/lib/ai-design/schema";
import type { ParticleKind } from "@/lib/ai-design/schema";
import type { WeddingData } from "@/types/wedding";
import { fontStack } from "./theme";

export interface PaletteDragPayload {
  kind: "preset" | "image" | "text";
  value: string;
  size: number;
  font?: CanvasLayer["font"];
  fontWeight?: CanvasLayer["fontWeight"];
  italic?: boolean;
  uppercase?: boolean;
  heightRatio?: number;
  color?: string;
}

export interface CanvasEditorBridge {
  activeSection: CanvasSectionId;
  selectedLayerId: string | null;
  draggingPalette?: PaletteDragPayload | null;
  onSelectSection: (section: CanvasSectionId) => void;
  onSelectLayer: (layerId: string | null) => void;
  onMoveLayer: (layerId: string, x: number, y: number) => void;
  onResizeLayer?: (layerId: string, size: number) => void;
  onRotateLayer?: (layerId: string, rotation: number) => void;
  /** Mirror a layer left↔right ("x") or top↕bottom ("y") */
  onFlipLayer?: (layerId: string, axis: "x" | "y") => void;
  onLockLayer?: (layerId: string) => void;
  onDuplicateLayer?: (layerId: string) => void;
  onDeleteLayer?: (layerId: string) => void;
  onShiftLayerForward?: (layerId: string) => void;
  onToggleLayerDepth?: (layerId: string) => void;
  onDropPaletteItem?: (section: CanvasSectionId, payload: PaletteDragPayload, x: number, y: number) => void;
  onQuickInsert?: (section: CanvasSectionId) => void;
}

type Ornament = AiTheme["ornament"];

/** Rotation + mirroring of a canvas layer, shared by the published invitation and the editor. */
export function layerTransform(layer: Pick<CanvasLayer, "rotation" | "flipX" | "flipY">): string {
  return `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.flipX ? -1 : 1}, ${layer.flipY ? -1 : 1})`;
}

/**
 * Position of the floating toolbar of a selected layer, in the section's coordinates (it is a sibling of the
 * layer, so rotation and flips never touch it). Centred above the layer, but clamped so it never leaves the
 * artboard (which clips overflow) at the sides or the top.
 */
function layerToolbarStyle(layer: Pick<CanvasLayer, "x" | "y" | "size" | "heightRatio" | "kind">, buttonCount: number): CSSProperties {
  const halfWidth = Math.round((12 + buttonCount * 30) / 2);
  const halfHeight = layer.kind === "text" ? 20 : Math.round((layer.size * (layer.heightRatio ?? 1)) / 2);
  return {
    left: `clamp(${halfWidth + 6}px, ${layer.x}%, calc(100% - ${halfWidth + 6}px))`,
    top: `max(6px, calc(${layer.y}% - ${halfHeight}px - 44px))`,
    transform: "translateX(-50%)",
  };
}

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
  const a = theme.palette.accent;
  const foilId = `foil-${a.replace(/[^a-zA-Z0-9]/g, "") || "accent"}`;
  const paint = theme.metallic ? `url(#${foilId})` : "var(--accent)";
  return (
    <svg viewBox={viewBox} className={className} aria-hidden="true" fill="none">
      {theme.metallic && (
        <defs>
          <linearGradient id={foilId} x1="0" y1="0" x2="1" y2="1">
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
  const custom = theme.assets?.ornamentImage;
  if (custom) {
    const base = `pointer-events-none absolute object-contain ${size} ${opacity}`;
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={custom} alt="" aria-hidden="true" className={`${base} left-0 top-0`} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={custom} alt="" aria-hidden="true" className={`${base} right-0 top-0 -scale-x-100`} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={custom} alt="" aria-hidden="true" className={`${base} left-0 bottom-0 -scale-y-100`} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={custom} alt="" aria-hidden="true" className={`${base} right-0 bottom-0 -scale-100`} />
      </>
    );
  }
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
  const custom = theme.assets?.ornamentImage;
  if (custom) {
    return (
      <div className="pointer-events-none relative h-16 overflow-hidden" aria-hidden="true">
        <div className="animate-uy-sway">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={custom} alt="" className="absolute -left-2 top-0 h-20 w-20 object-contain opacity-70 rotate-[-20deg]" />
        </div>
        <div className="animate-uy-sway">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={custom} alt="" className="absolute -right-2 top-0 h-20 w-20 object-contain opacity-70 -scale-x-100 rotate-20" />
        </div>
      </div>
    );
  }
  if (theme.ornament === "none" || theme.ornament === "minimal-rule") return null;
  return (
    <div className="pointer-events-none relative h-16 overflow-hidden" aria-hidden="true">
      <div className="animate-uy-sway">
        <Corner theme={theme} className="absolute -left-2 top-0 w-20 h-20 opacity-70 rotate-[-20deg]" />
      </div>
      <div className="animate-uy-sway">
        <Corner theme={theme} className="absolute -right-2 top-0 w-20 h-20 opacity-70 -scale-x-100 rotate-20" />
      </div>
    </div>
  );
}

const LAYER_ANIM_CLASS: Record<LayerAnimation, string> = {
  none: "",
  float: "animate-uy-float",
  sway: "animate-uy-sway",
  pulse: "animate-uy-pulse-soft",
  "spin-slow": "animate-uy-spin-slow",
  "fade-up": "animate-uy-fade-up",
  "zoom-in": "animate-uy-zoom-in",
  "slide-left": "animate-uy-slide-left",
  "slide-right": "animate-uy-slide-right",
  drift: "animate-uy-drift",
};

const SECTION_ENTRANCE_CLASS: Record<SectionEntrance, string> = {
  none: "",
  "fade-up": "animate-uy-fade-up",
  "zoom-in": "animate-uy-zoom-in",
  "slide-left": "animate-uy-slide-left",
  "slide-right": "animate-uy-slide-right",
};

function resolveFramePhoto(slot: CanvasLayer["frameSlot"], data?: WeddingData): string | undefined {
  if (!slot || !data) return undefined;
  if (slot === "bride") return data.bride.photo || undefined;
  if (slot === "groom") return data.groom.photo || undefined;
  if (slot === "gallery0") return data.gallery?.[0] || undefined;
  if (slot === "gallery1") return data.gallery?.[1] || undefined;
  return data.gallery?.[0] || data.bride.photo || data.groom.photo || undefined;
}

function LayerVisual({ layer, theme, data }: { layer: CanvasLayer; theme: AiTheme; data?: WeddingData }) {
  const color = layer.color || theme.palette.accent;
  const animClass = layer.animation ? LAYER_ANIM_CLASS[layer.animation] : "";
  const animStyle =
    layer.animation && layer.animation !== "none"
      ? {
          animationDuration: layer.animationDuration ? `${layer.animationDuration}s` : undefined,
          animationDelay: layer.animationDelay ? `${layer.animationDelay}s` : undefined,
        }
      : undefined;

  if (layer.kind === "preset") {
    const preset = getPresetOrnament(layer.value);
    if (!preset) return null;
    if (preset.photoMask) {
      const boundPhoto = resolveFramePhoto(layer.frameSlot, data);
      if (boundPhoto) {
        const radiusClass =
          preset.photoMask === "circle"
            ? "rounded-full"
            : preset.photoMask === "arch"
              ? "rounded-t-full rounded-b-lg"
              : preset.photoMask === "rounded"
                ? "rounded-2xl"
                : "rounded-sm";
        return (
          <div className={`h-full w-full overflow-hidden border border-black/10 ${radiusClass} ${animClass}`} style={animStyle}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={boundPhoto} alt="" className="h-full w-full object-cover select-none" draggable={false} />
          </div>
        );
      }
    }
    return (
      <div className={`h-full w-full ${animClass}`} style={animStyle}>
        <svg
          viewBox={preset.viewBox}
          preserveAspectRatio={preset.stretchable ? "none" : "xMidYMid meet"}
          className="h-full w-full"
          style={{ color }}
          aria-hidden="true"
          // Safe static SVG paths curated in lib/ai-design/ornament-library.ts
          dangerouslySetInnerHTML={{ __html: preset.paths }}
        />
      </div>
    );
  }
  if (layer.kind === "text") {
    const weight = layer.fontWeight === "bold" ? 700 : layer.fontWeight === "normal" ? 400 : 500;
    return (
      <div className={animClass} style={animStyle}>
        <span
          className="block whitespace-pre-wrap select-none"
          style={{
            color,
            backgroundColor: layer.bgColor || "transparent",
            borderRadius: layer.borderRadius ? `${layer.borderRadius}px` : undefined,
            padding: layer.bgColor ? "6px 14px" : undefined,
            fontFamily: layer.font ? `"${layer.font}", serif` : "var(--font-display)",
            fontSize: `${Math.max(12, Math.round(layer.size * 0.28))}px`,
            fontWeight: weight,
            fontStyle: layer.italic ? "italic" : "normal",
            textTransform: layer.uppercase ? "uppercase" : "none",
            textAlign: layer.textAlign ?? "center",
            letterSpacing: layer.letterSpacing !== undefined ? `${layer.letterSpacing}em` : undefined,
            lineHeight: layer.lineHeight ?? 1.2,
          }}
        >
          {layer.value}
        </span>
      </div>
    );
  }
  const src =
    layer.value.startsWith("data:image/svg+xml") && layer.color
      ? layer.value.replace(/currentColor/g, encodeURIComponent(layer.color))
      : layer.value.startsWith("data:image/svg+xml")
        ? layer.value.replace(/currentColor/g, encodeURIComponent(theme.palette.accent))
        : layer.value;
  return (
    <div className={`h-full w-full ${animClass}`} style={animStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-contain select-none" draggable={false} />
    </div>
  );
}


// ─── Ambient particles ───────────────────────────────────────────────────

/** Fixed pseudo-random spread so server and client render the same particles. */
const PARTICLE_SPREAD = [
  { x: 6, d: 0, t: 15, s: 1, r: 320 },
  { x: 18, d: 4.5, t: 18, s: 0.8, r: -260 },
  { x: 31, d: 9, t: 14, s: 1.15, r: 380 },
  { x: 44, d: 2, t: 20, s: 0.7, r: -300 },
  { x: 57, d: 11, t: 16, s: 0.95, r: 280 },
  { x: 69, d: 6.5, t: 19, s: 1.1, r: -340 },
  { x: 81, d: 1, t: 15, s: 0.85, r: 300 },
  { x: 93, d: 8, t: 17, s: 1, r: -280 },
  { x: 25, d: 13, t: 21, s: 0.75, r: 360 },
  { x: 75, d: 15, t: 18, s: 0.9, r: -320 },
];

function ParticleShape({ kind, color }: { kind: ParticleKind; color: string }) {
  if (kind === "gold-dust") {
    return (
      <svg viewBox="0 0 10 10" width="7" height="7" aria-hidden="true">
        <path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4Z" fill={color} />
      </svg>
    );
  }
  if (kind === "leaves") {
    return (
      <svg viewBox="0 0 20 12" width="16" height="10" aria-hidden="true">
        <path d="M1 6 C5 0 14 0 19 6 C14 12 5 12 1 6Z" fill={color} opacity=".8" />
        <path d="M2 6 H17" stroke="#ffffff" strokeOpacity=".4" strokeWidth=".8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 18" width="13" height="15" aria-hidden="true">
      <path d="M8 1 C14 4 16 11 8 17 C0 11 2 4 8 1Z" fill={color} opacity=".85" />
      <path d="M8 3 C9 8 9 12 8 15" stroke="#ffffff" strokeOpacity=".35" strokeWidth=".8" fill="none" />
    </svg>
  );
}

/** Petals, gold dust or leaves drifting down over a section; hidden for reduced motion. */
export function AmbientParticles({ kind, theme, variant = 0 }: { kind: ParticleKind; theme: AiTheme; variant?: number }) {
  // Each placement gets its own timing and lanes so two panels on one screen never move in step
  const shift = (variant * 5.3) % 17;
  const lane = (x: number) => (x + variant * 37) % 96;
  if (kind === "none") return null;
  const color = kind === "petals" ? "#E9A9B4" : kind === "leaves" ? "#8FA287" : theme.palette.accent;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[15] overflow-hidden">
      {PARTICLE_SPREAD.map((p, i) => (
        <span
          key={i}
          className="uy-particle"
          style={
            {
              left: `${lane(p.x)}%`,
              "--uy-p-delay": `${(p.d + shift) % 17}s`,
              "--uy-p-dur": `${p.t}s`,
              "--uy-p-spin": `${p.r}deg`,
              "--uy-p-drift": `${i % 2 ? -50 : 50}px`,
              "--uy-p-opacity": kind === "gold-dust" ? 0.9 : 0.75,
              transform: `scale(${p.s})`,
            } as React.CSSProperties
          }
        >
          <ParticleShape kind={kind} color={color} />
        </span>
      ))}
      {kind === "petals" &&
        BUTTERFLIES.map((b, i) => (
          <span
            key={`b${i}`}
            className="uy-butterfly"
            style={
              {
                left: `${lane(b.x)}%`,
                "--uy-fly-delay": `${(b.d + shift * 1.7) % 19}s`,
                "--uy-fly-dur": `${b.t}s`,
                "--uy-fly-x1": `${b.w}px`,
                "--uy-fly-x2": `${-b.w / 2}px`,
                "--uy-fly-x3": `${b.w * 1.4}px`,
                "--uy-fly-x4": `${b.w / 2}px`,
              } as React.CSSProperties
            }
          >
            <Butterfly color={b.c} />
          </span>
        ))}
    </div>
  );
}

const BUTTERFLIES = [
  { x: 12, d: 1, t: 17, w: 70, c: "#E7A3B3" },
  { x: 62, d: 7, t: 20, w: -60, c: "#D8B4E2" },
  { x: 38, d: 13, t: 19, w: 50, c: "#F2C9A0" },
];

function Butterfly({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 30 22" width="26" height="19" aria-hidden="true" className="block overflow-visible">
      <g className="uy-wing-l">
        <path d="M15 11 C10 1 2 0 2 6 C2 10 8 12 15 11Z" fill={color} />
        <path d="M15 12 C9 13 4 16 6 20 C9 22 13 18 15 12Z" fill={color} opacity=".8" />
      </g>
      <g className="uy-wing-r">
        <path d="M15 11 C20 1 28 0 28 6 C28 10 22 12 15 11Z" fill={color} />
        <path d="M15 12 C21 13 26 16 24 20 C21 22 17 18 15 12Z" fill={color} opacity=".8" />
      </g>
      <path d="M15 6 V17" stroke="#5B4636" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Read-only copy of one section's illustration layers, for places outside the section itself
 * (the desktop stage reuses the cover's frame, vines and bouquets so both halves of the screen move).
 */
export function StaticSectionLayers({ theme, section, data, className = "" }: { theme: AiTheme; section: CanvasSectionId; data?: WeddingData; className?: string }) {
  const layers = (theme.layers ?? []).filter((l) => l.section === section && l.kind !== "text");
  if (!layers.length) return null;
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      {layers.map((layer, idx) => (
        <div
          key={layer.id}
          className="absolute"
          style={{
            left: `${layer.x}%`,
            top: `${layer.y}%`,
            width: `${layer.size}px`,
            height: `${Math.round(layer.size * (layer.heightRatio ?? 1))}px`,
            opacity: layer.opacity,
            transform: layerTransform(layer),
            zIndex: layer.zIndex ?? idx + 1,
          }}
        >
          <LayerVisual layer={layer} theme={theme} data={data} />
        </div>
      ))}
    </div>
  );
}

export function CanvasSectionFrame({
  section,
  theme,
  data,
  canvasEditor,
  children,
}: {
  section: CanvasSectionId;
  theme: AiTheme;
  data?: WeddingData;
  canvasEditor?: CanvasEditorBridge;
  children: ReactNode;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startClientX: number; startClientY: number; startX: number; startY: number } | null>(null);
  const resizeRef = useRef<{ id: string; startClientX: number; startSize: number; sign: 1 | -1 } | null>(null);
  const rotateRef = useRef<{ id: string; centerX: number; centerY: number } | null>(null);
  const [snapGuides, setSnapGuides] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  const [dropPoint, setDropPoint] = useState<{ x: number; y: number } | null>(null);

  const layers = (theme.layers ?? [])
    .filter((l) => l.section === section)
    .map((l, idx) => ({ layer: l, order: l.zIndex ?? idx + 10 }))
    .sort((a, b) => a.order - b.order)
    .map((x) => x.layer);

  const behindLayers = layers.filter((l) => (l.zIndex ?? 10) <= 5);
  const frontLayers = layers.filter((l) => (l.zIndex ?? 10) > 5);
  const selectedLayer = canvasEditor ? layers.find((l) => l.id === canvasEditor.selectedLayerId) : undefined;

  const isActive = canvasEditor?.activeSection === section;
  const secStyle = theme.sectionStyles?.[section];
  const entranceClass = secStyle?.entrance ? SECTION_ENTRANCE_CLASS[secStyle.entrance] : "";

  const sectionInlineStyle: React.CSSProperties | undefined = (() => {
    if (!secStyle) return undefined;
    const s: Record<string, string | number | undefined> = {};
    if (secStyle.background) {
      s["--bg"] = secStyle.background;
      s.backgroundColor = secStyle.background;
      if (secStyle.backgroundEnd) {
        s.backgroundImage = `linear-gradient(160deg, ${secStyle.background} 0%, ${secStyle.backgroundEnd} 100%)`;
      }
    }
    if (secStyle.surfaceColor) s["--surface"] = secStyle.surfaceColor;
    if (secStyle.textColor) {
      s["--ink"] = secStyle.textColor;
      s["--muted"] = `color-mix(in srgb, ${secStyle.textColor} 72%, transparent)`;
      s.color = secStyle.textColor;
    }
    if (secStyle.accentColor) {
      s["--accent"] = secStyle.accentColor;
      s["--accent-soft"] = `color-mix(in srgb, ${secStyle.accentColor} 14%, transparent)`;
    }
    if (secStyle.displayFont) {
      s["--font-display"] = fontStack(secStyle.displayFont);
      s["--font-names"] = fontStack(secStyle.displayFont);
    }
    if (secStyle.bodyFont) {
      s["--font-body"] = fontStack(secStyle.bodyFont);
      s.fontFamily = fontStack(secStyle.bodyFont);
    }
    if (secStyle.minHeight) s.minHeight = `${secStyle.minHeight}px`;
    return Object.keys(s).length ? (s as React.CSSProperties) : undefined;
  })();

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const getRelPoint = (clientX: number, clientY: number) => {
    const box = frameRef.current?.getBoundingClientRect();
    if (!box || !box.width || !box.height) return { x: 50, y: 30 };
    let x = Math.round(clamp(((clientX - box.left) / box.width) * 100, 4, 96) * 10) / 10;
    let y = Math.round(clamp(((clientY - box.top) / box.height) * 100, 4, 96) * 10) / 10;
    if (Math.abs(x - 50) <= 1.8) x = 50;
    if (Math.abs(y - 50) <= 1.8) y = 50;
    return { x, y };
  };

  const renderLayerItem = (layer: CanvasLayer, idx: number) => {
    const isSelected = canvasEditor?.selectedLayerId === layer.id;
    const transform = layerTransform(layer);
    const boxHeight = layer.kind === "text" ? "auto" : `${Math.round(layer.size * (layer.heightRatio ?? 1))}px`;
    return (
      <div
        key={layer.id}
        role={canvasEditor ? "button" : undefined}
        tabIndex={canvasEditor ? 0 : undefined}
        aria-label={canvasEditor ? `Layer ${layer.kind}` : undefined}
        onClick={
          canvasEditor
            ? (e) => {
                e.stopPropagation();
                canvasEditor.onSelectSection(section);
                canvasEditor.onSelectLayer(layer.id);
              }
            : undefined
        }
        onPointerDown={
          canvasEditor
            ? (e) => {
                e.stopPropagation();
                canvasEditor.onSelectSection(section);
                canvasEditor.onSelectLayer(layer.id);
                if (layer.locked) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                dragRef.current = {
                  id: layer.id,
                  startClientX: e.clientX,
                  startClientY: e.clientY,
                  startX: layer.x,
                  startY: layer.y,
                };
              }
            : undefined
        }
        onPointerMove={
          canvasEditor
            ? (e) => {
                if (layer.locked) return;
                const drag = dragRef.current;
                const box = frameRef.current?.getBoundingClientRect();
                if (!drag || drag.id !== layer.id || !box || !box.width || !box.height) return;
                const dxPct = ((e.clientX - drag.startClientX) / box.width) * 100;
                const dyPct = ((e.clientY - drag.startClientY) / box.height) * 100;
                let nextX = Math.round(clamp(drag.startX + dxPct, 2, 98) * 10) / 10;
                let nextY = Math.round(clamp(drag.startY + dyPct, 2, 98) * 10) / 10;
                const snapX = Math.abs(nextX - 50) <= 1.8;
                const snapY = Math.abs(nextY - 50) <= 1.8;
                if (snapX) nextX = 50;
                if (snapY) nextY = 50;
                setSnapGuides({ x: snapX, y: snapY });
                canvasEditor.onMoveLayer(layer.id, nextX, nextY);
              }
            : undefined
        }
        onPointerUp={
          canvasEditor
            ? () => {
                dragRef.current = null;
                setSnapGuides({ x: false, y: false });
              }
            : undefined
        }
        style={{
          left: `${layer.x}%`,
          top: `${layer.y}%`,
          width: layer.kind === "text" ? "auto" : `${layer.size}px`,
          height: boxHeight,
          maxWidth: layer.kind === "text" ? "88%" : undefined,
          opacity: layer.opacity,
          transform,
          zIndex: layer.zIndex ?? idx + 1,
        }}
        className={`absolute ${
          canvasEditor
            ? `pointer-events-auto touch-none ${layer.locked ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${
                isSelected ? "rounded-sm ring-2 ring-[#8A6A2F]" : "hover:ring-1 hover:ring-[#C9A45C]/70"
              }`
            : "pointer-events-none"
        }`}
      >
        <LayerVisual layer={layer} theme={theme} data={data} />

        {canvasEditor && isSelected && (
          <>

            {!layer.locked &&
              canvasEditor.onResizeLayer &&
              (
                [
                  { key: "tl", pos: "-left-1.5 -top-1.5 cursor-nwse-resize", sign: -1 as const },
                  { key: "tr", pos: "-right-1.5 -top-1.5 cursor-nesw-resize", sign: 1 as const },
                  { key: "bl", pos: "-left-1.5 -bottom-1.5 cursor-nesw-resize", sign: -1 as const },
                  { key: "br", pos: "-right-1.5 -bottom-1.5 cursor-nwse-resize", sign: 1 as const },
                ] as const
              ).map((h) => (
                <button
                  key={h.key}
                  type="button"
                  aria-label="Ubah ukuran layer"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    resizeRef.current = {
                      id: layer.id,
                      startClientX: e.clientX,
                      startSize: layer.size,
                      // A horizontally mirrored layer shows its left handles on the right: flip the drag direction
                      sign: (layer.flipX ? -h.sign : h.sign) as 1 | -1,
                    };
                  }}
                  onPointerMove={(e) => {
                    const rz = resizeRef.current;
                    if (!rz || rz.id !== layer.id) return;
                    const delta = (e.clientX - rz.startClientX) * rz.sign;
                    const nextSize = Math.round(clamp(rz.startSize + delta * 1.4, 24, 400));
                    canvasEditor.onResizeLayer?.(layer.id, nextSize);
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    resizeRef.current = null;
                  }}
                  className={`absolute ${h.pos} z-30 h-3.5 w-3.5 rounded-full border-2 border-[#8A6A2F] bg-white shadow-sm`}
                />
              ))}

            {!layer.locked && canvasEditor.onRotateLayer && (
              <button
                type="button"
                aria-label="Putar layer"
                title="Seret untuk memutar"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  const parent = e.currentTarget.parentElement;
                  const rect = parent?.getBoundingClientRect();
                  if (!rect) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  rotateRef.current = {
                    id: layer.id,
                    centerX: rect.left + rect.width / 2,
                    centerY: rect.top + rect.height / 2,
                  };
                }}
                onPointerMove={(e) => {
                  const rot = rotateRef.current;
                  if (!rot || rot.id !== layer.id) return;
                  const rad = Math.atan2(e.clientY - rot.centerY, e.clientX - rot.centerX);
                  const deg = Math.round((rad * 180) / Math.PI - 90);
                  const normalized = ((deg + 180) % 360 + 360) % 360 - 180;
                  canvasEditor.onRotateLayer?.(layer.id, normalized);
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  rotateRef.current = null;
                }}
                className="absolute -bottom-9 left-1/2 z-40 flex h-6 w-6 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border border-[#DFD2BC] bg-white text-[#15130F] shadow-md hover:border-[#8A6A2F] active:cursor-grabbing"
              >
                <IconRefresh size={12} />
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  // Floating actions for the selected layer. Rendered once in its own overlay above every layer and the
  // section content, so a layer placed behind the text still gets a toolbar that is visible and clickable.
  const renderLayerToolbar = (layer: CanvasLayer) => {
    if (!canvasEditor) return null;
    const isBehind = (layer.zIndex ?? 10) <= 5;
    // Icon buttons shown in the toolbar (the depth toggle counts as ~2.5 for its label)
    const toolbarButtons =
      (canvasEditor?.onLockLayer ? 1 : 0) +
      (canvasEditor?.onToggleLayerDepth ? 2.5 : 0) +
      (canvasEditor?.onFlipLayer && layer.kind !== "text" ? 2 : 0) +
      (canvasEditor?.onShiftLayerForward ? 1 : 0) +
      (canvasEditor?.onDuplicateLayer ? 1 : 0) +
      (canvasEditor?.onDeleteLayer && !layer.locked ? 1 : 0);
    const toolbarStyle = layerToolbarStyle(layer, toolbarButtons);
    return (
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={toolbarStyle}
        className="pointer-events-auto absolute flex items-center gap-0.5 whitespace-nowrap rounded-full border border-[#E6DFD3] bg-[#FFFDF9] px-1.5 py-1 text-[#15130F] shadow-md"
      >
        {canvasEditor.onLockLayer && (
          <button
            type="button"
            title={layer.locked ? "Buka kunci" : "Kunci posisi"}
            onClick={() => canvasEditor.onLockLayer?.(layer.id)}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-[#F4EAD6] ${
              layer.locked ? "bg-[#F4EAD6] text-[#8A6A2F]" : ""
            }`}
          >
            {layer.locked ? <IconLock size={14} /> : <IconLockOpen size={14} />}
          </button>
        )}
        {canvasEditor.onToggleLayerDepth && (
          <button
            type="button"
            title={isBehind ? "Pindah ke depan teks" : "Taruh di belakang teks (background)"}
            onClick={() => canvasEditor.onToggleLayerDepth?.(layer.id)}
            className={`flex h-7 items-center gap-1 rounded-full px-2 text-[10px] font-medium transition hover:bg-[#F4EAD6] ${
              isBehind ? "bg-[#F4EAD6] text-[#8A6A2F]" : ""
            }`}
          >
            <IconLayersSubtract size={13} />
            <span>{isBehind ? "Belakang" : "Depan"}</span>
          </button>
        )}
        {canvasEditor.onFlipLayer && layer.kind !== "text" && (
          <>
            <button
              type="button"
              title="Balik horizontal (kiri ↔ kanan)"
              aria-pressed={Boolean(layer.flipX)}
              onClick={() => canvasEditor.onFlipLayer?.(layer.id, "x")}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-[#F4EAD6] ${layer.flipX ? "bg-[#F4EAD6] text-[#8A6A2F]" : ""}`}
            >
              <IconFlipVertical size={14} />
            </button>
            <button
              type="button"
              title="Balik vertikal (atas ↕ bawah)"
              aria-pressed={Boolean(layer.flipY)}
              onClick={() => canvasEditor.onFlipLayer?.(layer.id, "y")}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-[#F4EAD6] ${layer.flipY ? "bg-[#F4EAD6] text-[#8A6A2F]" : ""}`}
            >
              <IconFlipHorizontal size={14} />
            </button>
          </>
        )}
        {canvasEditor.onShiftLayerForward && (
          <button
            type="button"
            title="Majukan layer"
            onClick={() => canvasEditor.onShiftLayerForward?.(layer.id)}
            className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-[#F4EAD6]"
          >
            <IconStackForward size={14} />
          </button>
        )}
        {canvasEditor.onDuplicateLayer && (
          <button
            type="button"
            title="Duplikat"
            onClick={() => canvasEditor.onDuplicateLayer?.(layer.id)}
            className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-[#F4EAD6]"
          >
            <IconCopy size={14} />
          </button>
        )}
        {canvasEditor.onDeleteLayer && !layer.locked && (
          <button
            type="button"
            title="Hapus"
            onClick={() => canvasEditor.onDeleteLayer?.(layer.id)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-red-600 transition hover:bg-red-50"
          >
            <IconTrash size={14} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      ref={frameRef}
      data-canvas-section={section}
      data-clear-decor={secStyle?.clearDecor ? "true" : undefined}
      data-section-pad={secStyle?.paddingY}
      data-section-align={secStyle?.textAlign}
      style={sectionInlineStyle}
      onDragOver={
        canvasEditor?.onDropPaletteItem
          ? (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              const pt = getRelPoint(e.clientX, e.clientY);
              setDropPoint(pt);
            }
          : undefined
      }
      onDragLeave={
        canvasEditor?.onDropPaletteItem
          ? (e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setDropPoint(null);
              }
            }
          : undefined
      }
      onDrop={
        canvasEditor?.onDropPaletteItem
          ? (e) => {
              e.preventDefault();
              const pt = getRelPoint(e.clientX, e.clientY);
              setDropPoint(null);
              let payload: PaletteDragPayload | null = null;
              const raw = e.dataTransfer.getData("application/x-uy-canvas") || e.dataTransfer.getData("text/plain");
              if (raw && raw.startsWith("{")) {
                try {
                  payload = JSON.parse(raw) as PaletteDragPayload;
                } catch {
                  payload = null;
                }
              }
              if (!payload && canvasEditor.draggingPalette) {
                payload = canvasEditor.draggingPalette;
              }
              if (payload && payload.value) {
                canvasEditor.onDropPaletteItem?.(section, payload, pt.x, pt.y);
              }
            }
          : undefined
      }
      onClick={
        canvasEditor
          ? () => {
              canvasEditor.onSelectSection(section);
            }
          : undefined
      }
      className={`relative overflow-hidden ${entranceClass} ${
        canvasEditor
          ? dropPoint
            ? "ring-2 ring-inset ring-dashed ring-[#C9A45C] bg-[#C9A45C]/10"
            : canvasEditor.draggingPalette
              ? "ring-1 ring-inset ring-dashed ring-[#C9A45C]/60"
              : isActive
                ? "ring-2 ring-inset ring-[#C9A45C] transition-shadow"
                : "cursor-pointer hover:ring-1 hover:ring-inset hover:ring-[#C9A45C]/50"
          : ""
      }`}
    >
      {secStyle?.backgroundImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={secStyle.backgroundImage}
            alt=""
            aria-hidden="true"
            className="uy-kenburns pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundColor: secStyle.background || "var(--bg)",
              opacity: secStyle.overlayOpacity ?? 0.35,
            }}
          />
        </>
      )}

      {(section === "cover" || section === "closing") && theme.particles && !canvasEditor && <AmbientParticles kind={theme.particles} theme={theme} />}

      {behindLayers.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-[5]">
          {behindLayers.map(renderLayerItem)}
        </div>
      )}

      <div className={canvasEditor ? "relative z-10 pointer-events-none select-none" : "relative z-10"}>{children}</div>

      {canvasEditor && snapGuides.x && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 z-30 w-px -translate-x-1/2 bg-[#C9A45C]/80" />
      )}
      {canvasEditor && snapGuides.y && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 z-30 h-px -translate-y-1/2 bg-[#C9A45C]/80" />
      )}

      {frontLayers.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-20">
          {frontLayers.map(renderLayerItem)}
        </div>
      )}

      {canvasEditor && selectedLayer && (
        <div className="pointer-events-none absolute inset-0 z-40">{renderLayerToolbar(selectedLayer)}</div>
      )}

      {canvasEditor && dropPoint && (
        <div
          aria-hidden="true"
          style={{ left: `${dropPoint.x}%`, top: `${dropPoint.y}%` }}
          className="pointer-events-none absolute z-30 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-[#8A6A2F] px-2.5 py-1 text-[10px] font-semibold text-white shadow-md"
        >
          Lepas di sini
        </div>
      )}

      {canvasEditor && isActive && !dropPoint && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-2 top-2 z-30 flex items-center gap-1 rounded-full border border-[#DFD2BC] bg-[#FFFDF9]/95 px-2 py-0.5 text-[10px] font-medium text-[#15130F] shadow-sm backdrop-blur-xs"
        >
          <span className="font-semibold uppercase tracking-wider text-[#8A6A2F]">{section}</span>
          {canvasEditor.onQuickInsert && (
            <button
              type="button"
              title="Hias elemen di section ini"
              onClick={() => canvasEditor.onQuickInsert?.(section)}
              className="inline-flex items-center gap-0.5 rounded-full bg-[#FBF6EB] px-2 py-0.5 text-[10px] font-medium text-[#8A6A2F] hover:bg-[#F3E9D2]"
            >
              Hias
            </button>
          )}
        </div>
      )}
    </div>
  );
}
