// Client-safe promo helpers (no database access) shared by checkout UI and server.

export type PromoCheckoutKind = "PLAN" | "GUEST_ADDON" | "AI_CREDIT" | "AGENCY_QUOTA" | "MARKETPLACE" | "RENEWAL";

export const PROMO_KIND_LABELS: Record<Exclude<PromoCheckoutKind, "MARKETPLACE">, string> = {
  PLAN: "Paket undangan",
  GUEST_ADDON: "Tambah tamu",
  AI_CREDIT: "Kredit AI",
  AGENCY_QUOTA: "Paket Mitra",
  RENEWAL: "Perpanjangan",
};

export interface PromoRule {
  percentOff: number | null;
  amountOff: number | null;
  maxDiscount: number | null;
  appliesTo: string;
  minPurchase: number;
}

export function sanitizePromoCode(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 24) : "";
}

export function promoAppliesToKind(promo: Pick<PromoRule, "appliesTo">, kind: PromoCheckoutKind) {
  if (kind === "MARKETPLACE") return false; // creator royalties stay exact
  if (promo.appliesTo === "ALL") return true;
  return promo.appliesTo.split(",").map((k) => k.trim()).includes(kind);
}

export function computePromoDiscount(promo: Pick<PromoRule, "percentOff" | "amountOff" | "maxDiscount">, basePrice: number): number {
  let discount = 0;
  if (promo.percentOff) discount = Math.floor((basePrice * promo.percentOff) / 100);
  else if (promo.amountOff) discount = promo.amountOff;
  if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
  // 100% (e.g. a mitra trial code) makes the order free: it is activated without the payment gateway
  if (discount >= basePrice) return basePrice;
  // Otherwise never below Rp1.000 so the payment gateway still accepts the order
  return Math.max(0, Math.min(discount, basePrice - 1000));
}

/** Short human description, e.g. "Diskon 20% · Paket Mitra". */
export function describePromo(promo: PromoRule): string {
  const off = promo.percentOff
    ? `Diskon ${promo.percentOff}%${promo.maxDiscount ? ` (maks Rp${promo.maxDiscount.toLocaleString("id-ID")})` : ""}`
    : `Potongan Rp${(promo.amountOff ?? 0).toLocaleString("id-ID")}`;
  const scope =
    promo.appliesTo === "ALL"
      ? "semua pembelian"
      : promo.appliesTo
          .split(",")
          .map((k) => PROMO_KIND_LABELS[k.trim() as keyof typeof PROMO_KIND_LABELS] ?? k)
          .join(", ");
  return `${off} · ${scope}`;
}
