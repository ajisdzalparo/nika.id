import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { core } from "@/lib/midtrans";
import { PLAN_LIMITS, PlanType } from "@/lib/limits";

export async function POST(req: Request) {
  try {
    const notification = await req.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statusResponse = await (core as any).transaction.notification(notification);
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    const transaction = await prisma.transaction.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    let newStatus = "PENDING";

    if (transactionStatus == "capture") {
      if (fraudStatus == "challenge") {
        newStatus = "CHALLENGE";
      } else if (fraudStatus == "accept") {
        newStatus = "SUCCESS";
      }
    } else if (transactionStatus == "settlement") {
      newStatus = "SUCCESS";
    } else if (transactionStatus == "cancel" || transactionStatus == "deny" || transactionStatus == "expire") {
      newStatus = "FAILED";
    } else if (transactionStatus == "pending") {
      newStatus = "PENDING";
    }

    await prisma.transaction.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    if (newStatus === "SUCCESS" && transaction.status !== "SUCCESS") {
      // Update user plan

      const planLimits = PLAN_LIMITS[(transaction as unknown as { plan: PlanType }).plan];
      if (planLimits) {
        const expiresAt = planLimits.activeDays ? new Date(Date.now() + planLimits.activeDays * 24 * 60 * 60 * 1000) : null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
          plan: (transaction as unknown as { plan: PlanType }).plan,
          planExpiresAt: expiresAt,
        };

        await prisma.user.update({
          where: { id: transaction.userId },
          data: updateData,
        });
      }
    }

    return NextResponse.json({ status: "OK" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
