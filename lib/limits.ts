export type PlanType = "FREE" | "SILVER" | "GOLD";

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
  allowedTemplateTypes: ("Gratis" | "Premium")[];
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    name: "Free",
    price: 0,
    maxGuests: 25,
    maxGalleryPhotos: 0,
    canUseMusic: false,
    canUseRSVP: false,
    canRemoveWatermark: false,
    canUseVideo: false,
    canUseDigitalGift: false,
    canUseLoveStory: false,
    activeDays: 7,
    allowedTemplateTypes: ["Gratis"],
  },
  SILVER: {
    name: "Silver",
    price: 99000,
    maxGuests: 100,
    maxGalleryPhotos: 10,
    canUseMusic: true,
    canUseRSVP: true,
    canRemoveWatermark: false,
    canUseVideo: false,
    canUseDigitalGift: false,
    canUseLoveStory: false,
    activeDays: 90, // 3 months
    allowedTemplateTypes: ["Gratis", "Premium"],
  },
  GOLD: {
    name: "Gold",
    price: 199000,
    maxGuests: Infinity,
    maxGalleryPhotos: Infinity,
    canUseMusic: true,
    canUseRSVP: true,
    canRemoveWatermark: true,
    canUseVideo: true,
    canUseDigitalGift: true,
    canUseLoveStory: true,
    activeDays: null, // Forever
    allowedTemplateTypes: ["Gratis", "Premium"],
  },
};

export function getPlanLimits(plan: PlanType) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
}

export function isFeatureEnabled(plan: PlanType, feature: keyof PlanLimits) {
  const limits = getPlanLimits(plan);
  const value = limits[feature];
  return value === true;
}
