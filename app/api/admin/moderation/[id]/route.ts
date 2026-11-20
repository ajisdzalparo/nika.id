import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";

const VALID_STATUSES = ["APPROVED", "REJECTED", "PENDING"];

// PATCH /api/admin/moderation/[id] - approve/reject message
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "INVALID_STATUS", allowed: VALID_STATUSES }, { status: 400 });
    }

    const message = await prisma.guestMessage.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(message);
  } catch (error) {
    return apiErrorResponse(error, "Gagal memperbarui status ucapan");
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
    return apiErrorResponse(error, "Gagal menghapus ucapan");
  }
}
