import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { getActiveInvitation } from "@/lib/active-invitation";
import { FEEDBACK_CATEGORIES, FEEDBACK_FEATURES, FEEDBACK_MESSAGE_MAX, FEEDBACK_MESSAGE_MIN, labelOf } from "@/lib/feedback-shared";
import { featureBlockedResponse } from "@/lib/feature-guard";

const categoryIds = FEEDBACK_CATEGORIES.map((c) => c.id) as [string, ...string[]];
const featureIds = FEEDBACK_FEATURES.map((f) => f.id) as [string, ...string[]];

const FeedbackSchema = z.object({
  category: z.enum(categoryIds),
  feature: z.enum(featureIds),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  message: z
    .string()
    .trim()
    .min(FEEDBACK_MESSAGE_MIN, `Ceritakan sedikit lebih detail (minimal ${FEEDBACK_MESSAGE_MIN} karakter).`)
    .max(FEEDBACK_MESSAGE_MAX),
  pagePath: z.string().trim().max(200).optional().nullable(),
});

const DAILY_LIMIT = 10;

// GET /api/user/feedback — the user's own feedback history (with admin replies)
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const items = await prisma.feedback.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

// POST /api/user/feedback — submit a new feedback entry
export async function POST(request: Request) {
  const blocked = await featureBlockedResponse("MASUKAN");
  if (blocked) return blocked;

  try {
    const session = await requireAuth(request);
    const parsed = FeedbackSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID", message: parsed.error.issues[0]?.message ?? "Data tidak valid." }, { status: 400 });
    }

    const since = new Date(Date.now() - 86_400_000);
    const recent = await prisma.feedback.count({ where: { userId: session.user.id, createdAt: { gte: since } } });
    if (recent >= DAILY_LIMIT) {
      return NextResponse.json({ error: "RATE_LIMIT", message: "Terima kasih! Batas masukan hari ini sudah tercapai, coba lagi besok." }, { status: 429 });
    }

    const active = await getActiveInvitation(session.user.id).catch(() => null);
    const { category, feature, rating, message, pagePath } = parsed.data;
    const item = await prisma.feedback.create({
      data: {
        userId: session.user.id,
        invitationId: active?.id && !active.id.startsWith("legacy_") ? active.id : null,
        category,
        feature,
        rating: rating ?? null,
        message,
        pagePath: pagePath || null,
      },
    });

    await createNotification({
      audience: "ADMIN",
      type: "SYSTEM",
      title: `Masukan baru: ${labelOf(FEEDBACK_CATEGORIES, category)}`,
      message: `${session.user.name || session.user.email} · ${labelOf(FEEDBACK_FEATURES, feature)}${rating ? ` · ${rating}/5` : ""} — ${message.slice(0, 120)}`,
      href: "/admin/masukan",
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
