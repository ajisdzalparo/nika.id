import { DEFAULT_AI_THEME, type AiTheme } from "./schema";

// Hand-tuned example themes: shown in the studio before the first generation (no quota used)
// and available at /preview/ai-design?preset=<key>.
export const AI_THEME_PRESETS: Record<string, { label: string; theme: AiTheme }> = {
  "sekar-arum": { label: "Klasik hangat", theme: DEFAULT_AI_THEME },
  "malam-keemasan": {
    label: "Black & gold",
    theme: {
      name: "Malam Keemasan",
      mood: "Mewah dan dramatis, emas berkilau di atas hitam pekat.",
      palette: { background: "#111110", surface: "#1A1917", ink: "#F3EBDD", muted: "#B8AD9A", accent: "#C9A45C", accentSoft: "#26221B", onAccent: "#15130F" },
      typography: { display: "Cormorant Garamond", names: "Great Vibes", body: "Jost", displayItalic: true, labelStyle: "uppercase-tracked" },
      ornament: "flourish",
      texture: "grain",
      corners: "soft",
      frame: "dotted",
      metallic: true,
      layout: { cover: "photo-fullbleed", couple: "portrait-circle", events: "cards", gallery: "masonry" },
      copy: {
        coverEyebrow: "The Wedding of",
        openButton: "Buka Undangan",
        greeting: "Assalamu’alaikum Warahmatullahi Wabarakatuh",
        opening: "Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di hari bahagia kami.",
        closing: "Merupakan suatu kehormatan apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
      },
    },
  },
  "kawung-sogan": {
    label: "Adat Jawa",
    theme: {
      name: "Kawung Sogan",
      mood: "Tradisi Jawa yang anggun, cokelat sogan dan emas tua.",
      palette: { background: "#F3EBDF", surface: "#F8F2E9", ink: "#3A2717", muted: "#7A6450", accent: "#8C6239", accentSoft: "#E6D6C1", onAccent: "#FFF8EE" },
      typography: { display: "Marcellus", names: "Pinyon Script", body: "EB Garamond", displayItalic: false, labelStyle: "small-caps" },
      ornament: "batik-kawung",
      texture: "linen",
      corners: "arch",
      frame: "double",
      metallic: false,
      layout: { cover: "centered-frame", couple: "stacked-arch", events: "timeline", gallery: "grid" },
      copy: {
        coverEyebrow: "Pawiwahan",
        openButton: "Buka Undangan",
        greeting: "Assalamu’alaikum Warahmatullahi Wabarakatuh",
        opening: "Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami.",
        closing: "Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami haturkan matur nuwun.",
      },
    },
  },
  "taman-pastel": {
    label: "Garden modern",
    theme: {
      name: "Taman Pagi",
      mood: "Segar dan ringan seperti pesta kebun di pagi hari.",
      palette: { background: "#F6F5F0", surface: "#FFFFFF", ink: "#26302A", muted: "#5F6B63", accent: "#6F8F72", accentSoft: "#E3EBE1", onAccent: "#FFFFFF" },
      typography: { display: "Fraunces", names: "Fraunces", body: "Figtree", displayItalic: true, labelStyle: "uppercase-tracked" },
      ornament: "botanical",
      texture: "none",
      corners: "soft",
      frame: "hairline",
      metallic: false,
      layout: { cover: "split-photo", couple: "side-by-side", events: "ticket", gallery: "filmstrip" },
      copy: {
        coverEyebrow: "We’re getting married",
        openButton: "Lihat Undangan",
        greeting: "Halo, keluarga dan sahabat terkasih",
        opening: "Dengan penuh sukacita, kami mengundang Anda untuk merayakan hari pernikahan kami.",
        closing: "Kehadiran dan doa Anda akan melengkapi kebahagiaan kami. Sampai jumpa di hari istimewa!",
      },
    },
  },
};
