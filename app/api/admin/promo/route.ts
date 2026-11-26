import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { sanitizePromoCode } from "@/lib/promo-shared";

const KINDS = ["PLAN", "GUEST_ADDON", "AI_CREDIT", "AGENCY_QUOTA", "RENEWAL"] as const;

const PromoInputSchema = z
  .object({
    code: z.string().transform(sanitizePromoCode).pipe(z.string().min(3, "Kode minimal 3 huruf/angka.")),
    description: z.string().trim().max(120).optional().nullable(),
    percentOff: z.number().int().min(1).max(100).nullable().optional(),
    amountOff: z.number().int().min(1000).nullable().optional(),
    maxDiscount: z.number().int().min(1000).nullable().optional(),
    appliesTo: z.array(z.enum(KINDS)).optional(),
    minPurchase: z.number().int().min(0).optional(),
    maxUses: z.number().int().min(1).nullable().optional(),
    perUserLimit: z.number().int().min(1).max(100).optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Boolean(v.percentOff) !== Boolean(v.amountOff), { message: "Isi salah satu: persen atau potongan rupiah." });

function toPromoData(v: z.infer<typeof PromoInputSchema>) {
  return {
    code: v.code,
    description: v.description || null,
    percentOff: v.percentOff ?? null,
    amountOff: v.amountOff ?? null,
    maxDiscount: v.percentOff ? (v.maxDiscount ?? null) : null,
    appliesTo: v.appliesTo && v.appliesTo.length > 0 && v.appliesTo.length < KINDS.length ? v.appliesTo.join(",") : "ALL",
    minPurchase: v.minPurchase ?? 0,
    maxUses: v.maxUses ?? null,
    perUserLimit: v.perUserLimit ?? 1,
    expiresAt: v.expiresAt ? new Date(v.expiresAt) : null,
    isActive: v.isActive ?? true,
  };
}

// GET /api/admin/promo — all promo codes
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const items = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

// POST /api/admin/promo — create a promo code
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const parsed = PromoInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID", message: parsed.error.issues[0]?.message ?? "Data tidak valid." }, { status: 400 });
    }
    const data = toPromoData(parsed.data);
    const clash = await prisma.user.findUnique({ where: { referralCode: data.code }, select: { id: true } });
    if (clash) {
      return NextResponse.json({ error: "CODE_TAKEN", message: "Kode ini sudah dipakai sebagai kode referral pengguna." }, { status: 409 });
    }
    const exists = await prisma.promoCode.findUnique({ where: { code: data.code }, select: { id: true } });
    if (exists) return NextResponse.json({ error: "CODE_TAKEN", message: "Kode promo ini sudah ada." }, { status: 409 });
    const item = await prisma.promoCode.create({ data });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
