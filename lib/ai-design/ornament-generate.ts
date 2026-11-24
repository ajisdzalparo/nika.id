import { DEFAULT_OPENROUTER_DESIGN_MODEL, OpenRouterError, openRouterChat } from "@/lib/openrouter";
import { AiDesignError } from "./generate";
import { sanitizeGeneratedSvg, svgToDataUri } from "./ornament-library";

const ORNAMENT_SYSTEM_PROMPT = `You are a bespoke wedding stationery illustrator.
Generate ONLY a single clean, tasteful, vector SVG ornament on a transparent background.
Rules:
- Root element MUST be <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">...</svg>
- Use ONLY clean geometric vector primitives (<path>, <circle>, <ellipse>, <rect>, <polygon>, <line>, <g>).
- Use stroke="currentColor" and/or fill="currentColor" so the ornament automatically adapts to the user's chosen foil/accent color.
- Do NOT include <text>, <image>, <script>, <style>, background rectangles, or markdown fences.
- Keep line weights graceful (stroke-width 1.5 to 3) and centered within the 200x200 viewBox with balanced whitespace.`;

export async function generateAiOrnament(prompt: string): Promise<{ svg: string; dataUri: string }> {
  const model = process.env.OPENROUTER_DESIGN_MODEL?.trim() || DEFAULT_OPENROUTER_DESIGN_MODEL;
  let raw = "";
  try {
    raw = await openRouterChat({
      model,
      maxTokens: 2048,
      temperature: 0.7,
      messages: [
        { role: "system", content: ORNAMENT_SYSTEM_PROMPT },
        { role: "user", content: `Create a refined wedding invitation ornament SVG for: ${prompt}` },
      ],
    });
  } catch (error) {
    if (error instanceof OpenRouterError) {
      throw new AiDesignError(error.code, error.message);
    }
    throw new AiDesignError("UPSTREAM", error instanceof Error ? error.message : "AI gagal membuat ornamen");
  }

  const svg = sanitizeGeneratedSvg(raw);
  if (!svg) {
    throw new AiDesignError("INVALID_OUTPUT", "Hasil ornamen AI tidak berupa SVG valid, coba lagi.");
  }

  return { svg, dataUri: svgToDataUri(svg) };
}
