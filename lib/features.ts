/**
 * User-facing features the admin can switch between Active / Maintenance / Coming soon
 * (Admin › Pengaturan › Status fitur). Safe to import on the client: data only.
 *
 * Adding a feature: append an entry here (give it `defaultStatus: "COMING_SOON"` until it ships),
 * wrap its page folder with `<FeatureGate feature="…">` in a layout.tsx, and call
 * `featureBlockedResponse("…")` at the top of its write API handlers.
 */

export const FEATURE_STATUSES = ["ACTIVE", "MAINTENANCE", "COMING_SOON"] as const;
export type FeatureStatus = (typeof FEATURE_STATUSES)[number];

export const FEATURE_STATUS_LABEL: Record<FeatureStatus, string> = {
  ACTIVE: "Aktif",
  MAINTENANCE: "Maintenance",
  COMING_SOON: "Segera hadir",
};

/** Short badge text for navigation (nothing for active features) */
export const FEATURE_STATUS_BADGE: Record<FeatureStatus, string | null> = {
  ACTIVE: null,
  MAINTENANCE: "Perbaikan",
  COMING_SOON: "Segera",
};

export interface FeatureDefinition {
  id: string;
  label: string;
  description: string;
  /** User pages owned by this feature (prefix match, sub-pages included) */
  paths: string[];
  defaultStatus: FeatureStatus;
}

export const FEATURES = [
  {
    id: "DESAIN_AI",
    label: "Desain AI",
    description: "Membuat tema undangan dengan AI.",
    paths: ["/desain-ai"],
    defaultStatus: "ACTIVE",
  },
  {
    id: "KANVAS",
    label: "Kanvas Desain",
    description: "Mendesain undangan bebas di kanvas, termasuk ornamen AI.",
    paths: ["/kanvas"],
    defaultStatus: "ACTIVE",
  },
  {
    id: "KATALOG",
    label: "Koleksi Template",
    description: "Memilih dan memakai template dari katalog.",
    paths: ["/pilih-template"],
    defaultStatus: "ACTIVE",
  },
  {
    id: "MARKETPLACE",
    label: "Marketplace Template Kreator",
    description: "User menjual desain sebagai template dan membeli template kreator. Saat Segera hadir, user mengisi survei minat.",
    paths: [],
    defaultStatus: "COMING_SOON",
  },
  {
    id: "DAFTAR_TAMU",
    label: "Daftar Tamu",
    description: "Halaman pengelolaan daftar tamu.",
    paths: ["/manajemen-tamu"],
    defaultStatus: "ACTIVE",
  },
  {
    id: "WA_BLAST",
    label: "WA Blast",
    description: "Kirim undangan massal lewat WhatsApp.",
    paths: ["/wa-blast"],
    defaultStatus: "COMING_SOON",
  },
  {
    id: "RSVP",
    label: "RSVP & Ucapan",
    description: "Halaman rekap RSVP dan ucapan tamu.",
    paths: ["/buku-tamu"],
    defaultStatus: "ACTIVE",
  },
  {
    id: "CHECK_IN",
    label: "Check-in Tamu",
    description: "Scan QR dan check-in tamu di lokasi acara.",
    paths: ["/check-in"],
    defaultStatus: "ACTIVE",
  },
  {
    id: "MITRA",
    label: "Mitra / Agency",
    description: "Fitur untuk wedding organizer dan agency.",
    paths: ["/mitra"],
    defaultStatus: "ACTIVE",
  },
  {
    id: "DOMPET",
    label: "Dompet & Referral",
    description: "Saldo, referral, dan penarikan dana.",
    paths: ["/dompet"],
    defaultStatus: "ACTIVE",
  },
  {
    id: "MASUKAN",
    label: "Kirim Masukan",
    description: "Form masukan dari user ke tim.",
    paths: ["/masukan"],
    defaultStatus: "ACTIVE",
  },
] as const satisfies readonly FeatureDefinition[];

export type FeatureId = (typeof FEATURES)[number]["id"];
export type FeatureStatusMap = Record<FeatureId, FeatureStatus>;

export const FEATURE_IDS = FEATURES.map((f) => f.id) as FeatureId[];

export function isFeatureId(value: string): value is FeatureId {
  return (FEATURE_IDS as string[]).includes(value);
}

export function getFeature(id: FeatureId): FeatureDefinition {
  return FEATURES.find((f) => f.id === id)!;
}

/** Feature that owns a user page, if any */
export function featureForPath(pathname: string): FeatureId | null {
  for (const f of FEATURES as readonly FeatureDefinition[]) {
    if (f.paths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return f.id as FeatureId;
  }
  return null;
}

export function defaultFeatureStatuses(): FeatureStatusMap {
  return Object.fromEntries(FEATURES.map((f) => [f.id, f.defaultStatus])) as FeatureStatusMap;
}
