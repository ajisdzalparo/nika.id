import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

// PATCH /api/admin/moderation/[id] - approve/update message
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const message = await prisma.guestMessage.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

// DELETE /api/admin/moderation/[id] - delete message
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    await prisma.guestMessage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
