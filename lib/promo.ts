import type { Prisma, PromoCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computePromoDiscount, promoAppliesToKind, sanitizePromoCode, type PromoCheckoutKind } from "@/lib/promo-shared";

export { sanitizePromoCode, computePromoDiscount } from "@/lib/promo-shared";
export type { PromoCheckoutKind } from "@/lib/promo-shared";

export type PromoResolution =
  | { found: false }
  | { found: true; valid: false; reason: string }
  | { found: true; valid: true; promo: PromoCode; discount: number };

/** Looks up an admin promo code and checks every rule for this buyer and order. `found: false` means "not a promo code". */
export async function resolvePromoCode(
  rawCode: string,
  input: { userId: string; kind: PromoCheckoutKind; basePrice: number },
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<PromoResolution> {
  const code = sanitizePromoCode(rawCode);
  if (!code) return { found: false };
  const promo = await client.promoCode.findUnique({ where: { code } });
  if (!promo) return { found: false };

  const now = Date.now();
  if (!promo.isActive) return { found: true, valid: false, reason: "Kode promo ini sudah tidak aktif." };
  if (promo.startsAt && promo.startsAt.getTime() > now) return { found: true, valid: false, reason: "Kode promo ini belum berlaku." };
  if (promo.expiresAt && promo.expiresAt.getTime() <= now) return { found: true, valid: false, reason: "Kode promo ini sudah kedaluwarsa." };
  if (!promoAppliesToKind(promo, input.kind)) return { found: true, valid: false, reason: "Kode promo ini tidak berlaku untuk pembelian ini." };
  if (input.basePrice < promo.minPurchase) {
    return { found: true, valid: false, reason: `Kode promo ini berlaku untuk pembelian minimal Rp${promo.minPurchase.toLocaleString("id-ID")}.` };
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return { found: true, valid: false, reason: "Kuota kode promo ini sudah habis." };

  // Only paid orders count: the payment routes validate before they cancel and replace the buyer's open
  // order, so counting PENDING here would reject a buyer who merely switches payment method.
  const usedByUser = await client.transaction.count({ where: { userId: input.userId, promoCodeUsed: code, status: "SUCCESS" } });
  if (usedByUser >= promo.perUserLimit) return { found: true, valid: false, reason: "Kamu sudah memakai kode promo ini." };

  const discount = computePromoDiscount(promo, input.basePrice);
  if (discount <= 0) return { found: true, valid: false, reason: "Kode promo ini tidak memberi potongan untuk pembelian ini." };
  return { found: true, valid: true, promo, discount };
}
