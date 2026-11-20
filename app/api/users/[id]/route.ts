import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";

const VALID_ROLES = ["USER", "admin"];

// GET /api/users/[id] - get user details
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        invitations: true,
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
    return apiErrorResponse(error, "Gagal memuat pengguna");
  }
}

// PATCH /api/users/[id] - update user role
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "INVALID_ROLE", allowed: VALID_ROLES }, { status: 400 });
    }

    if (id === session.user.id && role !== "admin") {
      return NextResponse.json({ error: "CANNOT_DEMOTE_SELF" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });

    return NextResponse.json(user);
  } catch (error) {
    return apiErrorResponse(error, "Gagal memperbarui pengguna");
  }
}

// DELETE /api/users/[id] - delete user
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin(request);
    const { id } = await params;

    // Safety: admin cannot delete their own account
    if (id === session.user.id) {
      return NextResponse.json({ error: "CANNOT_DELETE_SELF" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, "Gagal menghapus pengguna");
  }
}
