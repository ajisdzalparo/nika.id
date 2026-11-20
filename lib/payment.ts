import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanType } from "@/lib/limits";

export interface BankAccount {
  bank: string;
  number: string;
  holder: string;
}

/**
 * Manual transfer destinations from env:
 *   MANUAL_PAYMENT_BANKS="BCA|1234567890|Nama Pemilik;Mandiri|0987654321|Nama Pemilik"
 *   MANUAL_PAYMENT_WHATSAPP="6281234567890"   (optional, for payment questions)
 */
export function getManualPaymentInfo() {
  const banks: BankAccount[] = (process.env.MANUAL_PAYMENT_BANKS || "")
    .split(";")
    .map((row) => row.split("|").map((x) => x.trim()))
    .filter((p) => p.length === 3 && p.every(Boolean))
    .map(([bank, number, holder]) => ({ bank, number, holder }));
  const whatsapp = (process.env.MANUAL_PAYMENT_WHATSAPP || "").replace(/\D/g, "") || null;
  return { banks, whatsapp };
}

/** Plan price plus a 3-digit unique code so admins can match the transfer to the order. */
export function amountWithUniqueCode(price: number) {
  return price + 100 + Math.floor(Math.random() * 900);
}

/**
 * Marks a transaction as paid and activates its plan for the user. Safe to call twice:
 * only the first call (PENDING → SUCCESS) activates.
 */
export async function activateTransaction(transactionId: string) {
  return prisma.$transaction(async (tx) => {
    const t = await tx.transaction.findUnique({ where: { id: transactionId } });
    if (!t) throw new Error("NOT_FOUND");
    if (t.status === "SUCCESS") return t;

    const plan = t.plan as PlanType | null;
    const limits = plan ? PLAN_LIMITS[plan] : undefined;
    const updated = await tx.transaction.update({ where: { id: t.id }, data: { status: "SUCCESS" } });
    if (plan && limits) {
      await tx.user.update({
        where: { id: t.userId },
        data: { plan, planExpiresAt: limits.activeDays ? new Date(Date.now() + limits.activeDays * 86_400_000) : null },
      });
    }
    return updated;
  });
}
