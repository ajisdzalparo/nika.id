import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

// PATCH /api/admin/transaksi/[id] - update transaction status
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const transaction = await prisma.transaction.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
