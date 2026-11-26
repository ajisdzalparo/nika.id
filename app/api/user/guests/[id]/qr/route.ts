import { NextResponse } from "next/server";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { newCheckInToken } from "@/lib/checkin";
import { prisma } from "@/lib/prisma";

// POST /api/user/guests/[id]/qr — ensures a manual guest has a scannable RSVP QR check-in token
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const viewer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { accountType: true },
    });
    if (viewer?.accountType === "AGENCY") {
      return NextResponse.json(
        { error: "MITRA_MONITORING_ONLY", message: "QR tamu dikelola langsung oleh akun klien." },
        { status: 403 },
      );
    }

    const { id } = await params;
    const active = await getActiveInvitation(session.user.id);
    const guest = await prisma.guest.findFirst({
      where: { id, invitationId: active.id },
    });
    if (!guest) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Tamu tidak ditemukan." }, { status: 404 });
    }

    const fullName = guest.greeting ? `${guest.greeting} ${guest.name}`.trim() : guest.name.trim();
    const nameCandidates = Array.from(new Set([guest.name.trim(), fullName].map((s) => s.toLowerCase())));

    // Reuse an existing RSVP entry for this guest if one already exists
    const existingRsvps = await prisma.rSVP.findMany({
      where: { invitationId: active.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, guestName: true, phone: true, checkInToken: true },
    });

    const matched = existingRsvps.find(
      (r) =>
        (guest.phone && r.phone && r.phone === guest.phone) ||
        nameCandidates.includes(r.guestName.trim().toLowerCase()),
    );

    if (matched) {
      if (matched.checkInToken) {
        return NextResponse.json({ checkInToken: matched.checkInToken, rsvpId: matched.id });
      }
      const token = newCheckInToken();
      await prisma.rSVP.update({
        where: { id: matched.id },
        data: { checkInToken: token },
      });
      return NextResponse.json({ checkInToken: token, rsvpId: matched.id });
    }

    const token = newCheckInToken();
    const created = await prisma.rSVP.create({
      data: {
        userId: active.userId,
        invitationId: active.id,
        guestName: fullName,
        attendance: "HADIR",
        guests: guest.maxGuests || 1,
        phone: guest.phone,
        note: guest.note,
        checkInToken: token,
      },
      select: { id: true, checkInToken: true },
    });

    return NextResponse.json({ checkInToken: created.checkInToken, rsvpId: created.id }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Gagal membuat QR tamu");
  }
}
