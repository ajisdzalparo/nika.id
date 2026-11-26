import { z } from "zod";
import { Prisma } from "@prisma/client";
import { DEFAULT_OPENROUTER_CHECK_MODEL, isOpenRouterConfigured, openRouterChat } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";
import { normalizeTheme } from "./color";
import { resolveArtKit } from "./art-kits";
import {
  analyzeTemplateSimilarity,
  artKitDisplayLabel,
  buildStructuralPlagiarismReport,
  customVisualLayerSources,
  PLAGIARISM_THRESHOLD,
  SIMILAR_THRESHOLD,
  verdictFromScore,
  type PlagiarismReport,
  type SimilarityCandidate,
} from "./originality";
import { AI_THEME_PRESETS } from "./presets";
import { PRESET_ART_KITS } from "./presets-catalog";
import type { AiTheme } from "./schema";

const AiJudgeSchema = z.object({
  verdict: z.enum(["AMAN", "MIRIP", "PLAGIAT"]),
  score: z.number().min(0).max(100),
  matchedSlug: z.string().nullable().optional(),
  summary: z.string().min(4).max(400),
  reasons: z.array(z.string().min(2).max(200)).max(6).default([]),
  recommendation: z.string().min(4).max(360),
});

function withKnownPresetKit(slug: string, theme: AiTheme): AiTheme {
  const kit = PRESET_ART_KITS[slug];
  return kit !== undefined && !theme.artKit ? { ...theme, artKit: kit } : theme;
}

function summarizeDesignForAi(name: string, slug: string, theme: AiTheme) {
  const kit = resolveArtKit(theme);
  const customLayers = customVisualLayerSources(theme);
  return {
    name,
    slug,
    artKit: kit,
    artKitLabel: artKitDisplayLabel(kit),
    coverLayout: theme.layout.cover,
    coupleLayout: theme.layout.couple,
    eventsLayout: theme.layout.events,
    galleryLayout: theme.layout.gallery,
    palette: {
      background: theme.palette.background,
      surface: theme.palette.surface,
      ink: theme.palette.ink,
      accent: theme.palette.accent,
    },
    typography: {
      display: theme.typography.display,
      names: theme.typography.names,
      body: theme.typography.body,
    },
    ornament: theme.ornament,
    frame: theme.frame,
    corners: theme.corners,
    texture: theme.texture,
    metallic: theme.metallic,
    customVisualLayerCount: customLayers.size,
  };
}

const PLAGIARISM_AI_SYSTEM_PROMPT = `Kamu adalah Kurator Orisinalitas & Anti-Plagiasi untuk marketplace template undangan digital SatuMoment.
Tugasmu menilai apakah desain kandidat ORISINAL ("AMAN"), CUKUP MIRIP ("MIRIP"), atau PLAGIASI ("PLAGIAT") dibandingkan template yang sudah ada di katalog.

ATURAN PENILAIAN:
1. PLAGIAT (score >= 82) hanya untuk salinan "plek ketiplek" dengan kustomisasi rendah: paket ilustrasi (artKit), layout sampul (coverLayout), dan warna latar sama atau sangat mirip, dan perubahannya cuma ganti font, ganti teks/copy, atau geser sedikit warna aksen.
2. MIRIP (score 68–81) bila sebagian besar unsur visual utama sama dan perbedaannya tipis (1–2 hal kecil).
3. AMAN (score < 68): beda ornamen, bingkai, sudut, tekstur, tata letak bagian, atau tampilan keseluruhan itu DIPERBOLEHKAN, walaupun memakai paket ilustrasi yang sama. Memakai artKit yang sama saja BUKAN plagiasi selama desainnya jelas dikustomisasi.
4. Jawab HANYA dalam JSON valid sesuai skema berikut (Bahasa Indonesia yang lugas, jelas, dan langsung menunjuk nama template pembanding):
{
  "verdict": "AMAN" | "MIRIP" | "PLAGIAT",
  "score": 0-100,
  "matchedSlug": "slug template paling mirip atau null",
  "summary": "1-2 kalimat ringkas menjelaskan status plagiasi dan menyebut template mana yang mirip",
  "reasons": ["poin bukti konkret persamaan/perbedaan visual 1", "poin 2", "poin 3"],
  "recommendation": "saran konkret apa yang wajib diubah kreator agar orisinal (atau konfirmasi siap tayang jika AMAN)"
}`;

/**
 * Loads all active/pending/approved ENGINE templates from DB (plus built-in presets not in DB)
 * so originality checks compare against EVERY existing template — including the creator's own templates.
 */
