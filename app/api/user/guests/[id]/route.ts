import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const name = String(body?.name ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
    }

    // @ts-expect-error - Guest model exists in generated Prisma client
    const guest = await prisma.guest.update({
      where: { id, userId: session.user.id },
      data: { name },
    });

    return NextResponse.json(guest);
  } catch (error) {
    console.error("Error updating guest:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    // @ts-expect-error - Guest model exists in generated Prisma client
    await prisma.guest.delete({
      where: { id, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting guest:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

