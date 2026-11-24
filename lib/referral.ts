import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { LEDGER_ACCOUNT } from "@/lib/ledger";
import { computeReferralDiscount } from "@/lib/limits";

export const REFERRAL_COOKIE = "uy_ref";

const RESERVED_CODES = new Set(["ADMIN", "SYSTEM", "FREE", "HEMAT", "PREMIUM", "EKSKLUSIF", "MITRA", "UNDANGIN"]);

export function sanitizeReferralCode(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16);
}

function generateCandidateCode(name?: string | null): string {
  const prefix =
    (name || "MITRA")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4) || "YUK";
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}${suffix}`.slice(0, 10);
}

/** Ensures the user has a unique referral code and returns it. */
export async function ensureUserReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, name: true },
  });
  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.referralCode) return user.referralCode;

  for (let i = 0; i < 8; i++) {
    const candidate = generateCandidateCode(user.name);
    if (RESERVED_CODES.has(candidate)) continue;
    const clash = await prisma.user.findUnique({ where: { referralCode: candidate }, select: { id: true } });
    if (clash) continue;
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: candidate },
        select: { referralCode: true },
      });
      if (updated.referralCode) return updated.referralCode;
    } catch {
      // Retry on race condition
    }
  }
  const fallback = `UY${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  await prisma.user.update({ where: { id: userId }, data: { referralCode: fallback } });
  return fallback;
}

export async function updateUserReferralCode(userId: string, rawCode: string): Promise<{ ok: true; code: string } | { ok: false; message: string }> {
  const clean = sanitizeReferralCode(rawCode);
  if (clean.length < 4 || clean.length > 16) {
    return { ok: false, message: "Kode referral harus 4–16 karakter huruf atau angka." };
  }
  if (RESERVED_CODES.has(clean)) {
    return { ok: false, message: "Kode tersebut tidak tersedia, silakan pilih kode lain." };
  }
  const existing = await prisma.user.findUnique({ where: { referralCode: clean }, select: { id: true } });
  if (existing && existing.id !== userId) {
    return { ok: false, message: "Kode referral ini sudah dipakai akun lain." };
  }
  await prisma.user.update({ where: { id: userId }, data: { referralCode: clean } });
  return { ok: true, code: clean };
}

export interface ReferralResolution {
  valid: boolean;
  code: string | null;
  referrerId: string | null;
  referrerName: string | null;
  reason?: string;
}

/**
 * Validates whether `buyerId` can apply `rawCode` (or their already-linked `referredById` code)
 * for the first-time 10% referral discount.
 */
export async function resolveReferralForBuyer(input: {
  buyerId: string;
  buyerEmail?: string | null;
  rawCode?: string | null;
}): Promise<ReferralResolution> {
  const [buyer, priorUsed] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.buyerId },
      select: {
        id: true,
        email: true,
        referredBy: { select: { id: true, name: true, email: true, referralCode: true } },
      },
    }),
    prisma.transaction.findFirst({
      where: { userId: input.buyerId, status: "SUCCESS", referralCodeUsed: { not: null } },
      select: { id: true },
    }),
  ]);

  if (!buyer) return { valid: false, code: null, referrerId: null, referrerName: null, reason: "Akun tidak ditemukan." };
  if (priorUsed) {
    return { valid: false, code: null, referrerId: null, referrerName: null, reason: "Diskon referral hanya berlaku 1× pada transaksi pertama." };
  }

  const clean = sanitizeReferralCode(input.rawCode);
  if (clean) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: clean },
      select: { id: true, name: true, email: true, referralCode: true },
    });
    if (!referrer) {
      return { valid: false, code: clean, referrerId: null, referrerName: null, reason: "Kode referral tidak ditemukan." };
    }
    if (referrer.id === buyer.id || referrer.email.toLowerCase() === (input.buyerEmail ?? buyer.email).toLowerCase()) {
      return { valid: false, code: clean, referrerId: null, referrerName: null, reason: "Tidak dapat menggunakan kode referral milik sendiri." };
    }
    return {
      valid: true,
      code: referrer.referralCode ?? clean,
      referrerId: referrer.id,
      referrerName: referrer.name || "Mitra UNDANGIN YUK",
    };
  }

  if (buyer.referredBy?.referralCode && buyer.referredBy.id !== buyer.id) {
    return {
      valid: true,
      code: buyer.referredBy.referralCode,
      referrerId: buyer.referredBy.id,
      referrerName: buyer.referredBy.name || "Mitra UNDANGIN YUK",
    };
  }

  return { valid: false, code: null, referrerId: null, referrerName: null };
}

/** Automatically links a newly signed-in/registered user to their referrer cookie if unset. */
export async function bindUserReferrerFromCode(userId: string, rawCode: string | null | undefined) {
  const clean = sanitizeReferralCode(rawCode);
  if (!clean || clean.length < 3) return;
  const [user, referrer] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, referredById: true } }),
    prisma.user.findUnique({ where: { referralCode: clean }, select: { id: true, email: true } }),
  ]);
  if (!user || user.referredById || !referrer) return;
  if (referrer.id === user.id || referrer.email.toLowerCase() === user.email.toLowerCase()) return;

  await prisma.user.updateMany({
    where: { id: user.id, referredById: null },
    data: { referredById: referrer.id },
  });
}

export async function getUserReferralSummary(userId: string) {
  const code = await ensureUserReferralCode(userId);
  const [signups, commissionRows, totalCommissionAgg] = await Promise.all([
    prisma.user.count({ where: { referredById: userId } }),
    prisma.ledgerEntry.findMany({
      where: { userId, account: LEDGER_ACCOUNT.earnings, type: "COMMISSION" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, amount: true, source: true, availableAt: true, note: true, createdAt: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: { userId, account: LEDGER_ACCOUNT.earnings, type: "COMMISSION" },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    code,
    signups,
    conversions: totalCommissionAgg._count,
    totalCommission: totalCommissionAgg._sum.amount ?? 0,
    recentCommissions: commissionRows.map((c) => ({
      ...c,
      availableAt: c.availableAt ? c.availableAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

export { computeReferralDiscount };