export async function loadComparisonCatalog(opts?: { excludeId?: string; includeBuiltInPresets?: boolean }): Promise<SimilarityCandidate[]> {
  const rows = await prisma.catalogTemplate.findMany({
    where: {
      kind: "ENGINE",
      theme: { not: Prisma.DbNull },
      reviewStatus: { not: "REJECTED" },
      ...(opts?.excludeId ? { id: { not: opts.excludeId } } : {}),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      tier: true,
      theme: true,
    },
  });

  const seenSlugs = new Set<string>();
  const candidates: SimilarityCandidate[] = [];

  for (const r of rows) {
    seenSlugs.add(r.slug);
    candidates.push({
      id: r.id,
      slug: r.slug,
      name: r.name,
      category: r.category,
      tier: r.tier,
      theme: withKnownPresetKit(r.slug, normalizeTheme(r.theme)),
    });
  }

  if (opts?.includeBuiltInPresets !== false) {
    for (const [slug, preset] of Object.entries(AI_THEME_PRESETS)) {
      if (seenSlugs.has(slug)) continue;
      candidates.push({
        slug,
        name: preset.theme.name,
        category: preset.label,
        tier: "Bawaan",
        theme: withKnownPresetKit(slug, normalizeTheme(preset.theme)),
      });
    }
  }

  return candidates;
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1].trim() : trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return JSON.parse(body.slice(start, end + 1));
}

/**
 * Hybrid plagiarism check:
 * 1) Fast deterministic visual-first structural analysis selects top-3 closest templates & computes baseline score.
 * 2) When OpenRouter is configured, asks the AI curator to verify & explain similarity/plagiarism in Indonesian.
 * 3) Hard safety floor: AI can escalate a subtle clone, but can never downgrade a blatant structural clone.
 */
export async function checkTemplatePlagiarism(
  candidate: { name?: string; slug?: string; theme: AiTheme },
  existing: SimilarityCandidate[],
  opts?: { useAi?: boolean },
): Promise<PlagiarismReport> {
  const normalized = normalizeTheme(candidate.theme);
  const matches = analyzeTemplateSimilarity(normalized, existing, { limit: 3 });
  const structural = buildStructuralPlagiarismReport(matches);

  if (!matches.length || opts?.useAi === false || !isOpenRouterConfigured()) {
    return structural;
  }

  // Its own cheap model, independent of the support-chat model
  const model = (process.env.OPENROUTER_CHECK_MODEL || DEFAULT_OPENROUTER_CHECK_MODEL).trim();
  const payload = {
    candidate: summarizeDesignForAi(candidate.name || normalized.name || "Kandidat Baru", candidate.slug || "kandidat", normalized),
    topCatalogMatches: matches.map((m) => ({
      ...summarizeDesignForAi(m.name, m.slug, m.theme),
      structuralScorePct: m.scorePct,
      structuralVerdict: m.verdict,
      isFontOrAccentOnlyClone: m.isFontOrAccentOnlyClone,
      sameFactors: m.sameFactors,
      diffFactors: m.diffFactors,
    })),
  };

  try {
    const raw = await openRouterChat({
      model,
      messages: [
        { role: "system", content: PLAGIARISM_AI_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Bandingkan desain kandidat berikut dengan 3 template terdekat di katalog SatuMoment:\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
      maxTokens: 700,
      temperature: 0.15,
      jsonMode: true,
    });

    const parsedJson = extractJsonObject(raw);
    const parsed = AiJudgeSchema.safeParse(parsedJson);
    if (!parsed.success) {
      return structural;
    }

    const ai = parsed.data;
    const structuralTop = matches[0];
    // Never downgrade a blatant structural clone; allow AI to escalate subtle clones
    const finalScore = structuralTop.isFontOrAccentOnlyClone || structuralTop.similarity >= PLAGIARISM_THRESHOLD
      ? Math.max(structural.score, Math.round(ai.score))
      : structuralTop.similarity >= SIMILAR_THRESHOLD
        ? Math.max(Math.round((structural.score + ai.score) / 2), Math.min(structural.score, Math.round(ai.score)))
        : Math.max(structural.score, Math.round(ai.score));

    const clampedScore = Math.max(0, Math.min(100, finalScore));
    const finalVerdict = verdictFromScore(clampedScore / 100);

    // Reorder matches if AI picked a specific slug among top-3
    const aiMatched = ai.matchedSlug ? matches.find((m) => m.slug === ai.matchedSlug) : null;
    const orderedMatches = aiMatched ? [aiMatched, ...matches.filter((m) => m.slug !== aiMatched.slug)] : matches;

    return {
      verdict: finalVerdict,
      score: clampedScore,
      source: "AI",
      model,
      summary: ai.summary,
      reasons: ai.reasons.length ? ai.reasons : structural.reasons,
      recommendation: ai.recommendation,
      topMatch: orderedMatches[0] ?? null,
      matches: orderedMatches,
    };
  } catch (err) {
    console.warn("[plagiarism-ai] fallback to structural check:", err instanceof Error ? err.message : err);
    return structural;
  }
}
