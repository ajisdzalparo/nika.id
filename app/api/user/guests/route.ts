import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { getMaxGuests, type PlanType } from "@/lib/limits";
import { isValidPhoneDigits, normalizePhoneDigits } from "@/lib/phone";

export const GuestPayloadSchema = z.object({
  name: z.string().trim().min(1, "Nama tamu wajib diisi.").max(120, "Nama tamu maksimal 120 karakter."),
  recipientType: z.enum(["PERSONAL", "GROUP"]).optional().default("PERSONAL"),
  guestType: z.enum(["REGULAR", "VIP"]).optional().default("REGULAR"),
  greeting: z.string().trim().max(40).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  label: z.string().trim().max(40).optional().nullable(),
  maxGuests: z.coerce.number().int().min(1).max(20).optional().default(1),
  rsvpEnabled: z.boolean().optional().default(true),
  eventName: z.string().trim().max(80).optional().nullable(),
  note: z.string().trim().max(200).optional().nullable(),
});

// GET /api/user/guests - list guests for active invitation
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const invitation = await getActiveInvitation(session.user.id);

    const guests = await prisma.guest.findMany({
      where: { invitationId: invitation.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(guests);
  } catch (error) {
    return apiErrorResponse(error, "Gagal memuat daftar tamu");
  }
}

// POST /api/user/guests - create guest for active invitation
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const parsed = GuestPayloadSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data tamu tidak valid." },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const rawPhone = (d.phone ?? "").trim();
    const phoneDigits = rawPhone ? normalizePhoneDigits(rawPhone) : "";
    if (rawPhone && (!phoneDigits || !isValidPhoneDigits(phoneDigits))) {
      return NextResponse.json(
        { error: "INVALID_PHONE", message: "Nomor WhatsApp belum valid. Periksa kembali digit nomornya." },
        { status: 400 },
      );
    }

    const invitation = await getActiveInvitation(session.user.id);
    const count = await prisma.guest.count({ where: { invitationId: invitation.id } });

    const maxGuestsAllowed = getMaxGuests(invitation.plan as PlanType, invitation.extraGuestQuota ?? 0);
    if (count >= maxGuestsAllowed) {
      return NextResponse.json(
        { error: "GUEST_LIMIT_REACHED", message: `Batas ${maxGuestsAllowed} tamu tercapai. Tingkatkan paket atau beli add-on +100 tamu.` },
        { status: 403 },
      );
    }

    const guest = await prisma.guest.create({
      data: {
        userId: session.user.id,
        invitationId: invitation.id,
        name: d.name,
        recipientType: d.recipientType,
        guestType: d.guestType,
        greeting: d.greeting || null,
        phone: phoneDigits || null,
        label: d.label || null,
        maxGuests: d.maxGuests,
        rsvpEnabled: d.rsvpEnabled,
        eventName: d.eventName || null,
        note: d.note || null,
      },
    });

    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Gagal menambah tamu");
  }
}
