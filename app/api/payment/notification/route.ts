import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMidtransClients } from "@/lib/midtrans";
import { resolveMidtransStatus } from "@/lib/midtrans-core";
import { activateTransaction } from "@/lib/payment";

function verifyMidtransSignature(payload: Record<string, unknown>, serverKey: string): boolean {
  const orderId = typeof payload.order_id === "string" ? payload.order_id : "";
  const statusCode = typeof payload.status_code === "string" ? payload.status_code : "";
  const grossAmount = typeof payload.gross_amount === "string" ? payload.gross_amount : "";
  const incomingSig = typeof payload.signature_key === "string" ? payload.signature_key : "";

  if (!orderId || !statusCode || !grossAmount || !incomingSig || !serverKey) {
    return false;
  }

  const expectedHex = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");

  const a = Buffer.from(incomingSig, "utf8");
  const b = Buffer.from(expectedHex, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  try {
    const notification = (await req.json()) as Record<string, unknown>;
    const { enabled, serverKey, core } = await getMidtransClients();

    if (!enabled) {
      return NextResponse.json({ error: "MIDTRANS_NOT_CONFIGURED" }, { status: 503 });
    }

    if (!verifyMidtransSignature(notification, serverKey)) {
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 403 });
    }

    // Double-check authoritative status from Midtrans API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusResponse = await (core as any).transaction.notification(notification);
    const orderId = statusResponse.order_id as string;
    const transactionStatus = statusResponse.transaction_status as string | undefined;
    const fraudStatus = statusResponse.fraud_status as string | undefined;
    const paidAmount = Math.round(Number(statusResponse.gross_amount ?? 0));

    const transaction = await prisma.transaction.findUnique({
      where: { id: orderId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (paidAmount !== transaction.amount) {
      console.error("[MIDTRANS_AMOUNT_MISMATCH]", { orderId, expected: transaction.amount, paidAmount });
      return NextResponse.json({ error: "AMOUNT_MISMATCH" }, { status: 400 });
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
