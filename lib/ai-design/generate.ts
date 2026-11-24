import { z } from "zod";
import { AiThemeSchema, type AiTheme } from "./schema";
import { AI_DESIGN_SYSTEM_PROMPT, buildUserPrompt, REFERENCE_INSTRUCTIONS } from "./prompt";
import { normalizeTheme } from "./color";
import { pickArtKit } from "./art-kits";
import {
  DEFAULT_OPENROUTER_DESIGN_MODEL,
  OpenRouterError,
  openRouterChat,
  type OpenRouterContentPart,
} from "@/lib/openrouter";

export class AiDesignError extends Error {
  constructor(
    public code: "NOT_CONFIGURED" | "REFUSED" | "INVALID_OUTPUT" | "RATE_LIMITED" | "UPSTREAM" | "BAD_REFERENCE",
    message: string,
    /** HTTP status OpenRouter answered with, when the failure came from there */
    public upstreamStatus?: number,
  ) {
    super(message);
  }
}

const MAX_REFERENCES = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

/** Only files from our own storage may be used as references (no arbitrary URLs → no SSRF). */
function isOwnStorageUrl(url: string) {
  const base = (process.env.MINIO_PUBLIC_URL || "").replace(/\/+$/, "");
  const bucket = process.env.MINIO_BUCKET || "uploads";
  return Boolean(base) && url.startsWith(`${base}/${bucket}/`);
}

async function loadReference(url: string): Promise<OpenRouterContentPart> {
  if (!isOwnStorageUrl(url)) throw new AiDesignError("BAD_REFERENCE", "Gambar referensi harus diunggah lewat aplikasi");
  const res = await fetch(url);
  if (!res.ok) throw new AiDesignError("BAD_REFERENCE", "Gambar referensi tidak bisa dibaca");
  const type = (res.headers.get("content-type") || "").split(";")[0] as ImageType;
  if (!IMAGE_TYPES.includes(type)) throw new AiDesignError("BAD_REFERENCE", "Format gambar referensi tidak didukung");
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new AiDesignError("BAD_REFERENCE", "Gambar referensi terlalu besar (maks 5MB)");
  return {
    type: "image_url",
    image_url: { url: `data:${type};base64,${bytes.toString("base64")}` },
  };
}

function extractJsonObject(raw: string): unknown {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("NO_JSON");
  }
}

const THEME_JSON_SCHEMA = JSON.stringify(z.toJSONSchema(AiThemeSchema));

export async function generateAiTheme(
  prompt: string,
  couple?: { groom?: string; bride?: string },
  referenceUrls: string[] = [],
  baseTheme?: AiTheme | null,
): Promise<AiTheme> {
  const images = await Promise.all(referenceUrls.slice(0, MAX_REFERENCES).map(loadReference));
  const text = buildUserPrompt(prompt, couple, baseTheme) + (images.length ? `\n\n${REFERENCE_INSTRUCTIONS}` : "");

  const model = process.env.OPENROUTER_DESIGN_MODEL?.trim() || DEFAULT_OPENROUTER_DESIGN_MODEL;
  const systemPrompt = `${AI_DESIGN_SYSTEM_PROMPT}\n\nReturn ONLY valid JSON matching this JSON Schema (no markdown, no explanation):\n${THEME_JSON_SCHEMA}`;

  let rawOutput = "";
  try {
    rawOutput = await openRouterChat({
      model,
      maxTokens: 4096,
      temperature: 0.7,
      jsonMode: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: [...images, { type: "text", text }] },
      ],
    });
  } catch (error) {
    if (error instanceof OpenRouterError) {
      throw new AiDesignError(error.code, error.message, error.status);
    }
    throw new AiDesignError("UPSTREAM", error instanceof Error ? error.message : "AI gagal merespons");
  }

  let jsonVal: unknown;
  try {
    jsonVal = extractJsonObject(rawOutput);
  } catch {
    throw new AiDesignError("INVALID_OUTPUT", "Hasil AI tidak berupa JSON valid");
  }

  const parsed = AiThemeSchema.safeParse(jsonVal);
  if (!parsed.success) {
    throw new AiDesignError("INVALID_OUTPUT", "Hasil AI tidak sesuai skema tema");
  }

  const theme = normalizeTheme(parsed.data);
  // Every generated design ships fully composed: if the model skipped the illustration set, pick one
  // from its own palette, ornament and mood.
  return { ...theme, artKit: theme.artKit ?? pickArtKit(theme) };
}
