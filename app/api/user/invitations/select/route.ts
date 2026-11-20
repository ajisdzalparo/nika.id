import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { ACTIVE_INVITATION_COOKIE } from "@/lib/active-invitation";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const invitationId = typeof body?.invitationId === "string" ? body.invitationId : "";
    if (!invitationId) {
      return NextResponse.json({ error: "INVITATION_ID_REQUIRED" }, { status: 400 });
    }

    const found = await prisma.invitation.findFirst({
      where: { id: invitationId, userId: session.user.id },
      select: { id: true },
    });
    if (!found) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const res = NextResponse.json({ success: true, activeId: found.id });
    res.cookies.set(ACTIVE_INVITATION_COOKIE, found.id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
