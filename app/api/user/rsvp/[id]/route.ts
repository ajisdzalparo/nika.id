import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { newCheckInToken } from "@/lib/checkin";
import { prisma } from "@/lib/prisma";
import { invitationAccessWhere } from "@/lib/active-invitation";

const PatchSchema = z.object({
  note: z.string().trim().max(120).optional(),
  checkedIn: z.boolean().optional(),
  /** Make sure the guest has a QR code (creates one if missing) */
  ensureToken: z.boolean().optional(),
});

async function ownRsvp(id: string, userId: string) {
  return prisma.rSVP.findFirst({ where: { id, invitation: invitationAccessWhere(userId) } });
}

// PATCH /api/user/rsvp/:id — note, manual check-in, or create the QR token
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const viewer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { accountType: true } });
    if (viewer?.accountType === "AGENCY") {
      return NextResponse.json(
        { error: "MITRA_MONITORING_ONLY", message: "Data RSVP dikelola langsung oleh akun klien. Mitra hanya dapat memantau konfirmasi tamu." },
        { status: 403 },
      );
    }
    const { id } = await params;
    const parsed = PatchSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
    const rsvp = await ownRsvp(id, session.user.id);
    if (!rsvp) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const { note, checkedIn, ensureToken } = parsed.data;
    const updated = await prisma.rSVP.update({
      where: { id },
      data: {
        ...(note !== undefined ? { note: note || null } : {}),
        ...(checkedIn !== undefined ? { checkedInAt: checkedIn ? (rsvp.checkedInAt ?? new Date()) : null } : {}),
        ...(ensureToken && !rsvp.checkInToken ? { checkInToken: newCheckInToken() } : {}),
      },
      select: { id: true, note: true, checkedInAt: true, checkInToken: true },
    });
    return NextResponse.json({ rsvp: { ...updated, checkedInAt: updated.checkedInAt?.toISOString() ?? null } });
  } catch (error) {
    return apiErrorResponse(error, "Gagal memperbarui RSVP");
  }
}

// DELETE /api/user/rsvp/:id
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const viewer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { accountType: true } });
    if (viewer?.accountType === "AGENCY") {
      return NextResponse.json(
        { error: "MITRA_MONITORING_ONLY", message: "Data RSVP dikelola langsung oleh akun klien. Mitra hanya dapat memantau konfirmasi tamu." },
        { status: 403 },
      );
    }
    const { id } = await params;
    const rsvp = await ownRsvp(id, session.user.id);
    if (!rsvp) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    await prisma.rSVP.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, "Gagal menghapus RSVP");
  }
}
