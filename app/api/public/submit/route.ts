import { prisma } from "@/lib/prisma";
import { checkChatRateLimit, clientIp } from "@/lib/chat-security";
import { createNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";
import { isValidPhoneDigits, normalizePhoneDigits } from "@/lib/phone";
import { newCheckInToken } from "@/lib/checkin";

const MAX_GUEST_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 500;
const MAX_GUESTS = 20;
const VALID_ATTENDANCE = ["HADIR", "TIDAK HADIR", "MUNGKIN"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slug, type } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "SLUG_REQUIRED" }, { status: 400 });
    }

    const ip = clientIp(req);
    if (!checkChatRateLimit(`public-submit:${ip}:${slug}`, 15, 60_000)) {
      return NextResponse.json({ error: "RATE_LIMITED", message: "Terlalu banyak kiriman. Coba lagi nanti." }, { status: 429 });
    }

    if (!type || !["RSVP", "MESSAGE"].includes(type)) {
      return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
    }

    let invitation = await prisma.invitation.findUnique({ where: { slug } });
    let userId = invitation?.userId;

    if (!invitation) {
      const legacyUser = await prisma.user.findUnique({
        where: { invitationSlug: slug },
        include: { invitations: { orderBy: { createdAt: "asc" }, take: 1 } },
      });
      if (!legacyUser) {
        return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
      }
      userId = legacyUser.id;
      invitation = legacyUser.invitations[0] ?? null;
    }

    if (!userId) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    // Guests can only reach a published invitation; an unpaid preview or a hidden one must not collect
    // RSVPs/wishes from whoever guesses the slug.
    if (invitation && (invitation.plan === "FREE" || invitation.isPublic === false)) {
      return NextResponse.json({ error: "NOT_PUBLISHED", message: "Undangan ini belum diterbitkan." }, { status: 403 });
    }

    const guestName = String(body.guestName ?? "")
      .trim()
      .slice(0, MAX_GUEST_NAME_LENGTH);
    if (!guestName) {
      return NextResponse.json({ error: "GUEST_NAME_REQUIRED" }, { status: 400 });
    }

    if (type === "RSVP") {
      const attendance = String(body.attendance ?? "");
      if (!VALID_ATTENDANCE.includes(attendance)) {
        return NextResponse.json({ error: "INVALID_ATTENDANCE", allowed: VALID_ATTENDANCE }, { status: 400 });
      }

      const guests = attendance === "TIDAK HADIR" ? 1 : Math.min(Math.max(parseInt(body.guests) || 1, 1), MAX_GUESTS);
      const phoneDigits = normalizePhoneDigits(String(body.phone ?? ""));
      const phone = phoneDigits && isValidPhoneDigits(phoneDigits) ? phoneDigits : null;
      const companions = guests > 1 ? String(body.companions ?? "").trim().slice(0, 300) || null : null;
      const customAnswer = String(body.customAnswer ?? "").trim().slice(0, 120) || null;
      // Optional per invitation: guests who are coming get a personal QR for check-in at the venue
      const rsvpSettings = ((invitation?.data ?? {}) as { rsvp?: { qrCheckIn?: boolean } }).rsvp;
      const checkInToken = rsvpSettings?.qrCheckIn && attendance !== "TIDAK HADIR" ? newCheckInToken() : null;

      const rsvp = await prisma.rSVP.create({
        data: {
          userId,
          invitationId: invitation?.id ?? null,
          guestName,
          attendance,
          guests,
          phone,
          companions,
          customAnswer,
          checkInToken,
        },
      });
      await createNotification({
        audience: "USER",
        userId,
        type: "RSVP",
        title: `RSVP baru · ${guestName}`,
        message: `Konfirmasi ${attendance} untuk ${guests} tamu${invitation?.title ? ` (${invitation.title})` : ""}.`,
        href: "/buku-tamu",
      });
      // Only what the guest needs back: their own check-in code
      return NextResponse.json({ id: rsvp.id, checkInToken: rsvp.checkInToken });
    }

    if (type === "MESSAGE") {
      const message = String(body.message ?? "")
        .trim()
        .slice(0, MAX_MESSAGE_LENGTH);
      if (!message) {
        return NextResponse.json({ error: "MESSAGE_REQUIRED" }, { status: 400 });
      }

      const msg = await prisma.guestMessage.create({
        data: {
          userId,
          invitationId: invitation?.id ?? null,
          guestName,
          message,
          status: "PENDING",
        },
      });
      await createNotification({
        audience: "USER",
        userId,
        type: "RSVP",
        title: `Ucapan baru dari ${guestName}`,
        message: message.slice(0, 120),
        href: "/buku-tamu",
      });
      return NextResponse.json(msg);
    }

    return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
  } catch (error) {
    console.error("[PUBLIC_SUBMIT]", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
