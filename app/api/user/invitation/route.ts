import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";

// GET /api/user/invitation - get active invitation config for current user
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const invitation = await getActiveInvitation(session.user.id);
    return NextResponse.json(invitation);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    console.error("Error loading invitation:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

// PUT /api/user/invitation - update active invitation JSON data
export async function PUT(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const active = await getActiveInvitation(session.user.id, typeof body?.invitationId === "string" ? body.invitationId : undefined);

    const raw = (body?.data ?? {}) as {
      groom?: { nickname?: string };
      bride?: { nickname?: string };
      events?: { date?: string }[];
    };
    const coupleTitle =
      raw?.groom?.nickname && raw?.bride?.nickname ? `${raw.groom.nickname} & ${raw.bride.nickname}` : undefined;
    const firstDate = raw?.events?.[0]?.date ? new Date(raw.events[0].date) : null;

    const invitation = await prisma.invitation.update({
      where: { id: active.id },
      data: {
        data: body?.data ?? {},
        isPublic: typeof body?.isPublic === "boolean" ? body.isPublic : undefined,
        ...(coupleTitle && (!active.title || active.title === "Undangan Pernikahan") ? { title: coupleTitle } : {}),
        ...(firstDate && !Number.isNaN(firstDate.getTime()) ? { weddingDate: firstDate } : {}),
      },
    });

    return NextResponse.json(invitation);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    console.error("Error updating invitation:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
