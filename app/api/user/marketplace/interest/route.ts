import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { INTEREST_ROLES, PRICE_BANDS } from "@/lib/marketplace-interest";

const InterestSchema = z.object({
  role: z.enum(INTEREST_ROLES),
  priceBand: z.enum(PRICE_BANDS).nullish(),
  note: z.string().trim().max(500).nullish(),
});

// GET /api/user/marketplace/interest — the user's saved answer (null if not answered yet)
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const row = await prisma.marketplaceInterest.findUnique({
      where: { userId: session.user.id },
      select: { role: true, priceBand: true, note: true },
    });
    return NextResponse.json({ interest: row });
  } catch (error) {
    return apiErrorResponse(error, "Gagal memuat survei");
  }
}

// POST /api/user/marketplace/interest — save or update the answer (one per user)
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const parsed = InterestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: "Pilih salah satu jawaban dulu." }, { status: 400 });
    }
    const { role, priceBand, note } = parsed.data;
    const data = { role, priceBand: role === "TIDAK" ? null : (priceBand ?? null), note: note || null };
    const row = await prisma.marketplaceInterest.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...data },
      update: data,
      select: { role: true, priceBand: true, note: true },
    });
    return NextResponse.json({ interest: row });
  } catch (error) {
    return apiErrorResponse(error, "Gagal menyimpan survei");
  }
}
