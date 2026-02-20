"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPendingTransactions() {
  return await prisma.transaction.findMany({
    where: {
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function simulateWebhook(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const payload = {
    transaction_status: "settlement",
    order_id: transactionId,
    fraud_status: "accept",
    status_code: "200",
    gross_amount: transaction.amount.toString(),
    payment_type: "credit_card",
    transaction_time: new Date().toISOString(),
    transaction_id: `mock-${Date.now()}`,
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment/notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to simulate webhook: ${response.statusText}`);
  }

  revalidatePath("/test/payment");
  return { success: true };
}
