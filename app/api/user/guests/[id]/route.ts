import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation, invitationAccessWhere } from "@/lib/active-invitation";
import { isValidPhoneDigits, normalizePhoneDigits } from "@/lib/phone";

const UpdateGuestSchema = z.object({
  name: z.string().trim().min(1, "Nama tamu wajib diisi.").max(120).optional(),
  recipientType: z.enum(["PERSONAL", "GROUP"]).optional(),
  guestType: z.enum(["REGULAR", "VIP"]).optional(),
  greeting: z.string().trim().max(40).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  label: z.string().trim().max(40).optional().nullable(),
  maxGuests: z.coerce.number().int().min(1).max(20).optional(),
  rsvpEnabled: z.boolean().optional(),
  eventName: z.string().trim().max(80).optional().nullable(),
  note: z.string().trim().max(200).optional().nullable(),
  markSent: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const viewer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { accountType: true } });
    if (viewer?.accountType === "AGENCY") {
      return NextResponse.json(
        { error: "MITRA_MONITORING_ONLY", message: "Daftar tamu dikelola langsung oleh akun klien. Mitra hanya dapat memantau daftar tamu." },
        { status: 403 },
      );
    }
    const { id } = await params;
    const parsed = UpdateGuestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data tamu tidak valid." },
        { status: 400 },
      );
    }

    const d = parsed.data;
    let phoneValue: string | null | undefined = undefined;
    if (d.phone !== undefined) {
      const rawPhone = (d.phone ?? "").trim();
      const digits = rawPhone ? normalizePhoneDigits(rawPhone) : "";
      if (rawPhone && (!digits || !isValidPhoneDigits(digits))) {
        return NextResponse.json(
          { error: "INVALID_PHONE", message: "Nomor WhatsApp belum valid. Periksa kembali digit nomornya." },
          { status: 400 },
        );
      }
      phoneValue = digits || null;
    }

    const active = await getActiveInvitation(session.user.id);
    const existing = await prisma.guest.findFirst({
      where: { id, invitationId: active.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Tamu tidak ditemukan." }, { status: 404 });
    }

    const guest = await prisma.guest.update({
      where: { id: existing.id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.recipientType !== undefined ? { recipientType: d.recipientType } : {}),
        ...(d.guestType !== undefined ? { guestType: d.guestType } : {}),
        ...(d.greeting !== undefined ? { greeting: d.greeting || null } : {}),
        ...(phoneValue !== undefined ? { phone: phoneValue } : {}),
        ...(d.label !== undefined ? { label: d.label || null } : {}),
        ...(d.maxGuests !== undefined ? { maxGuests: d.maxGuests } : {}),
        ...(d.rsvpEnabled !== undefined ? { rsvpEnabled: d.rsvpEnabled } : {}),
        ...(d.eventName !== undefined ? { eventName: d.eventName || null } : {}),
        ...(d.note !== undefined ? { note: d.note || null } : {}),
        ...(d.markSent !== undefined ? { sentAt: d.markSent ? (existing.sentAt ?? new Date()) : null } : {}),
      },
    });

    return NextResponse.json(guest);
  } catch (error) {
    return apiErrorResponse(error, "Gagal memperbarui data tamu");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const viewer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { accountType: true } });
    if (viewer?.accountType === "AGENCY") {
      return NextResponse.json(
        { error: "MITRA_MONITORING_ONLY", message: "Daftar tamu dikelola langsung oleh akun klien. Mitra hanya dapat memantau daftar tamu." },
        { status: 403 },
      );
    }
    const { id } = await params;

    await prisma.guest.deleteMany({
      where: { id, invitation: invitationAccessWhere(session.user.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, "Gagal menghapus tamu");
  }
}
