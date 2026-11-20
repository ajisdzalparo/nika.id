import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import type { PlanType } from "@/lib/limits";
import { getAiQuota } from "@/lib/ai-design/server";
import { generateAiTheme, AiDesignError } from "@/lib/ai-design/generate";
import { normalizeTheme } from "@/lib/ai-design/color";

const MAX_PROMPT = 600;

async function loadUser(request: Request) {
  const session = await requireAuth(request);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, plan: true, activeAiDesignId: true, invitation: { select: { data: true } } },
  });
  if (!user) throw new Error("Unauthorized");
  return user;
}

// GET /api/ai/design — the user's designs, quota and active design
export async function GET(request: Request) {
  try {
    const user = await loadUser(request);
    const [designs, quota] = await Promise.all([
      prisma.aiDesign.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
      getAiQuota(user.id, user.plan as PlanType),
    ]);

    return NextResponse.json({
      designs: designs.map((d) => ({ id: d.id, prompt: d.prompt, createdAt: d.createdAt, theme: normalizeTheme(d.theme) })),
      quota,
      activeId: user.activeAiDesignId,
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
    const user = await loadUser(request);
    const body = await request.json().catch(() => ({}));
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const references: string[] = Array.isArray(body?.references) ? body.references.filter((u: unknown): u is string => typeof u === "string").slice(0, 3) : [];

    if (prompt.length < 8 && !references.length) return NextResponse.json({ error: "PROMPT_TOO_SHORT", message: "Ceritakan gaya yang diinginkan minimal beberapa kata." }, { status: 400 });
    if (prompt.length > MAX_PROMPT) return NextResponse.json({ error: "PROMPT_TOO_LONG", message: `Maksimal ${MAX_PROMPT} karakter.` }, { status: 400 });

    const quota = await getAiQuota(user.id, user.plan as PlanType);
    if (quota.remaining <= 0) {
      return NextResponse.json({ error: "QUOTA_EXCEEDED", message: "Kuota desain AI paket Anda sudah habis.", quota }, { status: 402 });
    }

    const data = (user.invitation?.data ?? {}) as { groom?: { nickname?: string }; bride?: { nickname?: string } };
    const theme = await generateAiTheme(prompt || "Buat tema undangan pernikahan berdasarkan screenshot referensi.", { groom: data.groom?.nickname, bride: data.bride?.nickname }, references);

    const design = await prisma.aiDesign.create({ data: { userId: user.id, prompt: prompt || "(dari screenshot referensi)", theme } });

    return NextResponse.json({
      design: { id: design.id, prompt: design.prompt, createdAt: design.createdAt, theme },
      quota: { ...quota, used: quota.used + 1, remaining: quota.remaining - 1 },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    if (error instanceof AiDesignError) {
      const status = error.code === "NOT_CONFIGURED" ? 503 : error.code === "RATE_LIMITED" ? 429 : error.code === "REFUSED" ? 422 : error.code === "BAD_REFERENCE" ? 400 : 502;
      console.error("AI design error:", error.code, error.message);
      return NextResponse.json({ error: error.code, message: error.code === "UPSTREAM" ? "AI sedang bermasalah, coba lagi." : error.message }, { status });
    }
    console.error("AI design error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan, coba lagi." }, { status: 500 });
  }
}
