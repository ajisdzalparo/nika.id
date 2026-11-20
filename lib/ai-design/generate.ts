import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AiThemeSchema, type AiTheme } from "./schema";
import { AI_DESIGN_SYSTEM_PROMPT, buildUserPrompt, REFERENCE_INSTRUCTIONS } from "./prompt";
import { normalizeTheme } from "./color";

export class AiDesignError extends Error {
  constructor(
    public code: "NOT_CONFIGURED" | "REFUSED" | "INVALID_OUTPUT" | "RATE_LIMITED" | "UPSTREAM" | "BAD_REFERENCE",
    message: string,
  ) {
    super(message);
  }
}

let client: Anthropic | null = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new AiDesignError("NOT_CONFIGURED", "ANTHROPIC_API_KEY belum diisi");
  client ??= new Anthropic();
  return client;
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

async function loadReference(url: string): Promise<Anthropic.ImageBlockParam> {
  if (!isOwnStorageUrl(url)) throw new AiDesignError("BAD_REFERENCE", "Gambar referensi harus diunggah lewat aplikasi");
  const res = await fetch(url);
  if (!res.ok) throw new AiDesignError("BAD_REFERENCE", "Gambar referensi tidak bisa dibaca");
  const type = (res.headers.get("content-type") || "").split(";")[0] as ImageType;
  if (!IMAGE_TYPES.includes(type)) throw new AiDesignError("BAD_REFERENCE", "Format gambar referensi tidak didukung");
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new AiDesignError("BAD_REFERENCE", "Gambar referensi terlalu besar (maks 5MB)");
  return { type: "image", source: { type: "base64", media_type: type, data: bytes.toString("base64") } };
}

export async function generateAiTheme(
  prompt: string,
  couple?: { groom?: string; bride?: string },
  referenceUrls: string[] = [],
  baseTheme?: AiTheme | null,
): Promise<AiTheme> {
  const anthropic = getClient();
  const images = await Promise.all(referenceUrls.slice(0, MAX_REFERENCES).map(loadReference));
  const text = buildUserPrompt(prompt, couple, baseTheme) + (images.length ? `\n\n${REFERENCE_INSTRUCTIONS}` : "");

  let response;
  try {
    response = await anthropic.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(AiThemeSchema),
      },
      system: AI_DESIGN_SYSTEM_PROMPT,
      // Images first, then the request text
      messages: [{ role: "user", content: [...images, { type: "text", text }] }],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) throw new AiDesignError("RATE_LIMITED", "AI sedang sibuk, coba lagi sebentar");
    if (error instanceof Anthropic.APIError) throw new AiDesignError("UPSTREAM", `AI error ${error.status}: ${error.message}`);
    throw error;
  }

  if (response.stop_reason === "refusal") throw new AiDesignError("REFUSED", "Permintaan desain tidak bisa diproses");
  if (!response.parsed_output) throw new AiDesignError("INVALID_OUTPUT", "Hasil AI tidak valid");

  return normalizeTheme(response.parsed_output);
}
