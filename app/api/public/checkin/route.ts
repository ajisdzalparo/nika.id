import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-helpers";
import { checkChatRateLimit } from "@/lib/chat-security";
import { createNotification } from "@/lib/notifications";
import { isValidPhoneDigits, normalizePhoneDigits } from "@/lib/phone";
import { newCheckInToken } from "@/lib/checkin";

const SelfCheckInSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  guestName: z.string().trim().min(1, "Nama tamu wajib diisi.").max(100),
  guests: z.coerce.number().int().min(1).max(20).optional().default(1),
  phone: z.string().trim().max(30).optional().nullable(),
  companions: z.string().trim().max(300).optional().nullable(),
  wish: z.string().trim().max(500).optional().nullable(),
});

// POST /api/public/checkin — guest scans printed venue QR and records their own arrival
export async function POST(req: Request) {
  try {
    const parsed = SelfCheckInSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data kehadiran belum lengkap." },
        { status: 400 },
      );
    }

    const { slug, guestName, guests, companions, wish } = parsed.data;
    const rawPhone = (parsed.data.phone ?? "").trim();
    const phoneDigits = rawPhone ? normalizePhoneDigits(rawPhone) : "";
    const phone = phoneDigits && isValidPhoneDigits(phoneDigits) ? phoneDigits : null;

    // Generous rate limit per IP+slug because venue guests often share hotel/venue Wi-Fi NAT
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    if (!checkChatRateLimit(`public-checkin:${clientIp}:${slug}`, 60, 60_000)) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Terlalu banyak kiriman dalam waktu singkat. Coba sebentar lagi." },
        { status: 429 },
      );
    }

    let invitation = await prisma.invitation.findUnique({ where: { slug } });
    if (!invitation) {
      const legacyUser = await prisma.user.findUnique({
        where: { invitationSlug: slug },
        include: { invitations: { orderBy: { createdAt: "asc" }, take: 1 } },
      });
      invitation = legacyUser?.invitations[0] ?? null;
    }

    if (!invitation) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Undangan tidak ditemukan." }, { status: 404 });
    }

    // Allow published invitations publicly, or allow the logged-in owner to test in preview mode
    if (invitation.plan === "FREE" || invitation.isPublic === false) {
      const session = await getSession(req, "user");
      if (!session || session.user.id !== invitation.userId) {
        return NextResponse.json(
          { error: "NOT_PUBLISHED", message: "Undangan ini belum diterbitkan untuk umum." },
          { status: 403 },
        );
      }
    }

    // Match an existing RSVP for this invitation (by phone if supplied, otherwise case-insensitive name)
    const existing = await prisma.rSVP.findFirst({
      where: {
        invitationId: invitation.id,
        OR: [
          { guestName: { equals: guestName, mode: "insensitive" } },
          ...(phone ? [{ phone }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    let rsvpId: string;
    let checkedInAt: Date;
    let finalName = guestName;
    let finalGuests = guests;
    let already = false;

    if (existing) {
      rsvpId = existing.id;
      finalName = existing.guestName;
      already = Boolean(existing.checkedInAt);
      checkedInAt = existing.checkedInAt ?? now;
      if (!already) {
        finalGuests = guests;
        await prisma.rSVP.update({
          where: { id: existing.id },
          data: {
            attendance: "HADIR",
            guests,
            phone: phone ?? existing.phone,
            companions: guests > 1 ? companions || existing.companions : existing.companions,
            checkedInAt,
            ...(existing.checkInToken ? {} : { checkInToken: newCheckInToken() }),
          },
        });
      } else {
        finalGuests = existing.guests;
      }
    } else {
      const created = await prisma.rSVP.create({
        data: {
          userId: invitation.userId,
          invitationId: invitation.id,
          guestName,
          attendance: "HADIR",
          guests,
          phone,
          companions: guests > 1 ? companions || null : null,
          checkInToken: newCheckInToken(),
          checkedInAt: now,
        },
      });
      rsvpId = created.id;
      checkedInAt = now;
    }

    const cleanWish = (wish ?? "").trim().slice(0, 500);
    if (cleanWish && !already) {
      await prisma.guestMessage.create({
        data: {
          userId: invitation.userId,
          invitationId: invitation.id,
          guestName: finalName,
          message: cleanWish,
          status: "PENDING",
        },
      });
    }

    if (!already) {
      await createNotification({
        audience: "USER",
        userId: invitation.userId,
        type: "RSVP",
        title: `Tamu hadir · ${finalName}`,
        message: `${finalName} (${finalGuests} orang) baru saja check-in lewat QR meja tamu${invitation.title ? ` (${invitation.title})` : ""}.`,
        href: "/check-in",
      });
    }

    return NextResponse.json({
      id: rsvpId,
      already,
      guest: {
        name: finalName,
        guests: finalGuests,
        checkedInAt: checkedInAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[PUBLIC_CHECKIN]", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message: "Gagal mencatat kehadiran." }, { status: 500 });
  }
}
