export interface PresetOrnament {
  key: string;
  label: string;
  category:
    | "Bingkai Foto"
    | "Garis"
    | "Bentuk & Geometri"
    | "Poligon & Bintang"
    | "Sudut & Bingkai"
    | "Bunga & Daun"
    | "Adat & Klasik"
    | "Minimalis & Segel";
  viewBox: string;
  /** True for geometric shapes that can stretch freely without keeping 1:1 aspect ratio. */
  stretchable?: boolean;
  /** Photo frame mask shape for Canva-style image placeholder / wedding photo binding. */
  photoMask?: "rect" | "rounded" | "circle" | "arch";
  /** SVG inner markup using `currentColor` so it inherits theme accent or custom layer color. */
  paths: string;
}

export const PRESET_ORNAMENTS: readonly PresetOrnament[] = [
  {
    key: "floral-corner",
    label: "Sulur Bunga",
    category: "Bunga & Daun",
    viewBox: "0 0 120 120",
    paths:
      '<path d="M12 108C18 68 44 34 108 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M24 72C40 68 54 74 62 84" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M38 46C44 26 56 18 70 18" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M22 86c-6-10 4-20 12-10-2 10-8 14-12 10Z" fill="currentColor" opacity="0.85"/><path d="M44 56c-10-6-4-20 8-14 4 10-2 16-8 14Z" fill="currentColor" opacity="0.85"/><path d="M74 30c-8-10 4-20 12-10 2 10-6 14-12 10Z" fill="currentColor" opacity="0.85"/><circle cx="62" cy="84" r="5" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="62" cy="84" r="2" fill="currentColor"/>',
  },
  {
    key: "botanical-sprig",
    label: "Ranting Daun",
    category: "Bunga & Daun",
    viewBox: "0 0 120 120",
    paths:
      '<path d="M22 104C42 74 68 44 102 16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M36 86c-12-4-14-18-2-18 8 4 8 14 2 18Z" fill="currentColor" opacity="0.85"/><path d="M52 68c-14-2-14-18-2-18 8 4 8 14 2 18Z" fill="currentColor" opacity="0.85"/><path d="M70 50c-14-2-12-18 0-16 8 4 6 14 0 16Z" fill="currentColor" opacity="0.85"/><path d="M50 76c10 10 22 4 18-6-6-6-16-2-18 6Z" fill="currentColor" opacity="0.75"/><path d="M70 56c10 10 22 4 18-6-6-6-16-2-18 6Z" fill="currentColor" opacity="0.75"/>',
  },
  {
    key: "jasmine-spray",
    label: "Melati Jawa",
    category: "Bunga & Daun",
    viewBox: "0 0 120 120",
    paths:
      '<g transform="translate(60 56)" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="0" cy="-22" rx="7" ry="14"/><ellipse cx="0" cy="-22" rx="7" ry="14" transform="rotate(72)"/><ellipse cx="0" cy="-22" rx="7" ry="14" transform="rotate(144)"/><ellipse cx="0" cy="-22" rx="7" ry="14" transform="rotate(216)"/><ellipse cx="0" cy="-22" rx="7" ry="14" transform="rotate(288)"/><circle cx="0" cy="0" r="6" fill="currentColor"/></g><path d="M20 100C38 88 50 76 60 66" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M60 66C76 80 90 90 104 94" stroke="currentColor" stroke-width="1.8" fill="none"/>',
  },
  {
    key: "laurel-wreath",
    label: "Karangan Laurel",
    category: "Bunga & Daun",
    viewBox: "0 0 120 120",
    paths:
      '<path d="M56 102C28 96 14 68 22 40C26 26 38 18 48 16" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M64 102C92 96 106 68 98 40C94 26 82 18 72 16" stroke="currentColor" stroke-width="1.8" fill="none"/><circle cx="60" cy="102" r="4" fill="currentColor"/><path d="M22 66c-8-6-6-16 4-14 4 6 2 12-4 14ZM26 46c-8-6-4-16 6-12 4 6 0 12-6 12ZM98 66c8-6 6-16-4-14-4 6-2 12 4 14ZM94 46c8-6 4-16-6-12-4 6 0 12 6 12Z" fill="currentColor" opacity="0.85"/>',
  },
  {
    key: "kawung-medallion",
    label: "Medalion Kawung",
    category: "Adat & Klasik",
    viewBox: "0 0 120 120",
    paths:
      '<g transform="translate(60 60)" stroke="currentColor" stroke-width="1.8" fill="none"><circle cx="0" cy="0" r="44" opacity="0.35"/><ellipse cx="0" cy="-22" rx="11" ry="20"/><ellipse cx="0" cy="22" rx="11" ry="20"/><ellipse cx="-22" cy="0" rx="20" ry="11"/><ellipse cx="22" cy="0" rx="20" ry="11"/><circle cx="0" cy="0" r="6" fill="currentColor"/></g>',
  },
  {
    key: "gunungan-minimal",
    label: "Siluet Gunungan",
    category: "Adat & Klasik",
    viewBox: "0 0 120 120",
    paths:
      '<path d="M60 12C44 36 22 62 24 96H96C98 62 76 36 60 12Z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M60 26C50 44 36 64 36 90H84C84 64 70 44 60 26Z" stroke="currentColor" stroke-width="1.4" fill="none" opacity="0.7"/><path d="M60 40V90M44 74H76" stroke="currentColor" stroke-width="1.6"/><circle cx="60" cy="56" r="5" fill="currentColor"/>',
  },
  {
    key: "arabesque-star",
    label: "Bintang Arabesque",
    category: "Adat & Klasik",
    viewBox: "0 0 120 120",
    paths:
      '<g transform="translate(60 60)" stroke="currentColor" stroke-width="1.8" fill="none"><rect x="-28" y="-28" width="56" height="56"/><rect x="-28" y="-28" width="56" height="56" transform="rotate(45)"/><circle cx="0" cy="0" r="14"/><circle cx="0" cy="0" r="4" fill="currentColor"/></g>',
  },
  {
    key: "artdeco-fan",
    label: "Kipas Art Deco",
    category: "Adat & Klasik",
    viewBox: "0 0 120 120",
    paths:
      '<path d="M16 96C16 56 36 28 60 28C84 28 104 56 104 96Z" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M60 96V28M60 96L36 38M60 96L84 38M60 96L22 62M60 96L98 62" stroke="currentColor" stroke-width="1.4"/><path d="M12 96H108" stroke="currentColor" stroke-width="2"/>',
  },
  {
    key: "arch-frame",
    label: "Bingkai Lengkung",
    category: "Sudut & Bingkai",
    viewBox: "0 0 120 120",
    paths:
      '<path d="M20 108V54C20 30 38 14 60 14C82 14 100 30 100 54V108" stroke="currentColor" stroke-width="2" fill="none"/><path d="M28 108V56C28 36 42 22 60 22C78 22 92 36 92 56V108" stroke="currentColor" stroke-width="1.2" fill="none" opacity="0.65"/>',
  },
  {
    key: "corner-bracket",
    label: "Sudut Klasik",
    category: "Sudut & Bingkai",
    viewBox: "0 0 120 120",
    paths:
      '<path d="M14 96V14H96" stroke="currentColor" stroke-width="2.2" fill="none"/><path d="M24 84V24H84" stroke="currentColor" stroke-width="1.3" fill="none" opacity="0.7"/><rect x="10" y="10" width="8" height="8" fill="currentColor"/>',
  },
  {
    key: "oval-wreath",
    label: "Bingkai Oval",
    category: "Sudut & Bingkai",
    viewBox: "0 0 120 120",
    paths:
      '<ellipse cx="60" cy="60" rx="40" ry="48" stroke="currentColor" stroke-width="2" fill="none"/><ellipse cx="60" cy="60" rx="34" ry="42" stroke="currentColor" stroke-width="1.2" fill="none" stroke-dasharray="4 4"/>',
  },
  {
    key: "filigree-crest",
    label: "Mahkota Filigree",
    category: "Sudut & Bingkai",
    viewBox: "0 0 120 120",
    paths:
      '<path d="M60 22C48 38 30 42 18 54C30 62 46 60 60 72C74 60 90 62 102 54C90 42 72 38 60 22Z" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M30 82C44 74 76 74 90 82" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="60" cy="48" r="4" fill="currentColor"/>',
  },
  {
    key: "wax-seal",
    label: "Segel Lilin",
    category: "Minimalis & Segel",
    viewBox: "0 0 120 120",
    paths:
      '<path d="M60 14C76 12 94 22 100 38C108 54 104 76 90 90C76 104 54 108 38 100C22 94 12 76 14 60C12 44 22 24 38 18C46 14 52 14 60 14Z" fill="currentColor" opacity="0.22" stroke="currentColor" stroke-width="2"/><circle cx="60" cy="60" r="28" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M60 44L66 56L78 60L66 64L60 76L54 64L42 60L54 56Z" fill="currentColor"/>',
  },
  {
    key: "monogram-ring",
    label: "Cincin Monogram",
    category: "Minimalis & Segel",
    viewBox: "0 0 120 120",
    paths:
      '<circle cx="52" cy="60" r="28" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="68" cy="60" r="28" stroke="currentColor" stroke-width="2" fill="none" opacity="0.75"/>',
  },
  {
    key: "double-heart",
    label: "Garis Hati",
    category: "Minimalis & Segel",
    viewBox: "0 0 120 120",
    paths:
      '<path d="M60 94C60 94 20 68 20 42C20 28 31 20 43 20C51 20 57 25 60 31C63 25 69 20 77 20C89 20 100 28 100 42C100 68 60 94 60 94Z" stroke="currentColor" stroke-width="2" fill="none"/>',
  },
  {
    key: "spark-constellation",
    label: "Bintang Kilau",
    category: "Minimalis & Segel",
    viewBox: "0 0 120 120",
    paths:
      '<path d="M60 18L65 52L98 60L65 68L60 102L55 68L22 60L55 52Z" fill="currentColor"/><path d="M26 26L28 34L36 36L28 38L26 46L24 38L16 36L24 34Z" fill="currentColor" opacity="0.7"/><path d="M92 24L94 30L100 32L94 34L92 40L90 34L84 32L90 30Z" fill="currentColor" opacity="0.7"/>',
  },
  {
    key: "shape-rect-solid",
    label: "Kartu Persegi",
    category: "Bentuk & Geometri",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<rect x="6" y="6" width="108" height="108" rx="12" fill="currentColor"/>',
  },
  {
    key: "shape-rect-outline",
    label: "Garis Kotak",
    category: "Bentuk & Geometri",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<rect x="8" y="8" width="104" height="104" rx="10" stroke="currentColor" stroke-width="3" fill="none"/>',
  },
  {
    key: "shape-pill-solid",
    label: "Kapsul / Pita",
    category: "Bentuk & Geometri",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<rect x="6" y="26" width="108" height="68" rx="34" fill="currentColor"/>',
  },
  {
    key: "shape-circle-solid",
    label: "Lingkaran Solid",
    category: "Bentuk & Geometri",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<circle cx="60" cy="60" r="52" fill="currentColor"/>',
  },
  {
    key: "shape-circle-outline",
    label: "Ring Lingkaran",
    category: "Bentuk & Geometri",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<circle cx="60" cy="60" r="50" stroke="currentColor" stroke-width="2.5" fill="none"/><circle cx="60" cy="60" r="42" stroke="currentColor" stroke-width="1" stroke-dasharray="4 4" fill="none" opacity="0.65"/>',
  },
  {
    key: "shape-arch-solid",
    label: "Kubah Latar",
    category: "Bentuk & Geometri",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<path d="M14 112V54C14 26 34 8 60 8C86 8 106 26 106 54V112H14Z" fill="currentColor"/>',
  },
  {
    key: "shape-diamond",
    label: "Belah Ketupat",
    category: "Bentuk & Geometri",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<polygon points="60,8 112,60 60,112 8,60" stroke="currentColor" stroke-width="2.4" fill="none"/>',
  },
  {
    key: "shape-line-thick",
    label: "Garis Pemisah",
    category: "Garis",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<rect x="6" y="56" width="108" height="8" rx="4" fill="currentColor"/>',
  },
  {
    key: "frame-photo-rounded",
    label: "Bingkai Foto Tumpul",
    category: "Bingkai Foto",
    viewBox: "0 0 120 96",
    stretchable: true,
    photoMask: "rounded",
    paths:
      '<defs><linearGradient id="sky-rnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D7EEFF"/><stop offset="1" stop-color="#EFF8FF"/></linearGradient></defs><rect x="4" y="4" width="112" height="88" rx="12" fill="url(#sky-rnd)" stroke="#D4DCE3" stroke-width="2"/><circle cx="78" cy="28" r="10" fill="#FFFFFF" opacity="0.9"/><path d="M4 66 Q32 48 64 62 T116 58 V80 A12 12 0 0 1 104 92 H16 A12 12 0 0 1 4 80 Z" fill="#B6CE78"/><path d="M4 74 Q45 58 84 72 T116 68 V80 A12 12 0 0 1 104 92 H16 A12 12 0 0 1 4 80 Z" fill="#819C3B"/>',
  },
  {
    key: "frame-photo-arch",
    label: "Bingkai Foto Kubah",
    category: "Bingkai Foto",
    viewBox: "0 0 120 120",
    stretchable: true,
    photoMask: "arch",
    paths:
      '<defs><linearGradient id="sky-arch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D7EEFF"/><stop offset="1" stop-color="#EFF8FF"/></linearGradient></defs><path d="M12 114 V58 C12 26 33 6 60 6 C87 6 108 26 108 58 V114 Z" fill="url(#sky-arch)" stroke="#D4DCE3" stroke-width="2"/><circle cx="76" cy="40" r="10" fill="#FFFFFF" opacity="0.9"/><path d="M12 82 Q40 66 72 78 T108 74 V114 H12 Z" fill="#B6CE78"/><path d="M12 92 Q50 76 86 90 T108 86 V114 H12 Z" fill="#819C3B"/>',
  },
  {
    key: "frame-photo-circle",
    label: "Bingkai Foto Lingkaran",
    category: "Bingkai Foto",
    viewBox: "0 0 120 120",
    photoMask: "circle",
    paths:
      '<defs><clipPath id="cp-circ"><circle cx="60" cy="60" r="52"/></clipPath><linearGradient id="sky-circ" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D7EEFF"/><stop offset="1" stop-color="#EFF8FF"/></linearGradient></defs><g clip-path="url(#cp-circ)"><rect width="120" height="120" fill="url(#sky-circ)"/><circle cx="76" cy="42" r="10" fill="#FFFFFF" opacity="0.9"/><path d="M0 78 Q35 60 70 74 T120 70 V120 H0 Z" fill="#B6CE78"/><path d="M0 88 Q45 72 88 86 T120 82 V120 H0 Z" fill="#819C3B"/></g><circle cx="60" cy="60" r="52" fill="none" stroke="#D4DCE3" stroke-width="2"/>',
  },
  {
    key: "frame-photo-rect",
    label: "Bingkai Foto Persegi",
    category: "Bingkai Foto",
    viewBox: "0 0 120 96",
    stretchable: true,
    photoMask: "rect",
    paths:
      '<defs><linearGradient id="sky-rect" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D7EEFF"/><stop offset="1" stop-color="#EFF8FF"/></linearGradient></defs><rect x="4" y="4" width="112" height="88" rx="4" fill="url(#sky-rect)" stroke="#D4DCE3" stroke-width="2"/><circle cx="76" cy="28" r="10" fill="#FFFFFF" opacity="0.9"/><path d="M4 64 Q36 48 68 62 T116 58 V92 H4 Z" fill="#B6CE78"/><path d="M4 74 Q48 58 84 72 T116 68 V92 H4 Z" fill="#819C3B"/>',
  },
  {
    key: "line-solid-dots",
    label: "Garis Ujung Bulat",
    category: "Garis",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<line x1="16" y1="60" x2="104" y2="60" stroke="currentColor" stroke-width="3"/><circle cx="12" cy="60" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="108" cy="60" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/>',
  },
  {
    key: "line-dotted",
    label: "Garis Titik-Titik",
    category: "Garis",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<line x1="10" y1="60" x2="110" y2="60" stroke="currentColor" stroke-width="4" stroke-dasharray="1 10" stroke-linecap="round"/>',
  },
  {
    key: "line-dashed",
    label: "Garis Putus-Putus",
    category: "Garis",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<line x1="10" y1="60" x2="110" y2="60" stroke="currentColor" stroke-width="3.5" stroke-dasharray="14 8" stroke-linecap="round"/>',
  },
  {
    key: "line-diamond-ends",
    label: "Garis Berlian",
    category: "Garis",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<line x1="18" y1="60" x2="102" y2="60" stroke="currentColor" stroke-width="2.6"/><polygon points="12,60 18,54 24,60 18,66" fill="currentColor"/><polygon points="96,60 102,54 108,60 102,66" fill="currentColor"/>',
  },
  {
    key: "line-arrow-right",
    label: "Garis Panah",
    category: "Garis",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<line x1="10" y1="60" x2="98" y2="60" stroke="currentColor" stroke-width="3"/><polyline points="88,48 104,60 88,72" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  {
    key: "shape-triangle",
    label: "Segitiga",
    category: "Bentuk & Geometri",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<polygon points="60,12 110,104 10,104" fill="currentColor"/>',
  },
  {
    key: "poly-pentagon",
    label: "Segi Lima",
    category: "Poligon & Bintang",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<polygon points="60,10 110,46 91,106 29,106 10,46" fill="currentColor"/>',
  },
  {
    key: "poly-hexagon",
    label: "Segi Enam",
    category: "Poligon & Bintang",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<polygon points="60,10 104,35 104,85 60,110 16,85 16,35" fill="currentColor"/>',
  },
  {
    key: "poly-octagon",
    label: "Segi Delapan",
    category: "Poligon & Bintang",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<polygon points="40,10 80,10 110,40 110,80 80,110 40,110 10,80 10,40" fill="currentColor"/>',
  },
  {
    key: "star-5",
    label: "Bintang 5 Sudut",
    category: "Poligon & Bintang",
    viewBox: "0 0 120 120",
    paths: '<polygon points="60,10 73,44 110,44 80,66 91,102 60,80 29,102 40,66 10,44 47,44" fill="currentColor"/>',
  },
  {
    key: "star-8",
    label: "Segel Bintang 8",
    category: "Poligon & Bintang",
    viewBox: "0 0 120 120",
    paths: '<polygon points="60,6 72,30 98,22 90,48 114,60 90,72 98,98 72,90 60,114 48,90 22,98 30,72 6,60 30,48 22,22 48,30" fill="currentColor"/>',
  },
  {
    key: "shape-arrow-block",
    label: "Panah Blok",
    category: "Poligon & Bintang",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<polygon points="10,42 70,42 70,22 112,60 70,98 70,78 10,78" fill="currentColor"/>',
  },
  {
    key: "shape-cloud-soft",
    label: "Awan Lembut",
    category: "Poligon & Bintang",
    viewBox: "0 0 120 120",
    stretchable: true,
    paths: '<path d="M32 92H90C103 92 112 83 112 71C112 60 104 52 94 50C92 34 79 22 62 22C47 22 34 32 31 46C18 48 10 58 10 70C10 82 20 92 32 92Z" fill="currentColor"/>',
  },
] as const;

export function getPresetOrnament(key: string): PresetOrnament | undefined {
  return PRESET_ORNAMENTS.find((o) => o.key === key);
}

/** Strictly strips scripts, foreign objects, and unsafe attributes from an AI-generated SVG string. */
export function sanitizeGeneratedSvg(raw: string): string | null {
  const match = raw.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) return null;
  let svg = match[0]
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/<(iframe|object|embed|image|link|meta)[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|xlink:href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");

  if (!/viewBox=/i.test(svg)) {
    svg = svg.replace(/<svg/i, '<svg viewBox="0 0 200 200"');
  }
  if (!/xmlns=/i.test(svg)) {
    svg = svg.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (svg.length > 15000) return null;
  return svg;
}

export function svgToDataUri(svg: string, color?: string): string {
  const colored = color ? svg.replace(/currentColor/g, color) : svg;
  return `data:image/svg+xml;utf8,${encodeURIComponent(colored)}`;
}
