import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import type { PlanType } from "@/lib/limits";
import { getAiQuota } from "@/lib/ai-design/server";
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
      prisma.aiDesign.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
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

// POST /api/ai/design { prompt } — generate a new theme (uses one quota)
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

    const quota = await getAiQuota(userId, invitation.plan as PlanType);
    if (quota.remaining <= 0) {
      return NextResponse.json({ error: "QUOTA_EXCEEDED", message: "Kuota desain AI paket Anda sudah habis.", quota }, { status: 402 });
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

    const design = await prisma.aiDesign.create({ data: { userId, prompt: prompt || "(dari screenshot referensi)", theme } });

    return NextResponse.json({
      design: { id: design.id, prompt: design.prompt, createdAt: design.createdAt, theme },
      quota: { ...quota, used: quota.used + 1, remaining: quota.remaining - 1 },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    if (error instanceof AiDesignError) {
      const status = error.code === "NOT_CONFIGURED" ? 503 : error.code === "RATE_LIMITED" ? 429 : error.code === "REFUSED" ? 422 : error.code === "BAD_REFERENCE" ? 400 : 502;
      console.error("AI design error:", error.code, error.message);
      const clientMessage =
        error.code === "NOT_CONFIGURED"
          ? "Layanan Desain AI belum tersedia saat ini. Silakan hubungi admin."
          : error.code === "UPSTREAM" || error.code === "INVALID_OUTPUT"
            ? "AI sedang bermasalah, coba lagi."
            : error.message;
      return NextResponse.json({ error: error.code, message: clientMessage }, { status });
    }
    console.error("AI design error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan, coba lagi." }, { status: 500 });
  }
}
