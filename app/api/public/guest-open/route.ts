import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkChatRateLimit, clientIp } from "@/lib/chat-security";

const OpenTrackSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  guestId: z.string().trim().min(1).max(64),
});

/**
 * POST /api/public/guest-open { slug, guestId }
 * Called strictly from client-side React useEffect when a real guest opens their personal link,
 * so link-preview crawlers (WhatsApp, Facebook, Telegram) never trigger false "Sudah dibuka" views.
 */
export async function POST(req: Request) {
  try {
    const parsed = OpenTrackSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { slug, guestId } = parsed.data;
    const ip = clientIp(req);
    if (!checkChatRateLimit(`guest-open:${ip}:${guestId}`, 10, 60_000)) {
      return NextResponse.json({ ok: true });
    }

    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      select: {
        id: true,
        openedAt: true,
        invitation: { select: { slug: true, plan: true, isPublic: true } },
      },
    });

    if (!guest?.invitation || guest.invitation.slug !== slug) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    if (guest.invitation.plan === "FREE" || guest.invitation.isPublic === false) {
      return NextResponse.json({ ok: true });
    }

    const now = new Date();
    await prisma.guest.update({
      where: { id: guest.id },
      data: {
        openedAt: guest.openedAt ?? now,
        lastOpenedAt: now,
        openCount: { increment: 1 },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PUBLIC_GUEST_OPEN]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
