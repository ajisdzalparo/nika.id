import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Money ledger: every movement is one LedgerEntry row (rupiah, + credit / − debit).
//  - PLATFORM_REVENUE: money the platform received (userId = null).
//  - USER_EARNINGS:    money owed to a user (commissions, template sales); withdrawals debit it.
// Balances are always computed from rows, never stored, so the history is the source of truth.

export const LEDGER_ACCOUNT = { revenue: "PLATFORM_REVENUE", earnings: "USER_EARNINGS" } as const;
export const MIN_WITHDRAWAL = 50_000;

type Tx = Prisma.TransactionClient;

export interface PaidTransaction {
  id: string;
  userId: string;
  amount: number;
  kind: string;
  paymentMethod: string | null;
}

const sourceOf = (t: { kind: string }) => (t.kind === "GUEST_ADDON" ? "GUEST_ADDON" : t.kind || "PLAN");

/** Books a successful payment as platform revenue. Idempotent per transaction. */
export async function recordPaymentRevenue(
  t: PaidTransaction,
  client: Tx | typeof prisma = prisma,
  amountOverride?: number,
) {
  const amount = amountOverride ?? t.amount;
  if (amount <= 0) return;
  await client.ledgerEntry.createMany({
    data: [
      {
        key: `revenue:${t.id}`,
        account: LEDGER_ACCOUNT.revenue,
        type: "PAYMENT_RECEIVED",
        source: sourceOf(t),
        amount,
        transactionId: t.id,
        note: t.paymentMethod ?? null,
      },
    ],
    skipDuplicates: true,
  });
}

/** Adds revenue rows for paid transactions made before the ledger existed. Safe to call repeatedly. */
export async function backfillRevenue() {
  const paid = await prisma.transaction.findMany({
    where: { status: "SUCCESS" },
    select: { id: true, userId: true, amount: true, kind: true, paymentMethod: true, updatedAt: true },
  });
  if (!paid.length) return 0;

  const marketplaceIds = paid.filter((t) => t.kind === "MARKETPLACE").map((t) => t.id);
  const purchases = marketplaceIds.length
    ? await prisma.templatePurchase.findMany({
        where: { transactionId: { in: marketplaceIds } },
        select: { transactionId: true, platformFee: true },
      })
    : [];
  const feeByTx = new Map(purchases.map((p) => [p.transactionId, p.platformFee]));

  const rows = paid
    .map((t) => ({
      key: `revenue:${t.id}`,
      account: LEDGER_ACCOUNT.revenue,
      type: "PAYMENT_RECEIVED",
      source: sourceOf(t),
      amount: t.kind === "MARKETPLACE" ? (feeByTx.get(t.id) ?? t.amount) : t.amount,
      transactionId: t.id,
      note: t.paymentMethod ?? null,
      createdAt: t.updatedAt,
    }))
    .filter((r) => r.amount > 0);

  if (!rows.length) return 0;
  const res = await prisma.ledgerEntry.createMany({
    data: rows,
    skipDuplicates: true,
  });
  return res.count;
}

/** A user's earnings: `available` can be withdrawn now, `pending` is still in the holding period. */
export async function getUserBalance(userId: string, client: Tx | typeof prisma = prisma) {
  const now = new Date();
  const [available, pending] = await Promise.all([
    client.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { userId, account: LEDGER_ACCOUNT.earnings, OR: [{ availableAt: null }, { availableAt: { lte: now } }] },
    }),
    client.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { userId, account: LEDGER_ACCOUNT.earnings, availableAt: { gt: now } },
    }),
  ]);
  return { available: available._sum.amount ?? 0, pending: pending._sum.amount ?? 0 };
}

export class WithdrawalError extends Error {}

