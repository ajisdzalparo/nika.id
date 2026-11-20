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
export const GUEST_ADDON_SIZE = 100;
export const PAID_PLANS: PlanType[] = ["HEMAT", "PREMIUM", "EKSKLUSIF"];

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
    allowedTemplateTypes: ["Gratis"],
  },
  PREMIUM: {
    name: "Premium",
    price: 79000,
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
    price: 99000,
    maxGuests: Infinity,
    maxGalleryPhotos: Infinity,
    canUseMusic: true,
    canUseRSVP: true,
    canRemoveWatermark: true,
    canUseVideo: true,
    canUseDigitalGift: true,
    canUseLoveStory: true,
    activeDays: null,
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

/** Returns the amount to pay when upgrading from `currentPlan` to `targetPlan` (paying only the difference), or `null` if not an upgrade. */
export function getUpgradePrice(currentPlan: PlanType | string | null | undefined, targetPlan: PlanType): number | null {
  if (targetPlan === "FREE") return null;
  const cur: PlanType = currentPlan && currentPlan in PLAN_LIMITS ? (currentPlan as PlanType) : "FREE";
  if (PLAN_ORDER[targetPlan] <= PLAN_ORDER[cur]) return null;
  if (cur === "FREE") return PLAN_LIMITS[targetPlan].price;
  return Math.max(0, PLAN_LIMITS[targetPlan].price - PLAN_LIMITS[cur].price);
}

export function getMaxGuests(plan: PlanType | string | null | undefined, extraGuestQuota = 0) {
  const base = getPlanLimits(plan).maxGuests;
  if (base === Infinity) return Infinity;
  return base + Math.max(0, extraGuestQuota);
}
