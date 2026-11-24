import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const PatchSchema = z.object({ isActive: z.boolean() });

// PATCH /api/admin/promo/[id] — switch a code on/off (codes are not edited after use, to keep history honest)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });
    const item = await prisma.promoCode.update({ where: { id }, data: { isActive: parsed.data.isActive } });
    return NextResponse.json({ item });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

// DELETE /api/admin/promo/[id] — only for codes that were never used
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const promo = await prisma.promoCode.findUnique({ where: { id } });
    if (!promo) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (promo.usedCount > 0) {
      return NextResponse.json({ error: "USED", message: "Kode sudah pernah dipakai. Nonaktifkan saja agar riwayat tetap tercatat." }, { status: 409 });
    }
    await prisma.promoCode.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
