/** Options for the marketplace interest survey, shared by the card (browser) and the API (server). */
export const INTEREST_ROLES = ["BELI", "JUAL", "KEDUANYA", "TIDAK"] as const;
export type InterestRole = (typeof INTEREST_ROLES)[number];

export const INTEREST_ROLE_LABEL: Record<InterestRole, string> = {
  BELI: "Ingin membeli template kreator",
  JUAL: "Ingin menjual desain saya",
  KEDUANYA: "Keduanya",
  TIDAK: "Belum tertarik",
};

export const PRICE_BANDS = ["UNDER_25", "25_50", "50_100", "OVER_100"] as const;
export type PriceBand = (typeof PRICE_BANDS)[number];

export const PRICE_BAND_LABEL: Record<PriceBand, string> = {
  UNDER_25: "< Rp25rb",
  "25_50": "Rp25–50rb",
  "50_100": "Rp50–100rb",
  OVER_100: "> Rp100rb",
};
