import { z } from "zod";

// Curated options only — the model picks from these, it never invents fonts or layouts.
// Keep in sync with components/templates/ai-design/ and lib/ai-design/prompt.ts.

export const DISPLAY_FONTS = [
  "Cormorant Garamond",
  "Playfair Display",
  "Cinzel",
  "Italiana",
  "Marcellus",
  "Bodoni Moda",
  "DM Serif Display",
  "Fraunces",
  "Gilda Display",
  "Tenor Sans",
] as const;

export const SCRIPT_FONTS = [
  "Great Vibes",
  "Parisienne",
  "Pinyon Script",
  "Allura",
  "Alex Brush",
  "Dancing Script",
  "Sacramento",
  "Tangerine",
] as const;

export const BODY_FONTS = [
  "Plus Jakarta Sans",
  "Jost",
  "Montserrat",
  "Poppins",
  "Inter",
  "Manrope",
  "DM Sans",
  "Figtree",
  "Lora",
  "EB Garamond",
  "Karla",
  "Outfit",
] as const;

export const LAYER_ANIMATIONS = [
  "none",
  "float",
  "sway",
  "pulse",
  "spin-slow",
  "fade-up",
  "zoom-in",
  "slide-left",
  "slide-right",
  "drift",
] as const;

export type LayerAnimation = (typeof LAYER_ANIMATIONS)[number];

/** Ambient particles falling over the cover and closing. */
export const PARTICLES = ["none", "petals", "gold-dust", "leaves"] as const;
export type ParticleKind = (typeof PARTICLES)[number];

export const SECTION_ENTRANCES = ["fade-up", "zoom-in", "slide-left", "slide-right", "none"] as const;
export type SectionEntrance = (typeof SECTION_ENTRANCES)[number];

export const ORNAMENTS = [
  "none",
  "minimal-rule",
  "floral-line",
  "botanical",
  "art-deco",
  "batik-kawung",
  "arabesque",
  "wave-line",
  "flourish",
] as const;

export const TEXTURES = ["none", "paper", "linen", "grain"] as const;

/** Illustration sets composed across the invitation (see lib/ai-design/art-kits.ts). */
export const ART_KITS = [
  "taman-kayon",
  "kebun-sage",
  "mawar-vintage",
  "kamboja-tropis",
  "deco-emas",
  "arabesque",
  "garis-halus",
  "batik-parang",
  "boho-pampas",
  "editorial-monogram",
  "none",
] as const;

export const COVER_LAYOUTS = ["photo-fullbleed", "centered-frame", "arch-window", "split-photo", "typographic"] as const;
export const COUPLE_LAYOUTS = ["portrait-circle", "side-by-side", "stacked-arch", "editorial"] as const;
export const EVENT_LAYOUTS = ["cards", "timeline", "ticket"] as const;
export const GALLERY_LAYOUTS = ["masonry", "grid", "filmstrip"] as const;

const hex = z.string().describe("Hex colour like #F5EFE6");

