import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { LEDGER_ACCOUNT, backfillRevenue } from "@/lib/ledger";

// Finance report on top of the ledger (lib/ledger.ts).
//  - PLATFORM_REVENUE rows: app payments (type PAYMENT_RECEIVED) + manual income (type MANUAL)
//  - PLATFORM_EXPENSE rows: costs entered manually or imported from Excel (positive amounts)

export const EXPENSE_ACCOUNT = "PLATFORM_EXPENSE";
export const EXPENSE_CATEGORIES = ["Server & hosting", "API AI", "Payment gateway", "Iklan & marketing", "Gaji & freelancer", "Domain & software", "Pajak", "Lainnya"] as const;
export const INCOME_CATEGORIES = ["Penjualan offline", "Agency / B2B", "Sponsor", "Lainnya"] as const;

export type ManualKind = "INCOME" | "EXPENSE";

export interface ManualEntryInput {
  kind: ManualKind;
  date: Date;
  category: string;
  amount: number;
  note?: string | null;
}

/** Fingerprint so the same row imported twice is stored once. */
export function manualKey(e: ManualEntryInput) {
  const raw = [e.kind, e.date.toISOString().slice(0, 10), e.category.trim().toLowerCase(), e.amount, (e.note ?? "").trim().toLowerCase()].join("|");
  return `manual:${createHash("sha1").update(raw).digest("hex")}`;
}

/** Stores manual income/expense rows; returns how many were new. */
export async function addManualEntries(entries: ManualEntryInput[]) {
  if (!entries.length) return 0;
  const res = await prisma.ledgerEntry.createMany({
    data: entries.map((e) => ({
      key: manualKey(e),
      account: e.kind === "INCOME" ? LEDGER_ACCOUNT.revenue : EXPENSE_ACCOUNT,
      type: "MANUAL",
      source: e.category.trim(),
      amount: Math.round(e.amount),
      note: e.note?.trim() || null,
      createdAt: e.date,
    })),
    skipDuplicates: true,
  });
  return res.count;
}

const SOURCE_LABEL: Record<string, string> = {
  PLAN: "Paket undangan",
  GUEST_ADDON: "Add-on tamu",
  AI_CREDIT: "Kredit AI",
  AGENCY_QUOTA: "Kuota agency",
  MARKETPLACE: "Fee marketplace",
  RENEWAL: "Perpanjangan",
};
const METHOD_LABEL: Record<string, string> = {
  MIDTRANS: "Midtrans",
  MANUAL_TRANSFER: "Transfer / QRIS manual",
};
const PLAN_LABEL: Record<string, string> = { HEMAT: "Hemat", PREMIUM: "Premium", EKSKLUSIF: "Eksklusif" };

const JKT_OFFSET = 7 * 3_600_000;
const jktDay = (d: Date) => new Date(d.getTime() + JKT_OFFSET).toISOString().slice(0, 10);
const jktMonth = (d: Date) => jktDay(d).slice(0, 7);
/** Monday of the Jakarta week, as YYYY-MM-DD. */
const jktWeek = (d: Date) => {
  const day = new Date(`${jktDay(d)}T00:00:00Z`);
  return new Date(day.getTime() - ((day.getUTCDay() + 6) % 7) * 86_400_000).toISOString().slice(0, 10);
};

function group<T>(rows: T[], key: (r: T) => string, value: (r: T) => number) {
  const m = new Map<string, { amount: number; count: number }>();
  for (const r of rows) {
    const k = key(r);
    const cur = m.get(k) ?? { amount: 0, count: 0 };
    cur.amount += value(r);
    cur.count += 1;
    m.set(k, cur);
  }
  return [...m.entries()].map(([label, v]) => ({ label, ...v })).sort((a, b) => b.amount - a.amount);
}

const pct = (cur: number, prev: number) => (prev === 0 ? (cur === 0 ? 0 : null) : ((cur - prev) / Math.abs(prev)) * 100);

