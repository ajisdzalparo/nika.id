import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { AI_CREDIT_COST_REFERENCE, AI_CREDIT_COST_STANDARD, type PlanType } from "@/lib/limits";
import { AiQuotaExceededError, getAiQuota, saveGeneratedAiDesign } from "@/lib/ai-design/server";
import { generateAiTheme, AiDesignError } from "@/lib/ai-design/generate";
import { normalizeTheme } from "@/lib/ai-design/color";
import { isAiDesignEnabled } from "@/lib/system-settings";

const MAX_PROMPT = 600;

async function loadContext(request: Request) {
  const session = await requireAuth(request);
  const invitation = await getActiveInvitation(session.user.id);
  return { userId: session.user.id, invitation };
}

// GET /api/ai/design — the user's designs, quota and active design for the active invitation
export async function GET(request: Request) {
  try {
    const { userId, invitation } = await loadContext(request);
    const [designs, quota, enabled] = await Promise.all([
      prisma.aiDesign.findMany({
        where: { userId, source: { in: ["AI", "CANVAS", "CATALOG"] } },
        orderBy: { createdAt: "desc" },
      }),
      getAiQuota(userId, invitation.plan as PlanType),
      isAiDesignEnabled(),
    ]);

    return NextResponse.json({
      designs: designs.map((d) => ({ id: d.id, prompt: d.prompt, createdAt: d.createdAt, theme: normalizeTheme(d.theme) })),
      quota,
      activeId: invitation.activeAiDesignId,
      enabled,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    console.error("AI design list error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

// POST /api/ai/design { prompt } — generate a new theme (1 credit, or 2 credits with reference screenshots)
export async function POST(request: Request) {
  try {
    const { userId, invitation } = await loadContext(request);
    if (!(await isAiDesignEnabled())) {
      return NextResponse.json(
        { error: "AI_DESIGN_DISABLED", message: "Fitur Desain AI sedang dinonaktifkan sementara oleh admin." },
        { status: 403 },
      );
    }
    const body = await request.json().catch(() => ({}));
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const baseThemeId = typeof body?.baseThemeId === "string" ? body.baseThemeId : "";
    const references: string[] = Array.isArray(body?.references) ? body.references.filter((u: unknown): u is string => typeof u === "string").slice(0, 3) : [];

    if (prompt.length < 8 && !references.length) return NextResponse.json({ error: "PROMPT_TOO_SHORT", message: "Ceritakan gaya yang diinginkan minimal beberapa kata." }, { status: 400 });
    if (prompt.length > MAX_PROMPT) return NextResponse.json({ error: "PROMPT_TOO_LONG", message: `Maksimal ${MAX_PROMPT} karakter.` }, { status: 400 });

    const cost = references.length > 0 ? AI_CREDIT_COST_REFERENCE : AI_CREDIT_COST_STANDARD;
    const plan = invitation.plan as PlanType;
    const quota = await getAiQuota(userId, plan);
    if (quota.remaining < cost) {
      return NextResponse.json(
        {
          error: "QUOTA_EXCEEDED",
          message:
            quota.remaining === 0
              ? "Kredit desain AI Anda habis. Top-up kredit atau tingkatkan paket untuk melanjutkan."
              : `Generate dengan screenshot referensi membutuhkan ${cost} kredit, tersisa ${quota.remaining} kredit.`,
          quota,
        },
        { status: 402 },
      );
    }

    const baseRow = baseThemeId ? await prisma.aiDesign.findFirst({ where: { id: baseThemeId, userId }, select: { theme: true } }) : null;
    const baseTheme = baseRow ? normalizeTheme(baseRow.theme) : null;

    const data = (invitation.data ?? {}) as { groom?: { nickname?: string }; bride?: { nickname?: string } };
    const theme = await generateAiTheme(
      prompt || "Buat tema undangan pernikahan berdasarkan screenshot referensi.",
      { groom: data.groom?.nickname, bride: data.bride?.nickname },
      references,
      baseTheme,
    );

    const { design, quota: nextQuota } = await saveGeneratedAiDesign({
      userId,
      plan,
      prompt: prompt || "(dari screenshot referensi)",
      theme,
      cost,
    });

    return NextResponse.json({
      design: { id: design.id, prompt: design.prompt, createdAt: design.createdAt, theme },
      quota: nextQuota,
    });
  } catch (error) {
    if (error instanceof AiQuotaExceededError) {
      return NextResponse.json({ error: "QUOTA_EXCEEDED", message: error.message, quota: error.quota }, { status: 402 });
    }
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    if (error instanceof AiDesignError) {
      const status = error.code === "NOT_CONFIGURED" ? 503 : error.code === "RATE_LIMITED" ? 429 : error.code === "REFUSED" ? 422 : error.code === "BAD_REFERENCE" ? 400 : 502;
      console.error("AI design error:", error.code, error.upstreamStatus ?? "", error.message);
      // Problems on our side of the AI provider (key, balance, model name) are not worth a user retry
      const serviceIssue =
        error.upstreamStatus === 401 || error.upstreamStatus === 403
          ? "AI_KEY_INVALID"
          : error.upstreamStatus === 402
            ? "AI_BALANCE_EMPTY"
            : error.upstreamStatus === 400 || error.upstreamStatus === 404
              ? "AI_MODEL_UNAVAILABLE"
              : null;
      const clientMessage =
        error.code === "NOT_CONFIGURED" || serviceIssue
          ? "Layanan Desain AI sedang tidak tersedia. Admin sudah bisa melihat penyebabnya; kredit kamu tidak terpakai."
          : error.code === "UPSTREAM" || error.code === "INVALID_OUTPUT"
            ? "AI sedang bermasalah, coba lagi."
            : error.message;
      return NextResponse.json(
        { error: error.code, message: clientMessage, ...(serviceIssue ? { reason: serviceIssue, upstreamStatus: error.upstreamStatus } : {}) },
        { status: serviceIssue ? 503 : status },
      );
    }
    console.error("AI design error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan, coba lagi." }, { status: 500 });
  }
}
