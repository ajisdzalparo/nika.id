import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/user/invitation - get or create invitation config for current user
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);

    const invitation = await prisma.invitation.upsert({
      where: { userId: session.user.id },
      update: {},
      create: {
        userId: session.user.id,
        data: {},
      },
    });

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("Error loading invitation:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

// PUT /api/user/invitation - update invitation JSON data
export async function PUT(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();

    const invitation = await prisma.invitation.upsert({
      where: { userId: session.user.id },
      update: {
        data: body?.data ?? {},
        isPublic: typeof body?.isPublic === "boolean" ? body.isPublic : undefined,
      },
      create: {
        userId: session.user.id,
        data: body?.data ?? {},
        isPublic: typeof body?.isPublic === "boolean" ? body.isPublic : true,
      },
    });

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("Error updating invitation:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

