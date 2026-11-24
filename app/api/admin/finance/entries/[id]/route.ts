import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";

// DELETE /api/admin/finance/entries/[id] — only manual rows; payment and withdrawal rows are immutable
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const res = await prisma.ledgerEntry.deleteMany({ where: { id, type: "MANUAL" } });
    if (!res.count) return NextResponse.json({ error: "NOT_FOUND", message: "Catatan manual tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, "Gagal menghapus catatan");
  }
}
