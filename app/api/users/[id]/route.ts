import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

// GET /api/users/[id] - get user details
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        template: true,
        invitation: true,
        _count: {
          select: {
            guests: true,
            rsvps: true,
            messages: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

// PATCH /api/users/[id] - update user (role, etc)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - delete user
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    // Safety check: don't delete yourself
    // (This would require getting current session but as a basic safety for now)

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
