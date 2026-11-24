import { ART_KITS, type AiTheme, type CanvasLayer, type CanvasSectionId, type SectionStyle } from "./schema";

/**
 * Art kits: original illustration sets (no third-party artwork) that turn any theme into a fully
 * composed invitation — a frame over the cover, side vines, corner bouquets, an emblem and a soft
 * backdrop — placed by `composeArtKit` with the same rules for every template and every AI design.
 *
 * Illustrated kits are multi-colour SVG files in /public/templates/art/<kit>/. Line kits are drawn in
 * `currentColor`, so the renderer tints them with the theme accent (they work on dark themes too).
 */

export { ART_KITS };
export type ArtKitKey = (typeof ART_KITS)[number];

type Slot = "frame" | "corner" | "side" | "emblem";
interface KitAsset {
  src: string;
  /** height / width of the artwork */
  ratio: number;
}
interface ArtKit {
  label: string;
  /** Short note for the AI prompt and the Kanvas picker */
  hint: string;
  assets: Partial<Record<Slot, KitAsset>>;
  /** Backdrop image for cover/couple sections (light kits only) */
  backdrop?: string;
  /** Line kits follow the theme accent and suit dark backgrounds */
  tinted?: boolean;
  particles: "petals" | "gold-dust" | "leaves";
}

