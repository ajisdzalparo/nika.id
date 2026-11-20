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

export const SCRIPT_FONTS = ["Great Vibes", "Parisienne", "Pinyon Script", "Allura", "Alex Brush"] as const;

export const BODY_FONTS = ["Jost", "Manrope", "DM Sans", "Figtree", "Lora", "EB Garamond", "Karla", "Outfit"] as const;

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

export type ThemeAssets = z.infer<typeof ThemeAssetsSchema>;
export type AiTheme = z.infer<typeof AiThemeSchema> & { assets?: ThemeAssets };

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
  layout: { cover: "arch-window", couple: "stacked-arch", events: "cards", gallery: "masonry" },
  copy: {
    coverEyebrow: "The Wedding of",
    openButton: "Buka Undangan",
    greeting: "Assalamu’alaikum Warahmatullahi Wabarakatuh",
    opening: "Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami.",
    closing: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
  },
};
