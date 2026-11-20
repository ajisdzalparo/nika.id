export type OpenRouterContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

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

export const DEFAULT_OPENROUTER_DESIGN_MODEL = "anthropic/claude-sonnet-4.5";
export const DEFAULT_OPENROUTER_CHAT_MODEL = "anthropic/claude-haiku-4.5";

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
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
      "X-Title": "UNDANGIN YUK",
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
