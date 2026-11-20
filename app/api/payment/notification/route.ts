import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMidtransClients } from "@/lib/midtrans";
import { resolveMidtransStatus } from "@/lib/midtrans-core";
import { activateTransaction } from "@/lib/payment";

export async function POST(req: Request) {
  try {
    const notification = await req.json();
    const { core } = await getMidtransClients();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusResponse = await (core as any).transaction.notification(notification);
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    const transaction = await prisma.transaction.findUnique({
      where: { id: orderId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const newStatus = resolveMidtransStatus(transactionStatus, fraudStatus);

    if (newStatus === "SUCCESS") {
      await activateTransaction(orderId);
    } else {
      await prisma.transaction.update({
        where: { id: orderId },
        data: { status: newStatus },
      });
    }

    return NextResponse.json({ status: "OK" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
