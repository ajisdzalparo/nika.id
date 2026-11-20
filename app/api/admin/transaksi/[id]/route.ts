import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { createNotification } from "@/lib/notifications";
import { activateTransaction } from "@/lib/payment";

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

    // Approving also activates the plan for the user (manual transfers have no webhook)
    const transaction =
      status === "SUCCESS"
        ? await activateTransaction(id)
        : await prisma.transaction.update({ where: { id }, data: { status, ...(typeof body.notes === "string" ? { notes: body.notes.slice(0, 300) } : {}) } });

    if (status === "FAILED") {
      const rp = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(transaction.amount);
      await createNotification({
        audience: "USER",
        userId: transaction.userId,
        type: "TRANSACTION",
        title: "Pembayaran dibatalkan / ditolak",
        message: `Transaksi ${rp} tidak dapat diproses.${transaction.notes ? ` Catatan: ${transaction.notes}` : ""}`,
        href: "/upgrade",
      });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
