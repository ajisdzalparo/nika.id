import { ART_KIT_DEFS, resolveArtKit, type ArtKitKey } from "./art-kits";
import type { AiTheme } from "./schema";

/**
 * Originality & plagiarism detector for SatuMoment templates.
 *
 * Focuses on visual identity (effective artKit, cover silhouette, background/surface palette,
 * frame/ornament craft, and custom canvas artwork) rather than typography alone — so swapping fonts
 * or slightly nudging the accent hue on an existing template still registers as plagiarism.
 */

export type OriginalityVerdict = "AMAN" | "MIRIP" | "PLAGIAT";

/** At or above this similarity (0–1) a design is flagged as plagiarism (blocked from marketplace). */
export const PLAGIARISM_THRESHOLD = 0.78;
/** At or above this similarity (0–1) a design is flagged as suspiciously similar (manual review warning). */
export const SIMILAR_THRESHOLD = 0.68;
/** Backwards-compatible alias for PLAGIARISM_THRESHOLD. */
export const COPY_THRESHOLD = PLAGIARISM_THRESHOLD;

/** Illustrated kits whose multi-colour artwork dominates the entire cover regardless of accent hue. */
const ILLUSTRATED_KITS = new Set<ArtKitKey>(["taman-kayon", "kebun-sage", "mawar-vintage", "kamboja-tropis"]);

const COVER_LABELS: Record<AiTheme["layout"]["cover"], string> = {
  "photo-fullbleed": "Foto Penuh Layar",
  "centered-frame": "Bingkai Tengah",
  "arch-window": "Jendela Lengkung",
  "split-photo": "Foto Terbelah",
  typographic: "Tipografi",
};

const ORNAMENT_LABELS: Record<AiTheme["ornament"], string> = {
  none: "Tanpa Ornamen",
  "minimal-rule": "Garis Minimalis",
  "floral-line": "Garis Bunga",
  botanical: "Botani",
  "art-deco": "Art Deco",
  "batik-kawung": "Batik Kawung",
  arabesque: "Arabesque",
  "wave-line": "Garis Ombak",
  flourish: "Flourish",
};

export interface SimilarityCandidate {
  id?: string;
  slug?: string;
  name: string;
  category?: string;
  tier?: string;
  theme: AiTheme;
}

export interface ThemeComparison {
  similarity: number;
  scorePct: number;
  verdict: OriginalityVerdict;
  sameFactors: string[];
  diffFactors: string[];
  isFontOrAccentOnlyClone: boolean;
}

export interface SimilarityMatch extends ThemeComparison {
  id?: string;
  slug: string;
  name: string;
  category?: string;
  tier?: string;
  theme: AiTheme;
}

export interface PlagiarismReport {
  verdict: OriginalityVerdict;
  score: number;
  source: "AI" | "STRUCTURAL";
  model?: string;
  summary: string;
  reasons: string[];
  recommendation: string;
  topMatch: SimilarityMatch | null;
  matches: SimilarityMatch[];
}

function rgb(hex: string): [number, number, number] | null {
  const h = (hex || "").replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const c = rgb(hex);
  if (!c) return 0.5;
  return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
}

function isDarkColor(hex: string): boolean {
  return luminance(hex) < 0.45;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  h = (h * 60 + 360) % 360;
  return [h, s, l];
}

