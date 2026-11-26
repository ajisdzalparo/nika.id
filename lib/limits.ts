export type PlanType = "FREE" | "HEMAT" | "PREMIUM" | "EKSKLUSIF";

export interface PlanLimits {
  name: string;
  price: number;
  maxGuests: number;
  maxGalleryPhotos: number;
  canUseMusic: boolean;
  canUseRSVP: boolean;
  canRemoveWatermark: boolean;
  canUseVideo: boolean;
  canUseDigitalGift: boolean;
  canUseLoveStory: boolean;
  activeDays: number | null; // null = forever
  aiDesignQuota: number; // number of AI theme generations included in the plan
  allowedTemplateTypes: ("Gratis" | "Premium")[];
}

export const GUEST_ADDON_PRICE = 15000;
/** Extends a paid invitation's active period by RENEWAL_DAYS (from its current expiry, or today if expired). */
export const RENEWAL_PRICE = 25000;
export const RENEWAL_DAYS = 365;
export const GUEST_ADDON_SIZE = 100;
export const PAID_PLANS: PlanType[] = ["HEMAT", "PREMIUM", "EKSKLUSIF"];

/** Unpaid preview invitations allowed per account (pricing is per invitation; drafts can't be shared). */
export const MAX_FREE_DRAFTS = 3;
export const MAX_FREE_DRAFTS_AGENCY = 15;

export const AI_CREDIT_COST_STANDARD = 1;
export const AI_CREDIT_COST_REFERENCE = 2;

export type AiCreditPackId = "AI_10" | "AI_30" | "AI_100";

export interface AiCreditPack {
  id: AiCreditPackId;
  credits: number;
  price: number;
  label: string;
  tagline: string;
  popular?: boolean;
}

export const AI_CREDIT_PACKS: readonly AiCreditPack[] = [
  { id: "AI_10", credits: 10, price: 29000, label: "10 Kredit AI", tagline: "Cocok untuk eksplor beberapa gaya" },
  // Model cost ≈ Rp1.800/generate (docs/ROADMAP-BISNIS.md); keep every pack ≥ ~Rp2.290/credit.
  { id: "AI_30", credits: 30, price: 75000, label: "30 Kredit AI", tagline: "Hemat 14% · Favorit untuk revisi & referensi", popular: true },
  { id: "AI_100", credits: 100, price: 229000, label: "100 Kredit AI", tagline: "Hemat 21% · Untuk banyak acara & inspirasi" },
] as const;

export function getAiCreditPack(packId: string | null | undefined): AiCreditPack | undefined {
  return AI_CREDIT_PACKS.find((p) => p.id === packId);
}

export type AgencyPackId = "AGENCY_10" | "AGENCY_30" | "AGENCY_100";

export interface AgencyPack {
  id: AgencyPackId;
  quota: number;
  price: number;
  label: string;
  tagline: string;
  bonusAiCredits: number;
  features: string[];
  popular?: boolean;
}

export const AGENCY_QUOTA_VALID_DAYS = 365;

export const AGENCY_PACKS: readonly AgencyPack[] = [
  {
    id: "AGENCY_10",
    quota: 10,
    price: 299000,
    label: "Mitra 10",
    tagline: "Rp 29,9rb / undangan · Mulai kelola klien",
    bonusAiCredits: 0,
    features: ["10 kuota undangan setara Premium", "Link isi data klien tanpa login", "Branding nama usaha di footer", "Berlaku 12 bulan"],
  },
  {
    id: "AGENCY_30",
    quota: 30,
    price: 749000,
    label: "Mitra 30",
    tagline: "Rp 25rb / undangan · +50 Kredit AI",
    bonusAiCredits: 50,
    popular: true,
    features: ["30 kuota undangan setara Premium", "Bonus 50 Kredit Desain AI", "Link isi data klien & branding footer", "Berlaku 12 bulan"],
  },
  {
    id: "AGENCY_100",
    quota: 100,
    price: 1990000,
    label: "Mitra 100",
    tagline: "Rp 19,9rb / undangan · +150 Kredit AI",
    bonusAiCredits: 150,
    features: ["100 kuota undangan setara Premium", "Bonus 150 Kredit Desain AI", "Prioritas & white-label agency", "Berlaku 12 bulan"],
  },
] as const;

export function getAgencyPack(packId: string | null | undefined): AgencyPack | undefined {
  return AGENCY_PACKS.find((p) => p.id === packId);
}

export function getAgencyPackByQuota(quota: number): AgencyPack | undefined {
  return AGENCY_PACKS.find((p) => p.quota === quota);
}

export function getUsableAgencyQuota(
  user: { agencyQuota: number; agencyQuotaExpiresAt: Date | null; accountType?: string | null } | null | undefined,
): number {
  // Quota is only usable by an admin-approved mitra (accountType AGENCY)
  if (!user || user.agencyQuota <= 0 || (user.accountType !== undefined && user.accountType !== "AGENCY")) return 0;
  if (user.agencyQuotaExpiresAt && user.agencyQuotaExpiresAt.getTime() <= Date.now()) return 0;
  return user.agencyQuota;
}