/** Creates a withdrawal and reserves the amount right away (so it cannot be requested twice). */
export async function requestWithdrawal(
  userId: string,
  input: { amount: number; method: "BANK" | "EWALLET"; provider: string; accountNumber: string; accountName: string },
) {
  return prisma.$transaction(
    async (tx) => {
      if (!Number.isInteger(input.amount) || input.amount < MIN_WITHDRAWAL) {
        throw new WithdrawalError(`Minimal penarikan Rp ${MIN_WITHDRAWAL.toLocaleString("id-ID")}`);
      }
      const open = await tx.withdrawalRequest.count({ where: { userId, status: "PENDING" } });
      if (open) throw new WithdrawalError("Masih ada penarikan yang sedang diproses");
      const { available } = await getUserBalance(userId, tx);
      if (input.amount > available) throw new WithdrawalError("Saldo yang bisa ditarik tidak cukup");

      const wd = await tx.withdrawalRequest.create({ data: { userId, ...input } });
      await tx.ledgerEntry.create({
        data: {
          key: `withdrawal:${wd.id}`,
          account: LEDGER_ACCOUNT.earnings,
          type: "WITHDRAWAL",
          amount: -input.amount,
          userId,
          withdrawalId: wd.id,
        },
      });
      return wd;
    },
    { isolationLevel: "Serializable" },
  );
}

/** Admin marks a withdrawal as transferred. */
export async function markWithdrawalPaid(id: string, proofUrl: string | null, adminNote: string | null) {
  const res = await prisma.withdrawalRequest.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "PAID", proofUrl, adminNote, processedAt: new Date() },
  });
  if (!res.count) throw new WithdrawalError("Penarikan tidak ditemukan atau sudah diproses");
}

/** Admin rejects a withdrawal; the reserved amount returns to the user's balance. */
export async function rejectWithdrawal(id: string, adminNote: string | null) {
  await prisma.$transaction(async (tx) => {
    const wd = await tx.withdrawalRequest.findFirst({ where: { id, status: "PENDING" } });
    if (!wd) throw new WithdrawalError("Penarikan tidak ditemukan atau sudah diproses");
    await tx.withdrawalRequest.update({ where: { id }, data: { status: "REJECTED", adminNote, processedAt: new Date() } });
    await tx.ledgerEntry.create({
      data: {
        key: `withdrawal-reversal:${id}`,
        account: LEDGER_ACCOUNT.earnings,
        type: "WITHDRAWAL_REVERSAL",
        amount: wd.amount,
        userId: wd.userId,
        withdrawalId: id,
        note: adminNote,
      },
    });
  });
}

/** Totals for the admin finance report in [from, to). */
export async function getFinanceSummary(from: Date, to: Date) {
  const range = { gte: from, lt: to };
  const [bySource, byDay, owed, paidOut, pendingOut] = await Promise.all([
    prisma.ledgerEntry.groupBy({ by: ["source"], _sum: { amount: true }, _count: true, where: { account: LEDGER_ACCOUNT.revenue, createdAt: range } }),
    prisma.$queryRaw<{ day: Date; total: bigint }[]>`
      SELECT date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Jakarta') AS day, SUM(amount)::bigint AS total
      FROM "LedgerEntry"
      WHERE account = 'PLATFORM_REVENUE' AND "createdAt" >= ${from} AND "createdAt" < ${to}
      GROUP BY 1 ORDER BY 1`,
    prisma.ledgerEntry.aggregate({ _sum: { amount: true }, where: { account: LEDGER_ACCOUNT.earnings } }),
    prisma.withdrawalRequest.aggregate({ _sum: { amount: true }, _count: true, where: { status: "PAID", processedAt: range } }),
    prisma.withdrawalRequest.aggregate({ _sum: { amount: true }, _count: true, where: { status: "PENDING" } }),
  ]);
  const revenue = bySource.reduce((n, r) => n + (r._sum.amount ?? 0), 0);
  return {
    revenue,
    revenueBySource: bySource.map((r) => ({ source: r.source ?? "LAINNYA", amount: r._sum.amount ?? 0, count: r._count })),
    revenueByDay: byDay.map((d) => ({ day: d.day.toISOString().slice(0, 10), amount: Number(d.total) })),
    /** Earnings still owed to users (incl. amounts reserved by pending withdrawals are already deducted) */
    owedToUsers: owed._sum.amount ?? 0,
    withdrawalsPaid: { amount: paidOut._sum.amount ?? 0, count: paidOut._count },
    withdrawalsPending: { amount: pendingOut._sum.amount ?? 0, count: pendingOut._count },
  };
}
