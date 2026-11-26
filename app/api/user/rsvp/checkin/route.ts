import { NextResponse } from "next/server";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { parseCheckInCode } from "@/lib/checkin";
import { checkChatRateLimit } from "@/lib/chat-security";
import { prisma } from "@/lib/prisma";
import { featureBlockedResponse } from "@/lib/feature-guard";

// POST /api/user/rsvp/checkin { code } — mark a guest as arrived from their QR (or a typed code)
export async function POST(request: Request) {
  const blocked = await featureBlockedResponse("CHECK_IN");
  if (blocked) return blocked;

  try {
    const session = await requireAuth(request);
    if (!checkChatRateLimit(`checkin:${session.user.id}`, 120, 60_000)) {
      return NextResponse.json({ error: "RATE_LIMITED", message: "Terlalu cepat, coba lagi sebentar." }, { status: 429 });
    }
    const body = (await request.json().catch(() => ({}))) as { code?: string };
    const token = parseCheckInCode(String(body.code ?? ""));
    if (!token) return NextResponse.json({ error: "INVALID_CODE", message: "Kode QR tidak dikenali." }, { status: 400 });

    // Only RSVPs of invitations this account owns can be checked in
    const rsvp = await prisma.rSVP.findFirst({
      where: { checkInToken: token, userId: session.user.id },
      include: { invitation: { select: { title: true } } },
    });
    if (!rsvp) return NextResponse.json({ error: "NOT_FOUND", message: "QR ini bukan tamu dari undangan Anda." }, { status: 404 });

    const already = Boolean(rsvp.checkedInAt);
    const checkedInAt = rsvp.checkedInAt ?? new Date();
    if (!already) await prisma.rSVP.update({ where: { id: rsvp.id }, data: { checkedInAt } });

    return NextResponse.json({
      already,
      guest: {
        id: rsvp.id,
        name: rsvp.guestName,
        guests: rsvp.guests,
        companions: rsvp.companions,
        note: rsvp.note,
        attendance: rsvp.attendance,
        invitation: rsvp.invitation?.title ?? null,
        checkedInAt: checkedInAt.toISOString(),
      },
    });
  } catch (error) {
    return apiErrorResponse(error, "Gagal check-in tamu");
  }
}
