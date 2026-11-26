import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import type { PlanType } from "@/lib/limits";
import { AiQuotaExceededError, consumeAiOrnamentCredit, getAiQuota } from "@/lib/ai-design/server";
import { generateAiOrnament } from "@/lib/ai-design/ornament-generate";
import { AiDesignError } from "@/lib/ai-design/generate";
import { featureBlockedResponse } from "@/lib/feature-guard";

// POST /api/ai/ornament { prompt } — generates a vector SVG ornament (uses 1 AI credit)
export async function POST(request: Request) {
  const blocked = await featureBlockedResponse("KANVAS");
  if (blocked) return blocked;

  try {
    const session = await requireAuth(request);
    const active = await getActiveInvitation(session.user.id);
    const body = await request.json().catch(() => ({}));
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (prompt.length < 4) {
      return NextResponse.json({ error: "PROMPT_TOO_SHORT", message: "Tulis deskripsi ornamen minimal 4 karakter." }, { status: 400 });
    }
    if (prompt.length > 200) {
      return NextResponse.json({ error: "PROMPT_TOO_LONG", message: "Deskripsi ornamen maksimal 200 karakter." }, { status: 400 });
    }

    const plan = active.plan as PlanType;
    const quota = await getAiQuota(session.user.id, plan);
    if (quota.remaining < 1) {
      return NextResponse.json(
        { error: "QUOTA_EXCEEDED", message: "Kredit AI Anda habis. Top-up kredit AI untuk membuat ornamen dengan AI.", quota },
        { status: 402 },
      );
    }

    const { svg, dataUri } = await generateAiOrnament(prompt);
    const { quota: nextQuota } = await consumeAiOrnamentCredit({
      userId: session.user.id,
      plan,
      prompt: `Ornamen: ${prompt}`,
      svg,
    });

    return NextResponse.json({ svg, dataUri, quota: nextQuota });
  } catch (error) {
    if (error instanceof AiQuotaExceededError) {
      return NextResponse.json({ error: "QUOTA_EXCEEDED", message: error.message, quota: error.quota }, { status: 402 });
    }
    if (error instanceof AiDesignError) {
      const status = error.code === "NOT_CONFIGURED" ? 503 : error.code === "RATE_LIMITED" ? 429 : 502;
      return NextResponse.json(
        {
          error: error.code,
          message:
            error.code === "NOT_CONFIGURED"
              ? "Layanan AI belum dikonfigurasi di server. Gunakan Pustaka Ornamen atau unggah gambar sendiri."
              : error.message,
        },
        { status },
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    console.error("AI ornament error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal membuat ornamen AI." }, { status: 500 });
  }
}
