import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { slug, type, guestName, attendance, guests, message } = await req.json();

    if (!slug) return new NextResponse("Slug required", { status: 400 });

    const user = await prisma.user.findUnique({
      where: { invitationSlug: slug },
    });

    if (!user) return new NextResponse("User not found", { status: 404 });

    if (type === "RSVP") {
      const rsvp = await prisma.rSVP.create({
        data: {
          userId: user.id,
          guestName,
          attendance,
          guests: parseInt(guests) || 1,
        },
      });
      return NextResponse.json(rsvp);
    }

    if (type === "MESSAGE") {
      const msg = await prisma.guestMessage.create({
        data: {
          userId: user.id,
          guestName,
          message,
          status: "APPROVED", // Auto approve for now or handle moderation later
        },
      });
      return NextResponse.json(msg);
    }

    return new NextResponse("Invalid type", { status: 400 });
  } catch (error) {
    console.error("[PUBLIC_SUBMIT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
