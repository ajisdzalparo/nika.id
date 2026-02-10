import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// GET /api/user/guests - list guests for current user
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);

    // @ts-expect-error - Guest model exists in generated Prisma client
    const guests = await prisma.guest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(guests);
  } catch (error) {
    console.error("Error listing guests:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

// POST /api/user/guests - create guest for current user
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const name = String(body?.name ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
    }

    // @ts-expect-error - Guest model exists in generated Prisma client
    const guest = await prisma.guest.create({
      data: {
        userId: session.user.id,
        name,
      },
    });

    return NextResponse.json(guest, { status: 201 });
  } catch (error) {
    console.error("Error creating guest:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

