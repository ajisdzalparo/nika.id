/** Mitra application options, shared by the forms (browser) and the APIs (server). */
export const APPLICANT_TYPES = ["USAHA", "PERORANGAN"] as const;
export type ApplicantType = (typeof APPLICANT_TYPES)[number];

export const APPLICANT_TYPE_LABEL: Record<ApplicantType, string> = {
  USAHA: "Punya usaha",
  PERORANGAN: "Perorangan / reseller",
};

export const BUSINESS_KINDS = ["WO", "MUA", "FOTO", "PERCETAKAN", "LAINNYA"] as const;
export type BusinessKind = (typeof BUSINESS_KINDS)[number];

export const BUSINESS_KIND_LABEL: Record<BusinessKind, string> = {
  WO: "Wedding organizer",
  MUA: "MUA / perias",
  FOTO: "Foto / video studio",
  PERCETAKAN: "Percetakan / undangan cetak",
  LAINNYA: "Lainnya",
};

export const APPLICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};