export const AiThemeSchema = z.object({
  name: z.string().describe("Short evocative theme name in Indonesian or Javanese/Sundanese, 1-3 words"),
  mood: z.string().describe("One sentence describing the mood, in Indonesian"),
  palette: z.object({
    background: hex.describe("Page background, usually a light warm neutral or a deep dark tone"),
    surface: hex.describe("Card/section surface, close to background"),
    ink: hex.describe("Main text colour, must contrast strongly with background"),
    muted: hex.describe("Secondary text colour"),
    accent: hex.describe("Single accent for ornaments, buttons and highlights"),
    accentSoft: hex.describe("Very soft tint of the accent for subtle fills"),
    onAccent: hex.describe("Text colour on top of accent buttons"),
  }),
  typography: z.object({
    display: z.enum(DISPLAY_FONTS).describe("Headings and section titles"),
    names: z.enum([...DISPLAY_FONTS, ...SCRIPT_FONTS]).describe("Couple names; a script font only if it suits the mood"),
    body: z.enum(BODY_FONTS).describe("Body text"),
    displayItalic: z.boolean().describe("Use italic for display headings"),
    labelStyle: z.enum(["uppercase-tracked", "small-caps", "plain"]).describe("Style of small labels like 'THE WEDDING OF'"),
  }),
  ornament: z.enum(ORNAMENTS),
  texture: z.enum(TEXTURES),
  corners: z.enum(["sharp", "soft", "arch"]).describe("Shape language for frames and photos"),
  frame: z.enum(["none", "hairline", "double", "dotted"]).describe("Border style of cards and quote boxes"),
  metallic: z.boolean().describe("Render accent ornaments and the couple names as metallic foil (gold/silver/rose-gold accents only)"),
  artKit: z
    .enum(ART_KITS)
    .optional()
    .describe(
      "Illustration set layered over the whole invitation: taman-kayon (Javanese garden & peonies), kebun-sage (garden, sage, eucalyptus), mawar-vintage (romantic roses), kamboja-tropis (Bali frangipani & palm), deco-emas (luxury gold art deco, dark themes), arabesque (Islamic), garis-halus (fine botanical linework), batik-parang (Javanese/songket woven heritage motif), boho-pampas (bohemian desert arch & dried pampas), editorial-monogram (classic double-rule monogram framing). Pick one; 'none' only for ultra-minimal/photo-first themes.",
    ),
  layout: z.object({
    cover: z.enum(COVER_LAYOUTS),
    couple: z.enum(COUPLE_LAYOUTS),
    events: z.enum(EVENT_LAYOUTS),
    gallery: z.enum(GALLERY_LAYOUTS),
  }),
  copy: z.object({
    coverEyebrow: z.string().describe("Tiny label above the names on the cover, e.g. 'The Wedding of' or 'Walimatul Ursy'"),
    openButton: z.string().describe("Cover button label, 2-3 words, e.g. 'Buka Undangan'"),
    greeting: z.string().describe("Opening salutation, e.g. 'Assalamu’alaikum Warahmatullahi Wabarakatuh' or a neutral greeting"),
    opening: z.string().describe("1-2 sentence invitation opening in polite Indonesian"),
    closing: z.string().describe("1-2 sentence closing thanks in polite Indonesian"),
  }),
});

export const ThemeAssetsSchema = z.object({
  backgroundImage: z.string().optional(),
  ornamentImage: z.string().optional(),
});

export const CANVAS_SECTION_IDS = [
  "cover",
  "opening",
  "couple",
  "countdown",
  "events",
  "story",
  "gallery",
  "video",
  "gift",
  "rsvp",
  "closing",
] as const;

export type CanvasSectionId = (typeof CANVAS_SECTION_IDS)[number];

export const REORDERABLE_SECTIONS = [
  "opening",
  "couple",
  "countdown",
  "events",
  "story",
  "gallery",
  "video",
  "gift",
  "rsvp",
] as const;

export type ReorderableSectionId = (typeof REORDERABLE_SECTIONS)[number];

export const CanvasLayerSchema = z.object({
  id: z.string().min(1).max(60),
  section: z.enum(CANVAS_SECTION_IDS),
  kind: z.enum(["preset", "image", "text"]),
  value: z.string().min(1).max(16000),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  size: z.number().min(20).max(420),
  heightRatio: z.number().min(0.2).max(3).optional(),
  rotation: z.number().min(-180).max(180).default(0),
  opacity: z.number().min(0.05).max(1).default(0.85),
  zIndex: z.number().int().min(0).max(50).optional(),
  locked: z.boolean().optional(),
  frameSlot: z.enum(["cover", "bride", "groom", "gallery0", "gallery1"]).optional(),
  animation: z.enum(LAYER_ANIMATIONS).optional(),
  animationDuration: z.number().min(1).max(15).optional(),
  animationDelay: z.number().min(0).max(5).optional(),
  flipX: z.boolean().optional(),
  color: z.string().optional(),
  bgColor: z.string().optional(),
  borderRadius: z.number().min(0).max(60).optional(),
  font: z.enum([...DISPLAY_FONTS, ...SCRIPT_FONTS, ...BODY_FONTS]).optional(),
  fontWeight: z.enum(["normal", "medium", "bold"]).optional(),
  italic: z.boolean().optional(),
  uppercase: z.boolean().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  letterSpacing: z.number().min(-0.05).max(0.4).optional(),
  lineHeight: z.number().min(0.9).max(2.2).optional(),
});

export type CanvasLayer = z.infer<typeof CanvasLayerSchema>;

