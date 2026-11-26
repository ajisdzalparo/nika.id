export type OpenRouterContentPart =
  // cache_control: Anthropic prompt caching through OpenRouter (cache reads cost 1/10 of input)
  | { type: "text"; text: string; cache_control?: { type: "ephemeral" } }
  | { type: "image_url"; image_url: { url: string } };

/**
 * System message for a long prompt that is identical on every call. Claude models cache it
 * (~5 min TTL), so back-to-back requests pay 1/10 for those tokens; other providers get plain text.
 */
export function cachedSystemMessage(model: string, text: string): OpenRouterMessage {
  if (!model.startsWith("anthropic/")) return { role: "system", content: text };
  return { role: "system", content: [{ type: "text", text, cache_control: { type: "ephemeral" } }] };
}

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | OpenRouterContentPart[];
}

export class OpenRouterError extends Error {
  constructor(
    public code: "NOT_CONFIGURED" | "RATE_LIMITED" | "UPSTREAM",
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

/** Newer and ~33% cheaper than claude-sonnet-4.5 on OpenRouter ($2 / $10 vs $3 / $15 per 1M tokens, Nov 2026) */
export const DEFAULT_OPENROUTER_DESIGN_MODEL = "anthropic/claude-sonnet-5.5";
export const DEFAULT_OPENROUTER_CHAT_MODEL = "anthropic/claude-haiku-4.5";
/**
 * Template similarity / originality checks: a short JSON comparison run often, so use a cheap model.
 * claude-haiku-5.5 is ~10x cheaper than haiku-4.5 on OpenRouter ($0.10 / $0.50 per 1M tokens, Nov 2026).
 */
export const DEFAULT_OPENROUTER_CHECK_MODEL = "anthropic/claude-haiku-5.5";

export function isOpenRouterConfigured(): boolean {
  const key = process.env.OPENROUTER_API_KEY?.trim() ?? "";
  if (!key) return false;
  if (/^(ISI_|YOUR_|CHANGE_ME|PLACEHOLDER)/i.test(key)) return false;
  return true;
}

export async function openRouterChat({
  model,
  messages,
  maxTokens = 1024,
  temperature = 0.7,
  jsonMode = false,
}: {
  model: string;
  messages: OpenRouterMessage[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new OpenRouterError("NOT_CONFIGURED", "OPENROUTER_API_KEY belum diisi");
  }

  const referer =
    (process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000").trim();

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": referer,
      "X-Title": "SatuMoment",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    if (res.status === 429) {
      throw new OpenRouterError("RATE_LIMITED", "AI sedang sibuk, coba lagi sebentar", 429);
    }
    throw new OpenRouterError(
      "UPSTREAM",
      `OpenRouter error ${res.status}${errText ? `: ${errText.slice(0, 240)}` : ""}`,
      res.status,
    );
  }

  const data = (await res.json()) as {
    choices?: Array<{
      finish_reason?: string;
      message?: { content?: string | Array<{ type?: string; text?: string }> | null };
    }>;
    error?: { message?: string };
  };

  if (data.error?.message) {
    throw new OpenRouterError("UPSTREAM", data.error.message);
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
  }
  return "";
}
