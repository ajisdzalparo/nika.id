import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isSurveyDue } from "@/lib/survey";
import { SURVEY_SOURCES } from "@/lib/survey-shared";

const score = z.number().int().min(1).max(5);

const SurveySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("later") }),
  z.object({
    action: z.literal("submit"),
    recommend: z.number().int().min(0).max(10),
    source: z.enum(SURVEY_SOURCES),
    designScore: score,
    easeScore: score,
    priceScore: score,
    wish: z.string().trim().max(500).optional(),
  }),
]);

// GET /api/user/survey — whether the survey should be offered now
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    return NextResponse.json({ due: await isSurveyDue(session.user.id) });
  } catch (error) {
    return apiErrorResponse(error, "Gagal memeriksa survei");
  }
}

// POST /api/user/survey — answer it, or snooze it with "Nanti saja"
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const parsed = SurveySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: "Mohon lengkapi semua pertanyaan." }, { status: 400 });
    }
    const body = parsed.data;
    if (body.action === "later") {
      await prisma.surveyResponse.create({ data: { userId: session.user.id, status: "DITUNDA" } });
      return NextResponse.json({ ok: true });
    }
    await prisma.surveyResponse.create({
      data: {
        userId: session.user.id,
        status: "TERKIRIM",
        recommend: body.recommend,
        source: body.source,
        designScore: body.designScore,
        easeScore: body.easeScore,
        priceScore: body.priceScore,
        wish: body.wish || null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, "Gagal menyimpan survei");
  }
}