const svgUri = (inner: string, viewBox: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`)}`;

const art = (kit: string, file: string) => `/templates/art/${kit}/${file}`;

// ── Line art (tinted with the theme accent) ──────────────────────────────

const DECO_FRAME = svgUri(
  `<path d="M0 6 H400" stroke-width="2"/><path d="M0 14 H400" stroke-width=".8"/>
   <path d="M60 14 V40 H110 V62 H150 V80 C170 60 230 60 250 80 V62 H290 V40 H340 V14" stroke-width="1.6"/>
   <path d="M200 14 V48 M184 22 L200 48 L216 22 M170 30 L200 48 L230 30" stroke-width="1.2"/>
   <path d="M20 14 V30 M380 14 V30 M36 14 V22 M364 14 V22" stroke-width="1.2"/>
   <circle cx="200" cy="56" r="4" fill="currentColor" stroke="none"/>`,
  "0 0 400 100",
);
const DECO_CORNER = svgUri(
  `<path d="M6 214 V120 M6 214 H100" stroke-width="2"/>
   <path d="M6 214 m0 -70 a70 70 0 0 1 70 70" stroke-width="1.4"/><path d="M6 214 m0 -50 a50 50 0 0 1 50 50" stroke-width="1.2"/>
   <path d="M6 214 m0 -30 a30 30 0 0 1 30 30" stroke-width="1"/>
   <path d="M6 214 L60 160 M6 214 L36 150 M6 214 L72 184 M6 214 L22 146 M6 214 L78 200" stroke-width=".9"/>
   <path d="M18 120 l6 -8 6 8 -6 8Z M100 202 l8 6 -8 6 -8 -6Z" fill="currentColor" stroke="none"/>`,
  "0 0 300 220",
);
const DECO_SIDE = svgUri(
  `<path d="M60 0 V300" stroke-width="1.2"/><path d="M52 0 V300 M68 0 V300" stroke-width=".5"/>
   <path d="M60 60 l10 14 -10 14 -10 -14Z M60 150 l12 18 -12 18 -12 -18Z M60 246 l10 14 -10 14 -10 -14Z" fill="currentColor" stroke="none"/>`,
  "0 0 120 300",
);
const DECO_EMBLEM = svgUri(
  `<circle cx="100" cy="100" r="44" stroke-width="1.6"/><circle cx="100" cy="100" r="36" stroke-width=".8"/>
   ${Array.from({ length: 24 }, (_, i) => {
     const a = (i * Math.PI) / 12;
     const r1 = 48;
     const r2 = i % 2 ? 62 : 78;
     return `<path d="M${(100 + r1 * Math.cos(a)).toFixed(1)} ${(100 + r1 * Math.sin(a)).toFixed(1)} L${(100 + r2 * Math.cos(a)).toFixed(1)} ${(100 + r2 * Math.sin(a)).toFixed(1)}" stroke-width="${i % 2 ? 0.8 : 1.4}"/>`;
   }).join("")}
   <path d="M100 76 l14 24 -14 24 -14 -24Z" stroke-width="1.4"/><circle cx="100" cy="100" r="5" fill="currentColor" stroke="none"/>`,
  "0 0 200 200",
);

const ARAB_FRAME = svgUri(
  `<path d="M0 8 H400" stroke-width="1.6"/>
   <path d="M30 8 V110 M370 8 V110" stroke-width="1.4"/>
   <path d="M30 110 C30 60 120 52 170 30 C186 22 194 14 200 8 C206 14 214 22 230 30 C280 52 370 60 370 110" stroke-width="1.8"/>
   <path d="M44 110 C44 68 128 62 176 40 C190 33 196 26 200 22 C204 26 210 33 224 40 C272 62 356 68 356 110" stroke-width=".8"/>
   <g stroke-width=".9">${[70, 110, 150, 250, 290, 330].map((x) => `<path d="M${x} 8 l8 8 -8 8 -8 -8Z"/>`).join("")}</g>
   <path d="M200 30 v14 M193 37 h14" stroke-width="1.2"/>`,
  "0 0 400 120",
);
const ARAB_CORNER = svgUri(
  `<path d="M6 214 V100 M6 214 H120" stroke-width="1.6"/>
   <g transform="translate(46 174)" stroke-width="1.3"><rect x="-22" y="-22" width="44" height="44"/><rect x="-22" y="-22" width="44" height="44" transform="rotate(45)"/><circle r="9"/></g>
   <path d="M6 140 C30 140 40 130 40 110 M80 214 C80 190 90 180 110 180" stroke-width="1"/>
   <circle cx="6" cy="96" r="3" fill="currentColor" stroke="none"/><circle cx="124" cy="214" r="3" fill="currentColor" stroke="none"/>`,
  "0 0 300 220",
);
const ARAB_SIDE = svgUri(
  `<path d="M60 0 V96" stroke-width="1" stroke-dasharray="2 4"/>
   <path d="M48 96 H72 L66 104 H54Z" stroke-width="1.3"/>
   <path d="M50 104 C38 124 38 150 50 172 H70 C82 150 82 124 70 104Z" stroke-width="1.6"/>
   <path d="M60 104 V172 M44 138 H76" stroke-width=".7"/><path d="M52 172 H68 L64 182 H56Z" stroke-width="1.2"/>
   <path d="M60 182 V196" stroke-width="1"/><circle cx="60" cy="200" r="3" fill="currentColor" stroke="none"/>`,
  "0 0 120 300",
);
const ARAB_EMBLEM = svgUri(
  `<g transform="translate(100 100)">
     <rect x="-46" y="-46" width="92" height="92" stroke-width="1.6"/><rect x="-46" y="-46" width="92" height="92" transform="rotate(45)" stroke-width="1.6"/>
     <circle r="34" stroke-width=".9"/><circle r="22" stroke-width="1.2"/>
     <rect x="-14" y="-14" width="28" height="28" transform="rotate(45)" fill="currentColor" stroke="none" opacity=".85"/>
   </g>`,
  "0 0 200 200",
);

const LINE_FRAME = svgUri(
  `<path d="M40 30 C120 70 280 70 360 30" stroke-width="1.2"/>
   <path d="M120 54 c-4 -12 4 -20 12 -16 M150 62 c-2 -12 8 -18 14 -12 M250 62 c2 -12 -8 -18 -14 -12 M280 54 c4 -12 -4 -20 -12 -16" stroke-width="1"/>
   <path d="M200 66 c-8 -10 -8 -22 0 -28 c8 6 8 18 0 28Z" stroke-width="1.1"/>
   <circle cx="40" cy="30" r="2.5" fill="currentColor" stroke="none"/><circle cx="360" cy="30" r="2.5" fill="currentColor" stroke="none"/>`,
  "0 0 400 90",
);
const LINE_CORNER = svgUri(
  `<path d="M10 214 C40 170 80 130 150 110" stroke-width="1.3"/>
   <path d="M40 176 c-14 -6 -16 -22 -2 -22 c10 6 8 18 2 22Z M68 150 c-14 -4 -14 -20 0 -20 c8 6 6 16 0 20Z M98 130 c-12 -2 -10 -18 2 -16 c8 6 4 14 -2 16Z" stroke-width="1"/>
   <path d="M50 184 c12 10 26 4 22 -6 c-8 -6 -18 -2 -22 6Z M82 160 c12 10 26 4 22 -6 c-8 -6 -18 -2 -22 6Z" stroke-width="1"/>
   <circle cx="150" cy="110" r="3" fill="currentColor" stroke="none"/>`,
  "0 0 300 220",
);
const LINE_SIDE = svgUri(
  `<path d="M40 0 C70 60 30 140 60 200 C80 240 56 270 60 300" stroke-width="1.1"/>
   <path d="M52 44 c12 -6 22 2 16 10 c-8 2 -14 -2 -16 -10Z M46 104 c-12 -6 -22 2 -16 10 c8 2 14 -2 16 -10Z M58 168 c12 -6 22 2 16 10 c-8 2 -14 -2 -16 -10Z M66 232 c-12 -6 -22 2 -16 10 c8 2 14 -2 16 -10Z" stroke-width=".9"/>`,
  "0 0 120 300",
);
const LINE_EMBLEM = svgUri(
  `<circle cx="100" cy="100" r="46" stroke-width="1.2"/>
   <path d="M66 140 C46 120 46 84 64 62 M134 140 C154 120 154 84 136 62" stroke-width="1"/>
   <path d="M58 112 c-10 -2 -12 -14 -2 -14 c6 4 6 10 2 14Z M56 86 c-8 -4 -8 -14 2 -12 c4 4 2 10 -2 12Z M142 112 c10 -2 12 -14 2 -14 c-6 4 -6 10 -2 14Z M144 86 c8 -4 8 -14 -2 -12 c-4 4 -2 10 2 12Z" stroke-width=".9"/>
   <circle cx="100" cy="146" r="2.5" fill="currentColor" stroke="none"/>`,
  "0 0 200 200",
);

const BATIK_FRAME = svgUri(
  `<path d="M0 10 H400 M0 18 H400" stroke-width="1.3"/>
   <path d="M24 18 L52 46 L80 18 L108 46 L136 18 L164 46 L200 76 L236 46 L264 18 L292 46 L320 18 L348 46 L376 18" stroke-width="1.4"/>
   <path d="M174 46 L200 24 L226 46 L200 66 Z" stroke-width="1.4"/>
   <circle cx="200" cy="45" r="5" fill="currentColor" stroke="none"/>
   <g fill="currentColor" stroke="none">${[52, 108, 292, 348].map((x) => `<circle cx="${x}" cy="34" r="2.5"/>`).join("")}</g>`,
  "0 0 400 95",
);
const BATIK_CORNER = svgUri(
  `<path d="M8 212 V92 M8 212 H128" stroke-width="1.8"/>
   <path d="M18 202 V112 M18 202 H108" stroke-width=".8"/>
   <g transform="translate(54 166)" stroke-width="1.2">
     <ellipse rx="24" ry="11" transform="rotate(45)"/>
     <ellipse rx="24" ry="11" transform="rotate(-45)"/>
     <circle r="6" fill="currentColor" stroke="none"/>
   </g>
   <path d="M8 102 L20 114 L8 126 M118 212 L106 200 L94 212" stroke-width="1.2"/>`,
  "0 0 300 220",
);
const BATIK_SIDE = svgUri(
  `<path d="M60 0 V300" stroke-width="1"/>
   <path d="M46 40 L60 22 L74 40 L60 58 Z M44 130 L60 108 L76 130 L60 152 Z M46 220 L60 202 L74 220 L60 238 Z" stroke-width="1.3"/>
   <circle cx="60" cy="40" r="3" fill="currentColor" stroke="none"/>
   <circle cx="60" cy="130" r="3.5" fill="currentColor" stroke="none"/>
   <circle cx="60" cy="220" r="3" fill="currentColor" stroke="none"/>`,
  "0 0 120 300",
);
const BATIK_EMBLEM = svgUri(
  `<path d="M100 24 C122 58 148 92 142 140 C138 158 122 170 100 176 C78 170 62 158 58 140 C52 92 78 58 100 24 Z" stroke-width="1.6"/>
   <path d="M100 44 V166 M74 110 C86 98 114 98 126 110 M78 134 C90 124 110 124 122 134" stroke-width="1.1"/>
   <path d="M100 66 L112 84 L100 100 L88 84 Z" stroke-width="1.2"/>
   <circle cx="100" cy="84" r="3.5" fill="currentColor" stroke="none"/>`,
  "0 0 200 200",
);

const BOHO_FRAME = svgUri(
  `<path d="M24 92 C24 30 96 14 200 14 C304 14 376 30 376 92" stroke-width="1.6"/>
   <path d="M48 92 C48 44 110 28 200 28 C290 28 352 44 352 92" stroke-width=".9" stroke-dasharray="4 5"/>
   <path d="M200 14 V38 M182 28 Q200 44 218 28" stroke-width="1.2"/>
   <circle cx="200" cy="48" r="4" fill="currentColor" stroke="none"/>`,
  "0 0 400 105",
);
const BOHO_CORNER = svgUri(
  `<path d="M12 214 C28 156 62 118 112 92" stroke-width="1.5"/>
   <path d="M40 162 C26 144 24 122 36 108 M56 144 C44 126 48 104 62 94 M74 126 C66 110 74 92 90 86" stroke-width="1"/>
   <path d="M52 174 C72 168 92 174 106 186 M72 154 C92 146 114 150 128 162" stroke-width="1"/>
   <path d="M16 214 C56 196 98 188 144 192" stroke-width="1.2" stroke-dasharray="3 4"/>
   <circle cx="116" cy="90" r="3" fill="currentColor" stroke="none"/>`,
  "0 0 300 220",
);
const BOHO_SIDE = svgUri(
  `<path d="M60 0 V260" stroke-width=".9" stroke-dasharray="2 6"/>
   <path d="M60 56 A14 14 0 1 0 60 84 A10 10 0 1 1 60 56 Z" fill="currentColor" stroke="none"/>
   <circle cx="60" cy="148" r="8" stroke-width="1.3"/>
   <circle cx="60" cy="148" r="3" fill="currentColor" stroke="none"/>
   <path d="M48 220 Q60 202 72 220 Q60 238 48 220 Z" stroke-width="1.2"/>`,
  "0 0 120 300",
);
const BOHO_EMBLEM = svgUri(
  `<path d="M42 126 A58 58 0 0 1 158 126" stroke-width="1.6"/>
   <path d="M58 126 A42 42 0 0 1 142 126" stroke-width="1"/>
   <path d="M28 126 H172" stroke-width="1.4"/>
   <path d="M100 44 V64 M64 58 L76 74 M136 58 L124 74 M44 86 L62 96 M156 86 L138 96" stroke-width="1.2"/>
   <circle cx="100" cy="108" r="8" fill="currentColor" stroke="none"/>`,
  "0 0 200 180",
);

const EDITORIAL_FRAME = svgUri(
  `<path d="M16 14 H384 M16 22 H384" stroke-width="1.4"/>
   <path d="M16 14 V52 M24 22 V44 M384 14 V52 M376 22 V44" stroke-width="1.2"/>
   <path d="M170 22 L200 46 L230 22" stroke-width="1.2"/>
   <path d="M192 18 L200 10 L208 18 L200 26 Z" fill="currentColor" stroke="none"/>`,
  "0 0 400 72",
);
const EDITORIAL_CORNER = svgUri(
  `<path d="M10 210 V116 H26 V194 H104 V210 Z" stroke-width="1.5"/>
   <path d="M26 116 L40 130 M104 194 L90 180" stroke-width="1"/>
   <path d="M18 102 L24 94 L30 102 L24 110 Z M118 196 L126 202 L118 208 L110 202 Z" fill="currentColor" stroke="none"/>`,
  "0 0 300 220",
);
const EDITORIAL_SIDE = svgUri(
  `<path d="M56 16 V284 M64 36 V264" stroke-width=".9"/>
   <path d="M56 150 L60 142 L64 150 L60 158 Z" fill="currentColor" stroke="none"/>
   <circle cx="56" cy="16" r="2.5" fill="currentColor" stroke="none"/>
   <circle cx="56" cy="284" r="2.5" fill="currentColor" stroke="none"/>`,
  "0 0 120 300",
);
const EDITORIAL_EMBLEM = svgUri(
  `<rect x="58" y="58" width="84" height="84" stroke-width="1.4"/>
   <rect x="66" y="66" width="68" height="68" stroke-width=".8"/>
   <path d="M100 42 L158 100 L100 158 L42 100 Z" stroke-width="1.2"/>
   <circle cx="100" cy="100" r="6" fill="currentColor" stroke="none"/>`,
  "0 0 200 200",
);

export const ART_KIT_DEFS: Record<Exclude<ArtKitKey, "none">, ArtKit> = {
  "taman-kayon": {
    label: "Taman Kayon",
    hint: "Javanese / adat garden: carved gebyok gate, golden kayon, misty garden, pink peonies. Light themes.",
    assets: {
      frame: { src: art("taman-kayon", "gebyok.svg"), ratio: 0.375 },
      corner: { src: art("taman-kayon", "rangkaian-bunga.svg"), ratio: 0.73 },
      side: { src: art("taman-kayon", "sulur-gantung.svg"), ratio: 2.5 },
      emblem: { src: art("taman-kayon", "kayon.svg"), ratio: 1.3 },
    },
    backdrop: art("taman-kayon", "taman-kabut.svg"),
    particles: "petals",
  },
  "kebun-sage": {
    label: "Kebun Sage",
    hint: "Garden / rustic / sage green: eucalyptus garland, white roses, olive wreath. Light themes.",
    assets: {
      frame: { src: art("kebun-sage", "garland.svg"), ratio: 0.3 },
      corner: { src: art("kebun-sage", "buket.svg"), ratio: 0.73 },
      side: { src: art("kebun-sage", "sulur.svg"), ratio: 2.5 },
      emblem: { src: art("kebun-sage", "lingkar.svg"), ratio: 1 },
    },
    backdrop: art("kebun-sage", "latar.svg"),
    particles: "leaves",
  },
  "mawar-vintage": {
    label: "Mawar Vintage",
    hint: "Romantic / vintage / blush, dusty rose or burgundy: rose swag, rose vine, silk ribbon, old paper. Light themes.",
    assets: {
      frame: { src: art("mawar-vintage", "garland.svg"), ratio: 0.3 },
      corner: { src: art("mawar-vintage", "buket.svg"), ratio: 0.73 },
      side: { src: art("mawar-vintage", "sulur.svg"), ratio: 2.5 },
      emblem: { src: art("mawar-vintage", "pita.svg"), ratio: 0.7 },
    },
    backdrop: art("mawar-vintage", "latar.svg"),
    particles: "petals",
  },
  "kamboja-tropis": {
    label: "Kamboja Tropis",
    hint: "Beach / tropical / Bali / boho / terracotta: palm fronds, monstera, frangipani, sunset. Light themes.",
    assets: {
      frame: { src: art("kamboja-tropis", "garland.svg"), ratio: 0.325 },
      corner: { src: art("kamboja-tropis", "buket.svg"), ratio: 0.73 },
      side: { src: art("kamboja-tropis", "sulur.svg"), ratio: 2.5 },
      emblem: { src: art("kamboja-tropis", "matahari.svg"), ratio: 0.75 },
    },
    backdrop: art("kamboja-tropis", "latar.svg"),
    particles: "petals",
  },
  "deco-emas": {
    label: "Art Deco Emas",
    hint: "Luxury / glamour / black, navy or emerald with gold: stepped deco frame, fan corners, sunburst. Tinted with the accent; best on dark themes.",
    assets: {
      frame: { src: DECO_FRAME, ratio: 0.25 },
      corner: { src: DECO_CORNER, ratio: 0.73 },
      side: { src: DECO_SIDE, ratio: 2.5 },
      emblem: { src: DECO_EMBLEM, ratio: 1 },
    },
    tinted: true,
    particles: "gold-dust",
  },
  arabesque: {
    label: "Arabesque",
    hint: "Islamic / walimah / Middle-Eastern: pointed mihrab arch, hanging lanterns, eight-point star. Tinted with the accent; light or dark.",
    assets: {
      frame: { src: ARAB_FRAME, ratio: 0.3 },
      corner: { src: ARAB_CORNER, ratio: 0.73 },
      side: { src: ARAB_SIDE, ratio: 2.5 },
      emblem: { src: ARAB_EMBLEM, ratio: 1 },
    },
    tinted: true,
    particles: "gold-dust",
  },
  "garis-halus": {
    label: "Garis Halus",
    hint: "Minimal / modern / monochrome / editorial: fine single-line botanicals. Tinted with the accent; light or dark.",
    assets: {
      frame: { src: LINE_FRAME, ratio: 0.225 },
      corner: { src: LINE_CORNER, ratio: 0.73 },
      side: { src: LINE_SIDE, ratio: 2.5 },
      emblem: { src: LINE_EMBLEM, ratio: 1 },
    },
    tinted: true,
    particles: "leaves",
  },
  "batik-parang": {
    label: "Batik Parang",
    hint: "Javanese / Minang / heritage batik & songket linework: geometric parang border, kawung corners, gunungan crest. Tinted with accent; light or dark.",
    assets: {
      frame: { src: BATIK_FRAME, ratio: 0.24 },
      corner: { src: BATIK_CORNER, ratio: 0.73 },
      side: { src: BATIK_SIDE, ratio: 2.5 },
      emblem: { src: BATIK_EMBLEM, ratio: 1 },
    },
    tinted: true,
    particles: "gold-dust",
  },
  "boho-pampas": {
    label: "Boho Pampas",
    hint: "Bohemian / terracotta / rustic kraft: layered desert arch, dried pampas corners, crescent beads, horizon sun. Tinted with accent.",
    assets: {
      frame: { src: BOHO_FRAME, ratio: 0.26 },
      corner: { src: BOHO_CORNER, ratio: 0.73 },
      side: { src: BOHO_SIDE, ratio: 2.5 },
      emblem: { src: BOHO_EMBLEM, ratio: 0.9 },
    },
    tinted: true,
    particles: "leaves",
  },
  "editorial-monogram": {
    label: "Editorial Monogram",
    hint: "Classic stationery / newspaper / luxury editorial: double-rule masthead, mitered corner brackets, diamond crest. Tinted with accent.",
    assets: {
      frame: { src: EDITORIAL_FRAME, ratio: 0.18 },
      corner: { src: EDITORIAL_CORNER, ratio: 0.73 },
      side: { src: EDITORIAL_SIDE, ratio: 2.5 },
      emblem: { src: EDITORIAL_EMBLEM, ratio: 1 },
    },
    tinted: true,
    particles: "gold-dust",
  },
};

/** Every kit asset as a flat list, for the Kanvas illustration library. */
export function artKitLibrary() {
  return (Object.entries(ART_KIT_DEFS) as [Exclude<ArtKitKey, "none">, ArtKit][]).map(([key, kit]) => ({
    key,
    label: kit.label,
    tinted: Boolean(kit.tinted),
    items: (Object.entries(kit.assets) as [Slot, KitAsset][]).map(([slot, a]) => ({ slot, src: a.src, ratio: a.ratio })),
    backdrop: kit.backdrop,
  }));
}

function isDark(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
}

function hue(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const [r, g, b] = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (!d) return { h: 0, s: 0 };
  let hh = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hh = (hh * 60 + 360) % 360;
  return { h: hh, s: d / (1 - Math.abs(max + min - 1) || 1) };
}

/** Picks a kit from the theme's own choices, so even a one-line prompt ends up fully composed. */
export function pickArtKit(theme: AiTheme): Exclude<ArtKitKey, "none"> {
  const dark = isDark(theme.palette.background);
  const text = `${theme.name} ${theme.mood}`.toLowerCase();
  if (theme.ornament === "arabesque" || /islam|walimah|syar|masjid|arab/.test(text)) return "arabesque";
  if (dark || theme.ornament === "art-deco") return theme.ornament === "minimal-rule" || theme.ornament === "none" ? "garis-halus" : "deco-emas";
  if (theme.ornament === "batik-kawung" || /kawung|parang|songket|batik/.test(text)) return "batik-parang";
  if (/jawa|java|adat|keraton|sunda|kayon|gunungan/.test(text)) return "taman-kayon";
  if (/boho|terakota|terracotta|pampas|rustic|kayu/.test(text)) return "boho-pampas";
  if (theme.ornament === "wave-line" || /pantai|beach|tropi|bali|senja/.test(text)) return "kamboja-tropis";
  if (/koran|editorial|monogram|klasik|mutiara|anggur|champagne/.test(text)) return "editorial-monogram";
  if (theme.ornament === "minimal-rule" || theme.ornament === "none" || theme.layout.cover === "typographic") return "garis-halus";
  const { h, s } = hue(theme.palette.accent);
  if (s > 0.12 && (h < 20 || h > 320)) return "mawar-vintage";
  if (theme.ornament === "floral-line" || theme.ornament === "flourish") return /mawar|rose|vintage|romant|blush|pink/.test(text) ? "mawar-vintage" : "kebun-sage";
  if (s > 0.08 && h > 70 && h < 170) return "kebun-sage";
  return theme.ornament === "botanical" ? "kebun-sage" : "mawar-vintage";
}

/** The kit a theme renders with: its own choice, or one picked from its style. "none" opts out. */
export function resolveArtKit(theme: AiTheme): ArtKitKey {
  return theme.artKit ?? pickArtKit(theme);
}

interface PlaceOpts {
  section: CanvasSectionId;
  slot: Slot;
  x: number;
  y: number;
  size: number;
  z: number;
  flip?: boolean;
  anim?: CanvasLayer["animation"];
  dur?: number;
  delay?: number;
  opacity?: number;
}

/**
 * Lays a kit out across the invitation with fixed, tested placements. Decorations stay behind the text
 * (z ≤ 5) except where a section paints its own full photo (photo cover, closing), where they sit in
 * front at the edges and leave the centre clear.
 */
export function composeArtKit(theme: AiTheme, key: ArtKitKey): { layers: CanvasLayer[]; sectionStyles: NonNullable<AiTheme["sectionStyles"]> } {
  if (key === "none") return { layers: [], sectionStyles: {} };
  const kit = ART_KIT_DEFS[key];
  const color = kit.tinted ? theme.palette.accent : undefined;
  const photoCover = theme.layout.cover === "photo-fullbleed";
  const layers: CanvasLayer[] = [];
  const place = ({ section, slot, x, y, size, z, flip, anim, dur, delay, opacity }: PlaceOpts) => {
    const a = kit.assets[slot];
    if (!a) return;
    layers.push({
      id: `kit-${key}-${section}-${slot}-${layers.length}`,
      section,
      kind: "image",
      value: a.src,
      x,
      y,
      size,
      heightRatio: Math.min(3, Math.max(0.2, a.ratio)),
      rotation: 0,
      opacity: opacity ?? (kit.tinted ? 0.9 : 1),
      zIndex: z,
      ...(flip ? { flipX: true } : {}),
      ...(anim ? { animation: anim, animationDuration: dur ?? 8, ...(delay ? { animationDelay: delay } : {}) } : {}),
      ...(color ? { color } : {}),
    });
  };

  const coverZ = photoCover ? 20 : 5;
  // Cover: frame on top, vines down the sides, bouquets in both bottom corners
  place({ section: "cover", slot: "frame", x: 50, y: 6, size: 420, z: photoCover ? 20 : 4 });
  place({ section: "cover", slot: "side", x: 7, y: 40, size: 78, z: photoCover ? 20 : 3, anim: "sway", dur: 8, opacity: 0.9 });
  place({ section: "cover", slot: "side", x: 93, y: 42, size: 78, z: photoCover ? 20 : 3, flip: true, anim: "sway", dur: 9, delay: 1, opacity: 0.9 });
  place({ section: "cover", slot: "corner", x: 21, y: 93, size: 250, z: coverZ, anim: "sway", dur: 7 });
  place({ section: "cover", slot: "corner", x: 80, y: 95, size: 230, z: coverZ, flip: true, anim: "sway", dur: 8, delay: 1.4 });
  // Opening: the emblem introduces the story
  place({ section: "opening", slot: "emblem", x: 50, y: 7, size: 70, z: 3, anim: "float", dur: 6 });
  // Couple: bouquets in the corners
  place({ section: "couple", slot: "corner", x: 14, y: 97, size: 170, z: 3, anim: "sway", dur: 8, opacity: 0.95 });
  place({ section: "couple", slot: "corner", x: 86, y: 97, size: 170, z: 3, flip: true, anim: "sway", dur: 9, delay: 1, opacity: 0.95 });
  // Events: vines on the edges
  place({ section: "events", slot: "side", x: 4, y: 18, size: 58, z: 2, anim: "sway", dur: 9, opacity: 0.7 });
  place({ section: "events", slot: "side", x: 96, y: 70, size: 58, z: 2, flip: true, anim: "sway", dur: 10, opacity: 0.7 });
  // Gift: a small emblem
  place({ section: "gift", slot: "emblem", x: 50, y: 6, size: 54, z: 3, anim: "float", dur: 7, opacity: 0.85 });
  // Closing sits on a photo: frame and bouquets in front, centre left clear
  place({ section: "closing", slot: "frame", x: 50, y: 6, size: 420, z: 20 });
  place({ section: "closing", slot: "corner", x: 20, y: 94, size: 220, z: 20, anim: "sway", dur: 7 });
  place({ section: "closing", slot: "corner", x: 82, y: 95, size: 210, z: 20, flip: true, anim: "sway", dur: 8, delay: 1.2 });

  const sectionStyles: NonNullable<AiTheme["sectionStyles"]> = {};
  if (kit.backdrop && !isDark(theme.palette.background)) {
    const bd: SectionStyle = { backgroundImage: kit.backdrop, overlayOpacity: 0.1 };
    if (!photoCover) sectionStyles.cover = bd;
    sectionStyles.couple = { backgroundImage: kit.backdrop, overlayOpacity: 0.45 };
  }
  return { layers, sectionStyles };
}

/**
 * The theme as rendered: when it has no hand-placed layers yet, its art kit is composed in. Hand-made
 * canvas designs (layers present) and HTML templates are left untouched.
 */
export function withArtKit(theme: AiTheme): AiTheme {
  if (theme.customHtml?.trim()) return theme;
  const key = resolveArtKit(theme);
  if (key === "none") return theme;
  const particles = theme.particles ?? ART_KIT_DEFS[key].particles;
  // Hand-placed canvas layers are kept as they are; only the ambient particles are added
  if (theme.layers?.length) return { ...theme, particles };
  const { layers, sectionStyles } = composeArtKit(theme, key);
  return {
    ...theme,
    layers,
    particles,
    // The theme's own section styles win over the kit's backdrops
    sectionStyles: { ...sectionStyles, ...(theme.sectionStyles ?? {}) },
  };
}
