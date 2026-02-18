import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    if (!type || !["RSVP", "MESSAGE"].includes(type)) {
      return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { invitationSlug: slug },
    });

    if (!user) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    // Sanitize guest name
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

      const guests = Math.min(Math.max(parseInt(body.guests) || 1, 1), MAX_GUESTS);

      const rsvp = await prisma.rSVP.create({
        data: {
          userId: user.id,
          guestName,
          attendance,
          guests,
        },
      });
      return NextResponse.json(rsvp);
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
          userId: user.id,
          guestName,
          message,
          status: "PENDING",
        },
      });
      return NextResponse.json(msg);
    }

    return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
  } catch (error) {
    console.error("[PUBLIC_SUBMIT]", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