/** Graded perceptual colour similarity in [0, 1] combining RGB distance + HSL hue divergence. */
function colorSimilarity(a: string, b: string): number {
  const x = rgb(a);
  const y = rgb(b);
  if (!x || !y) return a.toLowerCase() === b.toLowerCase() ? 1 : 0;
  const rMean = (x[0] + y[0]) / 2;
  const dr = x[0] - y[0];
  const dg = x[1] - y[1];
  const db = x[2] - y[2];
  // Redmean weighted distance (0..~765)
  const dist = Math.sqrt((2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db);
  let baseSim = dist <= 18 ? 1 : dist >= 200 ? 0 : Math.max(0, 1 - (dist - 18) / 182);

  // Penalise distinct hue families even for low-contrast darks (navy vs emerald) or pastels (cream vs blue)
  const [h1, s1] = rgbToHsl(x[0], x[1], x[2]);
  const [h2, s2] = rgbToHsl(y[0], y[1], y[2]);
  const minSat = Math.min(s1, s2);
  const maxSat = Math.max(s1, s2);
  if (minSat >= 0.16) {
    const hueDiff = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
    if (hueDiff > 32) {
      const huePenalty = Math.min(0.65, ((hueDiff - 32) / 120) * Math.min(1, minSat * 2.2));
      baseSim = Math.max(0, baseSim - huePenalty);
    }
  } else if (maxSat - minSat >= 0.28) {
    // Pure white/neutral vs clearly tinted pastel/sage/blush
    baseSim = Math.max(0, baseSim - 0.25);
  }
  return baseSim;
}

/** All built-in art-kit asset URLs so auto-composed or re-copied kit layers aren't mistaken for original art. */
const KIT_ASSET_SRCS = new Set<string>(
  Object.values(ART_KIT_DEFS).flatMap((kit) => [
    ...Object.values(kit.assets).map((a) => a.src),
    ...(kit.backdrop ? [kit.backdrop] : []),
  ]),
);

function isKitLayer(value: string, id: string): boolean {
  if (id.startsWith("kit-")) return true;
  if (KIT_ASSET_SRCS.has(value)) return true;
  if (value.startsWith("/templates/art/")) return true;
  return false;
}

/** Custom visual (non-text, non-kit) layer sources placed by the designer on the canvas. */
export function customVisualLayerSources(t: AiTheme): Set<string> {
  const out = new Set<string>();
  for (const l of t.layers ?? []) {
    if (l.kind === "text") continue;
    if (isKitLayer(l.value, l.id)) continue;
    out.add(l.value.slice(0, 160));
  }
  for (const style of Object.values(t.sectionStyles ?? {})) {
    const bg = style?.backgroundImage?.trim();
    if (bg && !KIT_ASSET_SRCS.has(bg) && !bg.startsWith("/templates/art/")) {
      out.add(`bg:${bg.slice(0, 140)}`);
    }
  }
  return out;
}

export function artKitDisplayLabel(key: ArtKitKey): string {
  if (key === "none") return "Tanpa Paket Ilustrasi";
  return ART_KIT_DEFS[key]?.label ?? key;
}

export function verdictFromScore(similarity: number): OriginalityVerdict {
  if (similarity >= PLAGIARISM_THRESHOLD) return "PLAGIAT";
  if (similarity >= SIMILAR_THRESHOLD) return "MIRIP";
  return "AMAN";
}

/** Detailed visual & structural comparison between two themes. */
export function compareThemes(candidate: AiTheme, reference: AiTheme): ThemeComparison {
  const kitA = resolveArtKit(candidate);
  const kitB = resolveArtKit(reference);
  const sameKit = kitA === kitB;
  const bothIllustratedSameKit = sameKit && ILLUSTRATED_KITS.has(kitA);

  const bgSim = colorSimilarity(candidate.palette.background, reference.palette.background);
  const surfSim = colorSimilarity(candidate.palette.surface, reference.palette.surface);
  const inkSim = colorSimilarity(candidate.palette.ink, reference.palette.ink);
  const accentSim = colorSimilarity(candidate.palette.accent, reference.palette.accent);
  const accentSoftSim = colorSimilarity(candidate.palette.accentSoft, reference.palette.accentSoft);
  const samePolarity = isDarkColor(candidate.palette.background) === isDarkColor(reference.palette.background);

  const sameCover = candidate.layout.cover === reference.layout.cover;
  const sameCouple = candidate.layout.couple === reference.layout.couple;
  const sameEvents = candidate.layout.events === reference.layout.events;
  const sameGallery = candidate.layout.gallery === reference.layout.gallery;

  const sameOrnament = candidate.ornament === reference.ornament;
  const sameFrame = candidate.frame === reference.frame;
  const sameCorners = candidate.corners === reference.corners;
  const sameTexture = candidate.texture === reference.texture;
  const sameMetallic = candidate.metallic === reference.metallic;

  const sameDisplayFont = candidate.typography.display === reference.typography.display;
  const sameNamesFont = candidate.typography.names === reference.typography.names;
  const sameBodyFont = candidate.typography.body === reference.typography.body;

  const customA = customVisualLayerSources(candidate);
  const customB = customVisualLayerSources(reference);
  const sharedCustom = [...customA].filter((src) => customB.has(src)).length;
  const maxCustom = Math.max(customA.size, customB.size);
  const customOverlap = maxCustom > 0 ? sharedCustom / maxCustom : 0;
  const candidateUniqueCustom = [...customA].filter((src) => !customB.has(src)).length;

  let score = 0;
  let total = 0;
  const add = (val: number, weight: number) => {
    total += weight;
    score += Math.max(0, Math.min(1, val)) * weight;
  };

  // Visual silhouette & illustration craft carry the dominant weight
  add(sameKit ? 1 : 0, kitA === "none" && kitB === "none" ? 2.2 : 6.0);
  add(sameCover ? 1 : 0, 4.0);
  add(bgSim, 3.6);
  add(surfSim, 1.4);
  add(samePolarity ? 1 : 0, 1.0);
  add(accentSim, 1.8);
  add(accentSoftSim, 0.7);
  add(inkSim, 0.6);

  // Ornamental & structural craft
  add(sameOrnament ? 1 : 0, 1.5);
  add(sameFrame ? 1 : 0, 1.0);
  add(sameCorners ? 1 : 0, 0.9);
  add(sameTexture ? 1 : 0, 0.5);
  add(sameMetallic ? 1 : 0, 0.5);

  // Inner section layouts
  add(sameCouple ? 1 : 0, 0.9);
  add(sameEvents ? 1 : 0, 0.5);
  add(sameGallery ? 1 : 0, 0.5);

  // Typography intentionally has low weight so swapping fonts alone CANNOT pass as original
  add(sameDisplayFont ? 1 : 0, 0.55);
  add(sameNamesFont ? 1 : 0, 0.55);
  add(sameBodyFont ? 1 : 0, 0.4);
  add(candidate.typography.labelStyle === reference.typography.labelStyle ? 1 : 0, 0.2);
  add(candidate.typography.displayItalic === reference.typography.displayItalic ? 1 : 0, 0.2);

  // Custom non-kit visual artwork
  if (maxCustom > 0) {
    add(customOverlap, 3.5);
  }

  let similarity = total > 0 ? score / total : 0;

  // Reward genuine original custom artwork placed by the creator (uploaded/AI ornaments & backdrops)
  if (candidateUniqueCustom >= 2 && customOverlap < 0.3) {
    const originalityBonus = Math.min(0.24, 0.08 + candidateUniqueCustom * 0.04);
    similarity = Math.max(0, similarity - originalityBonus);
  }

  // Hard anti-plagiarism guardrails, only for "plek ketiplek" copies with low customisation.
  // A different ornament, frame, corners, texture or section layout is real design work and is
  // allowed; those designs are judged by the weighted score above, not forced up here.
  let isFontOrAccentOnlyClone = false;
  const customisations = [
    !sameOrnament,
    !sameFrame,
    !sameCorners,
    !sameTexture,
    !sameCouple || !sameEvents || !sameGallery,
    accentSim < 0.75,
    !sameDisplayFont && !sameNamesFont,
  ].filter(Boolean).length;
  const lowCustom = candidateUniqueCustom < 2 && customisations <= 2;

  // 1) Same non-empty artKit + same cover + same background tone, only fonts / accent tweaked
  //    = classic "cuma ganti font / geser warna aksen" clone (e.g. Sekar Arum vs old Floral Blossom).
  if (lowCustom && sameKit && kitA !== "none" && sameCover && bgSim >= 0.84) {
    isFontOrAccentOnlyClone = true;
    similarity = Math.max(similarity, 0.86);
  }

  // 2) Same multi-colour illustrated kit (its artwork fills the cover in fixed colours) on the same
  //    cover layout with near-same background and accent (e.g. old Terakota Boho vs Senja Tropis).
  if (lowCustom && bothIllustratedSameKit && sameCover && bgSim >= 0.82 && accentSim >= 0.72) {
    isFontOrAccentOnlyClone = true;
    similarity = Math.max(similarity, 0.9);
  }

  // 3) Same clean "none" kit + same cover + near-identical palette + same frame/ornament
  if (
    lowCustom &&
    kitA === "none" &&
    kitB === "none" &&
    sameCover &&
    bgSim >= 0.88 &&
    accentSim >= 0.78 &&
    (sameOrnament || sameFrame)
  ) {
    isFontOrAccentOnlyClone = true;
    similarity = Math.max(similarity, 0.82);
  }

  // A clearly customised design (3+ real changes) is never auto-blocked as plagiarism; at most it is
  // "MIRIP" so an admin looks at it side by side.
  if (!lowCustom && customisations >= 3) {
    similarity = Math.min(similarity, PLAGIARISM_THRESHOLD - 0.01);
  }

  // 4) Reusing the exact same uploaded/custom visual layers from another creator's template
  if (customA.size >= 2 && customB.size >= 2 && customOverlap >= 0.7 && sameCover) {
    similarity = Math.max(similarity, 0.88);
  }

  similarity = Math.max(0, Math.min(1, similarity));
  const scorePct = Math.round(similarity * 100);
  const verdict = verdictFromScore(similarity);

  // Build concise Indonesian explanation lists
  const sameFactors: string[] = [];
  const diffFactors: string[] = [];

  if (sameKit) {
    sameFactors.push(`Paket ilustrasi sama (${artKitDisplayLabel(kitA)})`);
  } else {
    diffFactors.push(`Paket ilustrasi berbeda (${artKitDisplayLabel(kitA)} vs ${artKitDisplayLabel(kitB)})`);
  }

  if (sameCover) {
    sameFactors.push(`Layout sampul sama (${COVER_LABELS[candidate.layout.cover]})`);
  } else {
    diffFactors.push(`Layout sampul berbeda (${COVER_LABELS[candidate.layout.cover]} vs ${COVER_LABELS[reference.layout.cover]})`);
  }

  if (bgSim >= 0.84) {
    sameFactors.push(`Warna latar hampir identik (${candidate.palette.background} vs ${reference.palette.background})`);
  } else if (!samePolarity) {
    diffFactors.push("Kontras terang/gelap latar berbeda");
  } else {
    diffFactors.push(`Warna latar berbeda (${candidate.palette.background} vs ${reference.palette.background})`);
  }

  if (accentSim >= 0.78) {
    sameFactors.push(`Warna aksen sangat mirip (${candidate.palette.accent} vs ${reference.palette.accent})`);
  } else {
    diffFactors.push(`Warna aksen berbeda (${candidate.palette.accent} vs ${reference.palette.accent})`);
  }

  if (sameOrnament && candidate.ornament !== "none") {
    sameFactors.push(`Ornamen sama (${ORNAMENT_LABELS[candidate.ornament]})`);
  }
  if (sameFrame && sameCorners) {
    sameFactors.push(`Gaya bingkai & sudut sama (${candidate.frame}/${candidate.corners})`);
  }

  if (customA.size > 0 && customB.size > 0 && customOverlap >= 0.5) {
    sameFactors.push(`Memakai aset layer kustom yang sama (${Math.round(customOverlap * 100)}%)`);
  } else if (candidateUniqueCustom >= 2) {
    diffFactors.push(`Memiliki ${candidateUniqueCustom} elemen visual kustom sendiri`);
  }

  if (!sameDisplayFont || !sameNamesFont || !sameBodyFont) {
    const changed: string[] = [];
    if (!sameNamesFont) changed.push(`font nama (${candidate.typography.names} vs ${reference.typography.names})`);
    if (!sameDisplayFont) changed.push(`font judul (${candidate.typography.display} vs ${reference.typography.display})`);
    if (!sameBodyFont) changed.push(`font isi (${candidate.typography.body} vs ${reference.typography.body})`);
    diffFactors.push(
      isFontOrAccentOnlyClone
        ? `Hanya mengganti ${changed.join(", ")} (tidak cukup untuk orisinalitas)`
        : `Tipografi berbeda: ${changed.join(", ")}`,
    );
  } else {
    sameFactors.push(`Kombinasi font sama (${candidate.typography.display} + ${candidate.typography.names})`);
  }

  if (isFontOrAccentOnlyClone) {
    sameFactors.unshift("Struktur visual, ilustrasi, dan nuansa latar hampir identik (indikasi plagiasi beda font/aksen tipis)");
  }

  return {
    similarity,
    scorePct,
    verdict,
    sameFactors,
    diffFactors,
    isFontOrAccentOnlyClone,
  };
}

/** Share (0–1) of visual design decisions two themes have in common. */
export function themeSimilarity(a: AiTheme, b: AiTheme): number {
  return compareThemes(a, b).similarity;
}

/** Returns top-N closest templates sorted from most similar to least similar. */
export function analyzeTemplateSimilarity(
  candidate: AiTheme,
  existing: SimilarityCandidate[],
  opts?: { limit?: number },
): SimilarityMatch[] {
  const limit = opts?.limit ?? 3;
  const matches: SimilarityMatch[] = existing.map((e) => {
    const cmp = compareThemes(candidate, e.theme);
    return {
      id: e.id,
      slug: e.slug ?? e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: e.name,
      category: e.category,
      tier: e.tier,
      theme: e.theme,
      ...cmp,
    };
  });
  matches.sort((a, b) => b.similarity - a.similarity);
  return matches.slice(0, limit);
}

/** Build a fallback deterministic PlagiarismReport when AI is skipped or unavailable. */
export function buildStructuralPlagiarismReport(matches: SimilarityMatch[]): PlagiarismReport {
  const top = matches[0] ?? null;
  if (!top) {
    return {
      verdict: "AMAN",
      score: 0,
      source: "STRUCTURAL",
      summary: "Belum ada template pembanding di katalog. Desain dinyatakan aman.",
      reasons: [],
      recommendation: "Desain siap diajukan untuk review admin.",
      topMatch: null,
      matches: [],
    };
  }

  const reasons = top.sameFactors.slice(0, 5);
  if (top.verdict === "PLAGIAT") {
    return {
      verdict: "PLAGIAT",
      score: top.scorePct,
      source: "STRUCTURAL",
      summary: `Desain terindikasi plagiasi karena ${top.scorePct}% mirip secara visual dengan template "${top.name}".`,
      reasons,
      recommendation:
        "Ubah paket ilustrasi atau tambahkan elemen visual orisinal di Kanvas, ganti layout sampul, dan buat palet warna latar yang benar-benar berbeda — tidak cukup hanya mengganti font.",
      topMatch: top,
      matches,
    };
  }

  if (top.verdict === "MIRIP") {
    return {
      verdict: "MIRIP",
      score: top.scorePct,
      source: "STRUCTURAL",
      summary: `Desain memiliki kemiripan cukup tinggi (${top.scorePct}%) dengan template "${top.name}" dan perlu tinjauan manual admin.`,
      reasons,
      recommendation:
        "Sebaiknya ubah tata letak sampul, warna latar, atau tambahkan ilustrasi kustom agar tampil lebih orisinal dan tidak ditolak saat kurasi manual.",
      topMatch: top,
      matches,
    };
  }

  return {
    verdict: "AMAN",
    score: top.scorePct,
    source: "STRUCTURAL",
    summary: `Desain dinilai orisinal. Kemiripan tertinggi hanya ${top.scorePct}% terhadap template "${top.name}".`,
    reasons: top.diffFactors.slice(0, 3),
    recommendation: "Desain sudah cukup unik dan siap diajukan ke Marketplace untuk kurasi admin.",
    topMatch: top,
    matches,
  };
}

/** Backwards-compatible helper: returns the closest existing design if it breaches the plagiarism threshold. */
export function findCopiedDesign(candidate: AiTheme, existing: SimilarityCandidate[]): SimilarityMatch | null {
  const [top] = analyzeTemplateSimilarity(candidate, existing, { limit: 1 });
  return top && top.similarity >= PLAGIARISM_THRESHOLD ? top : null;
}
