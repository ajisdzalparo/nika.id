import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { getMaxGuests, type PlanType } from "@/lib/limits";

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
    console.error("Error listing guests:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

// POST /api/user/guests - create guest for active invitation
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const name = String(body?.name ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
    }

    const invitation = await getActiveInvitation(session.user.id);
    const count = await prisma.guest.count({ where: { invitationId: invitation.id } });

    const maxGuests = getMaxGuests(invitation.plan as PlanType, invitation.extraGuestQuota ?? 0);
    if (count >= maxGuests) {
      return NextResponse.json({ error: "GUEST_LIMIT_REACHED", message: `Batas ${maxGuests} tamu tercapai. Tingkatkan paket atau beli add-on +100 tamu.` }, { status: 403 });
    }

    const guest = await prisma.guest.create({
      data: {
        userId: session.user.id,
        invitationId: invitation.id,
        name,
      },
    });

    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    console.error("Error creating guest:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