export const REFERRAL_DISCOUNT_RATE = 0.1;
export const REFERRAL_MAX_DISCOUNT = 15000;
/** Hold period for wallet earnings (marketplace sales; commissions booked before referral became discount-only). */
export const REFERRAL_HOLD_DAYS = 7;
/** A mitra earns 1 free invitation (Premium-equivalent quota) for every N clients who buy a plan with their code. */
export const MITRA_BONUS_EVERY = 3;

export function computeReferralDiscount(basePrice: number): number {
  if (basePrice <= 1000) return 0;
  const raw = Math.min(Math.floor(basePrice * REFERRAL_DISCOUNT_RATE), REFERRAL_MAX_DISCOUNT);
  return Math.max(0, Math.min(raw, basePrice - 1000));
}

export const MARKETPLACE_MIN_PRICE = 15000;
export const MARKETPLACE_MAX_PRICE = 199000;
export const DEFAULT_MARKETPLACE_FEE_PCT = 30;

const PLAN_ORDER: Record<PlanType, number> = {
  FREE: 0,
  HEMAT: 1,
  PREMIUM: 2,
  EKSKLUSIF: 3,
};

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  // Unpaid accounts stay in draft/preview mode until they pick a paid plan
  FREE: {
    name: "Pratinjau",
    price: 0,
    maxGuests: 100,
    maxGalleryPhotos: 10,
    canUseMusic: true,
    canUseRSVP: true,
    canRemoveWatermark: false,
    canUseVideo: true,
    canUseDigitalGift: true,
    canUseLoveStory: true,
    activeDays: null,
    aiDesignQuota: 1,
    allowedTemplateTypes: ["Gratis", "Premium"],
  },
  HEMAT: {
    name: "Hemat",
    price: 49000,
    maxGuests: 100,
    maxGalleryPhotos: 10,
    canUseMusic: true,
    canUseRSVP: true,
    canRemoveWatermark: false,
    canUseVideo: false,
    canUseDigitalGift: true,
    canUseLoveStory: false,
    activeDays: 90,
    aiDesignQuota: 1,
    // Every paid plan opens the whole catalog: plans differ by features, not by design
    allowedTemplateTypes: ["Gratis", "Premium"],
  },
  PREMIUM: {
    name: "Premium",
    price: 129000,
    maxGuests: 300,
    maxGalleryPhotos: 20,
    canUseMusic: true,
    canUseRSVP: true,
    canRemoveWatermark: false,
    canUseVideo: false,
    canUseDigitalGift: true,
    canUseLoveStory: true,
    activeDays: 180,
    aiDesignQuota: 5,
    allowedTemplateTypes: ["Gratis", "Premium"],
  },
  EKSKLUSIF: {
    name: "Eksklusif",
    price: 159000,
    maxGuests: Infinity,
    maxGalleryPhotos: Infinity,
    canUseMusic: true,
    canUseRSVP: true,
    canRemoveWatermark: true,
    canUseVideo: true,
    canUseDigitalGift: true,
    canUseLoveStory: true,
    // One-time payment can't fund unlimited storage forever; existing buyers keep their null expiry.
    activeDays: 365,
    aiDesignQuota: 10,
    allowedTemplateTypes: ["Gratis", "Premium"],
  },
};

export function getPlanLimits(plan: PlanType | string | null | undefined) {
  if (plan && plan in PLAN_LIMITS) return PLAN_LIMITS[plan as PlanType];
  return PLAN_LIMITS.FREE;
}

export function isFeatureEnabled(plan: PlanType | string | null | undefined, feature: keyof PlanLimits) {
  const limits = getPlanLimits(plan);
  return limits[feature] === true;
}

/** Prices of the paid plans. The admin can change them (SystemSetting "plan_prices"); PLAN_LIMITS holds the defaults. */
export type PaidPlan = "HEMAT" | "PREMIUM" | "EKSKLUSIF";
export type PlanPrices = Record<PaidPlan, number>;

export const DEFAULT_PLAN_PRICES: PlanPrices = {
  HEMAT: PLAN_LIMITS.HEMAT.price,
  PREMIUM: PLAN_LIMITS.PREMIUM.price,
  EKSKLUSIF: PLAN_LIMITS.EKSKLUSIF.price,
};

export function planPrice(plan: PlanType, prices: PlanPrices = DEFAULT_PLAN_PRICES): number {
  return plan === "FREE" ? 0 : prices[plan];
}

/** Returns the amount to pay when upgrading from `currentPlan` to `targetPlan` (paying only the difference), or `null` if not an upgrade. */
export function getUpgradePrice(
  currentPlan: PlanType | string | null | undefined,
  targetPlan: PlanType,
  prices: PlanPrices = DEFAULT_PLAN_PRICES,
): number | null {
  if (targetPlan === "FREE") return null;
  const cur: PlanType = currentPlan && currentPlan in PLAN_LIMITS ? (currentPlan as PlanType) : "FREE";
  if (PLAN_ORDER[targetPlan] <= PLAN_ORDER[cur]) return null;
  if (cur === "FREE") return planPrice(targetPlan, prices);
  return Math.max(0, planPrice(targetPlan, prices) - planPrice(cur, prices));
}

export function getMaxGuests(plan: PlanType | string | null | undefined, extraGuestQuota = 0) {
  const base = getPlanLimits(plan).maxGuests;
  if (base === Infinity) return Infinity;
  return base + Math.max(0, extraGuestQuota);
}
