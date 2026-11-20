import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { generateAiTheme, AiDesignError } from "@/lib/ai-design/generate";
import { errorResponse } from "../shared";

// POST /api/admin/catalog/generate { prompt } — draft a catalog theme with AI (no user quota involved)
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim().slice(0, 600) : "";
    const references: string[] = Array.isArray(body?.references) ? body.references.filter((u: unknown): u is string => typeof u === "string").slice(0, 3) : [];
    if (prompt.length < 8 && !references.length) {
      return NextResponse.json({ error: "PROMPT_TOO_SHORT", message: "Tulis konsep atau lampirkan screenshot referensi." }, { status: 400 });
    }
    const theme = await generateAiTheme(prompt || "Buat tema undangan pernikahan berdasarkan screenshot referensi.", undefined, references);
    return NextResponse.json({ theme });
  } catch (error) {
    if (error instanceof AiDesignError) {
      return NextResponse.json({ error: error.code, message: error.code === "UPSTREAM" ? "AI sedang bermasalah, coba lagi." : error.message }, { status: error.code === "NOT_CONFIGURED" ? 503 : error.code === "BAD_REFERENCE" ? 400 : 502 });
    }
    return errorResponse(error);
  }
}