/** Full report for [from, to) plus the same-length period before it for comparison. */
export async function getFinanceReport(from: Date, to: Date) {
  await backfillRevenue();
  const span = Math.max(1, to.getTime() - from.getTime());
  const prevFrom = new Date(from.getTime() - span);

  const platform = { in: [LEDGER_ACCOUNT.revenue, EXPENSE_ACCOUNT] };
  const [rows, prevRows, owed, paidOut, pendingOut, pendingPayments, recent] = await Promise.all([
    prisma.ledgerEntry.findMany({ where: { account: platform, createdAt: { gte: from, lt: to } }, orderBy: { createdAt: "asc" } }),
    prisma.ledgerEntry.findMany({ where: { account: platform, createdAt: { gte: prevFrom, lt: from } }, select: { account: true, amount: true, type: true } }),
    prisma.ledgerEntry.aggregate({ _sum: { amount: true }, where: { account: LEDGER_ACCOUNT.earnings } }),
    prisma.withdrawalRequest.aggregate({ _sum: { amount: true }, _count: true, where: { status: "PAID", processedAt: { gte: from, lt: to } } }),
    prisma.withdrawalRequest.aggregate({ _sum: { amount: true }, _count: true, where: { status: "PENDING" } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, _count: true, where: { status: "PENDING" } }),
    prisma.ledgerEntry.findMany({
      where: { account: platform, createdAt: { gte: from, lt: to } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { user: { select: { email: true } } },
    }),
  ]);

  const revenueRows = rows.filter((r) => r.account === LEDGER_ACCOUNT.revenue);
  const expenseRows = rows.filter((r) => r.account === EXPENSE_ACCOUNT);
  const paymentRows = revenueRows.filter((r) => r.type === "PAYMENT_RECEIVED");
  const sum = (rs: { amount: number }[]) => rs.reduce((n, r) => n + r.amount, 0);

  const revenue = sum(revenueRows);
  const expense = sum(expenseRows);
  const prevRevenue = sum(prevRows.filter((r) => r.account === LEDGER_ACCOUNT.revenue));
  const prevExpense = sum(prevRows.filter((r) => r.account === EXPENSE_ACCOUNT));
  const prevPayments = prevRows.filter((r) => r.type === "PAYMENT_RECEIVED").length;

  // Plan names for app payments
  const txIds = paymentRows.map((r) => r.transactionId).filter((x): x is string => Boolean(x));
  const txs = txIds.length ? await prisma.transaction.findMany({ where: { id: { in: txIds } }, select: { id: true, plan: true, kind: true, addonUnits: true } }) : [];
  const planOf = new Map(
    txs.map((t) => [
      t.id,
      t.kind === "GUEST_ADDON"
        ? "Add-on tamu"
        : t.kind === "AI_CREDIT"
          ? `Kredit AI (${t.addonUnits})`
          : t.kind === "AGENCY_QUOTA"
            ? `Kuota Mitra (${t.addonUnits})`
            : t.kind === "MARKETPLACE"
              ? "Fee template marketplace"
              : PLAN_LABEL[t.plan ?? ""] ?? t.plan ?? "Lainnya",
    ]),
  );

  // Time series: daily up to ~6 weeks, weekly up to ~6 months, monthly beyond
  const granularity = span > 190 * 86_400_000 ? ("month" as const) : span > 45 * 86_400_000 ? ("week" as const) : ("day" as const);
  const monthly = granularity === "month";
  const bucket = monthly ? jktMonth : granularity === "week" ? jktWeek : jktDay;
  const buckets: string[] = [];
  for (let t = new Date(from); t < to && buckets.length < 400; t = new Date(t.getTime() + (monthly ? 28 : 1) * 86_400_000)) {
    const b = bucket(t);
    if (buckets[buckets.length - 1] !== b) buckets.push(b);
  }
  const last = bucket(new Date(to.getTime() - 1));
  if (buckets[buckets.length - 1] !== last) buckets.push(last);
  const byBucket = new Map(buckets.map((b) => [b, { revenue: 0, expense: 0 }]));
  for (const r of rows) {
    const cell = byBucket.get(bucket(r.createdAt));
    if (!cell) continue;
    if (r.account === EXPENSE_ACCOUNT) cell.expense += r.amount;
    else cell.revenue += r.amount;
  }
  let running = 0;
  const series = buckets.map((b) => {
    const c = byBucket.get(b)!;
    running += c.revenue - c.expense;
    return { period: b, revenue: c.revenue, expense: c.expense, net: c.revenue - c.expense, cumulativeNet: running };
  });

  return {
    granularity,
    kpi: {
      revenue,
      revenueChange: pct(revenue, prevRevenue),
      expense,
      expenseChange: pct(expense, prevExpense),
      net: revenue - expense,
      netChange: pct(revenue - expense, prevRevenue - prevExpense),
      margin: revenue ? ((revenue - expense) / revenue) * 100 : null,
      payments: paymentRows.length,
      paymentsChange: pct(paymentRows.length, prevPayments),
      averageOrder: paymentRows.length ? Math.round(sum(paymentRows) / paymentRows.length) : 0,
      pendingPayments: { amount: pendingPayments._sum.amount ?? 0, count: pendingPayments._count },
      owedToUsers: owed._sum.amount ?? 0,
      withdrawalsPaid: { amount: paidOut._sum.amount ?? 0, count: paidOut._count },
      withdrawalsPending: { amount: pendingOut._sum.amount ?? 0, count: pendingOut._count },
    },
    series,
    bySource: group(revenueRows, (r) => (r.type === "MANUAL" ? `Manual: ${r.source ?? "Lainnya"}` : SOURCE_LABEL[r.source ?? ""] ?? r.source ?? "Lainnya"), (r) => r.amount),
    byPlan: group(paymentRows, (r) => planOf.get(r.transactionId ?? "") ?? "Lainnya", (r) => r.amount),
    byMethod: group(paymentRows, (r) => METHOD_LABEL[r.note ?? ""] ?? r.note ?? "Lainnya", (r) => r.amount),
    byExpenseCategory: group(expenseRows, (r) => r.source ?? "Lainnya", (r) => r.amount),
    recent: recent.map((r) => ({
      id: r.id,
      date: r.createdAt.toISOString(),
      kind: r.account === EXPENSE_ACCOUNT ? ("EXPENSE" as const) : ("INCOME" as const),
      manual: r.type === "MANUAL",
      label: r.type === "MANUAL" ? r.source ?? "Lainnya" : SOURCE_LABEL[r.source ?? ""] ?? r.source ?? "Pembayaran",
      note: r.type === "MANUAL" ? r.note : r.user?.email ?? null,
      amount: r.amount,
    })),
  };
}

export type FinanceReport = Awaited<ReturnType<typeof getFinanceReport>>;
