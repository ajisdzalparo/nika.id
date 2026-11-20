import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { getMidtransClients } from "@/lib/midtrans";
import { resolveMidtransStatus } from "@/lib/midtrans-core";
import { activateTransaction } from "@/lib/payment";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession(req, "user");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) return NextResponse.json({ error: "ORDER_ID_REQUIRED" }, { status: 400 });

    const tx = await prisma.transaction.findFirst({
      where: { id: orderId, userId: session.user.id },
    });
    if (!tx) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    if (tx.status === "SUCCESS") return NextResponse.json({ status: "SUCCESS" });
    if (tx.status === "FAILED") return NextResponse.json({ status: "FAILED" });

    const { enabled, core } = await getMidtransClients();
    if (!enabled) return NextResponse.json({ status: tx.status });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusRes = await (core as any).transaction.status(tx.id).catch(() => null);
    if (!statusRes) return NextResponse.json({ status: tx.status });

    const nextStatus = resolveMidtransStatus(statusRes.transaction_status, statusRes.fraud_status);

    if (nextStatus === "SUCCESS") {
      await activateTransaction(tx.id);
      return NextResponse.json({ status: "SUCCESS" });
    }
    if (nextStatus === "FAILED") {
      await prisma.transaction.update({ where: { id: tx.id }, data: { status: "FAILED" } });
      return NextResponse.json({ status: "FAILED" });
    }

    return NextResponse.json({ status: "PENDING" });
  } catch (error) {
    console.error("[MIDTRANS_STATUS_ERROR]", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
