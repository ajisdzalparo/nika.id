import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

const VALID_STATUSES = ["PENDING", "SUCCESS", "FAILED"];

// PATCH /api/admin/transaksi/[id] - update transaction status
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "INVALID_STATUS", allowed: VALID_STATUSES }, { status: 400 });
    }

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
