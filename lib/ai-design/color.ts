import { sanitizeCustomHtml } from "./html-sanitize";
import { AiThemeSchema, CanvasConfigSchema, DEFAULT_AI_THEME, ThemeAssetsSchema, type AiTheme } from "./schema";

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function toRgb(hex: string): [number, number, number] {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string) {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Returns `fg` if it reaches `min` contrast on `bg`, otherwise a near-black or near-white fallback. */
function ensureContrast(fg: string, bg: string, min: number, dark = "#1F1B16", light = "#FBF8F3") {
  if (contrast(fg, bg) >= min) return fg;
  return contrast(dark, bg) >= contrast(light, bg) ? dark : light;
}

/**
 * Validates an AI theme and repairs anything that would render badly:
 * invalid hex values fall back to the default palette, and text colours are
 * forced to readable contrast (ink 4.5:1, muted 3:1, button text 4.5:1).
 */
export function normalizeTheme(input: unknown): AiTheme {
  const parsed = AiThemeSchema.safeParse(input);
  const theme: AiTheme = parsed.success ? parsed.data : DEFAULT_AI_THEME;

  const palette = { ...theme.palette };
  for (const key of Object.keys(palette) as (keyof typeof palette)[]) {
    if (!HEX.test(palette[key])) palette[key] = DEFAULT_AI_THEME.palette[key];
  }

  palette.ink = ensureContrast(palette.ink, palette.background, 4.5);
  palette.muted = ensureContrast(palette.muted, palette.background, 3, palette.ink, palette.ink);
  palette.onAccent = ensureContrast(palette.onAccent, palette.accent, 4.5, "#1F1B16", "#FFFFFF");

  const rawObj = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const parsedAssets = ThemeAssetsSchema.safeParse(rawObj.assets);
  const assets = parsedAssets.success && (parsedAssets.data.backgroundImage || parsedAssets.data.ornamentImage)
    ? {
        ...(parsedAssets.data.backgroundImage ? { backgroundImage: parsedAssets.data.backgroundImage } : {}),
        ...(parsedAssets.data.ornamentImage ? { ornamentImage: parsedAssets.data.ornamentImage } : {}),
      }
    : undefined;

  const parsedCanvas = CanvasConfigSchema.safeParse({
    sectionOrder: rawObj.sectionOrder,
    hiddenSections: rawObj.hiddenSections,
    layers: rawObj.layers,
    sectionStyles: rawObj.sectionStyles,
    customHtml: rawObj.customHtml,
  });

  const canvasExtra: Partial<AiTheme> = {};
  if (parsedCanvas.success) {
    if (parsedCanvas.data.sectionOrder?.length) canvasExtra.sectionOrder = parsedCanvas.data.sectionOrder;
    if (parsedCanvas.data.hiddenSections?.length) canvasExtra.hiddenSections = parsedCanvas.data.hiddenSections;
    if (parsedCanvas.data.layers?.length) canvasExtra.layers = parsedCanvas.data.layers;
    if (parsedCanvas.data.sectionStyles && Object.keys(parsedCanvas.data.sectionStyles).length) {
      canvasExtra.sectionStyles = parsedCanvas.data.sectionStyles;
    }
    if (parsedCanvas.data.customHtml?.trim()) {
      const { html } = sanitizeCustomHtml(parsedCanvas.data.customHtml);
      if (html) canvasExtra.customHtml = html;
    }
  }

  return {
    ...theme,
    palette,
    ...(assets ? { assets } : {}),
    ...canvasExtra,
  };
}