export const SectionStyleSchema = z.object({
  background: z.string().optional(),
  backgroundEnd: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  surfaceColor: z.string().optional(),
  displayFont: z.enum([...DISPLAY_FONTS, ...SCRIPT_FONTS]).optional(),
  bodyFont: z.enum(BODY_FONTS).optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  paddingY: z.enum(["compact", "normal", "spacious"]).optional(),
  minHeight: z.number().min(200).max(900).optional(),
  clearDecor: z.boolean().optional(),
  backgroundImage: z.string().optional(),
  overlayOpacity: z.number().min(0).max(0.9).optional(),
  entrance: z.enum(SECTION_ENTRANCES).optional(),
});

export type SectionStyle = z.infer<typeof SectionStyleSchema>;

export const CanvasConfigSchema = z.object({
  sectionOrder: z.array(z.enum(REORDERABLE_SECTIONS)).optional(),
  hiddenSections: z.array(z.enum(REORDERABLE_SECTIONS)).optional(),
  layers: z.array(CanvasLayerSchema).max(60).optional(),
  // partialRecord: a theme styles only some sections. (In Zod 4 z.record with enum keys demands every
  // key, which made any partial sectionStyles fail and silently dropped all layers and canvas settings.)
  sectionStyles: z.partialRecord(z.enum(CANVAS_SECTION_IDS), SectionStyleSchema).optional(),
  customHtml: z.string().max(150_000).optional(),
  particles: z.enum(PARTICLES).optional(),
});

export type ThemeAssets = z.infer<typeof ThemeAssetsSchema>;
export type AiTheme = z.infer<typeof AiThemeSchema> & {
  assets?: ThemeAssets;
  sectionOrder?: ReorderableSectionId[];
  hiddenSections?: ReorderableSectionId[];
  layers?: CanvasLayer[];
  sectionStyles?: Partial<Record<CanvasSectionId, SectionStyle>>;
  customHtml?: string;
  particles?: ParticleKind;
};

export const DEFAULT_AI_THEME: AiTheme = {
  name: "Sekar Arum",
  mood: "Hangat, klasik, dan tenang dengan sentuhan emas lembut.",
  palette: {
    background: "#F7F2EA",
    surface: "#FBF8F3",
    ink: "#2B2620",
    muted: "#6E655A",
    accent: "#A9824B",
    accentSoft: "#EFE4D2",
    onAccent: "#FFFFFF",
  },
  typography: {
    display: "Cormorant Garamond",
    names: "Pinyon Script",
    body: "Jost",
    displayItalic: true,
    labelStyle: "uppercase-tracked",
  },
  ornament: "floral-line",
  texture: "paper",
  corners: "arch",
  frame: "hairline",
  metallic: false,
  artKit: "mawar-vintage",
  layout: { cover: "arch-window", couple: "stacked-arch", events: "cards", gallery: "masonry" },
  copy: {
    coverEyebrow: "The Wedding of",
    openButton: "Buka Undangan",
    greeting: "Assalamu’alaikum Warahmatullahi Wabarakatuh",
    opening: "Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami.",
    closing: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
  },
};

/** Clean slate starting point with zero ornaments, borders, or textures — ideal for freeform Canva-style design. */
export const BLANK_CANVAS_THEME: AiTheme = {
  name: "Kanvas Kosong",
  mood: "Mulai bebas dari kanvas putih polos untuk desain kustom sepenuhnya.",
  palette: {
    background: "#FFFFFF",
    surface: "#FAF8F4",
    ink: "#15130F",
    muted: "#6B6358",
    accent: "#8A6A2F",
    accentSoft: "#F4EAD6",
    onAccent: "#FFFFFF",
  },
  typography: {
    display: "Cormorant Garamond",
    names: "Cormorant Garamond",
    body: "Plus Jakarta Sans",
    displayItalic: false,
    labelStyle: "uppercase-tracked",
  },
  ornament: "none",
  texture: "none",
  corners: "soft",
  frame: "none",
  metallic: false,
  layout: { cover: "centered-frame", couple: "stacked-arch", events: "cards", gallery: "grid" },
  copy: {
    coverEyebrow: "The Wedding of",
    openButton: "Buka Undangan",
    greeting: "Dengan penuh rasa syukur",
    opening: "Kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam momen bahagia kami.",
    closing: "Terima kasih atas doa restu dan kehadiran Anda.",
  },
  layers: [],
};
