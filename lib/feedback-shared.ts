// Client-safe options for the user feedback form (/masukan) and the admin inbox (/admin/masukan).

export const FEEDBACK_CATEGORIES = [
  { id: "SARAN", label: "Saran perbaikan", hint: "Fitur sudah ada, tapi bisa lebih baik" },
  { id: "MASALAH", label: "Ada masalah", hint: "Error, tidak jalan, atau membingungkan" },
  { id: "FITUR_BARU", label: "Ide fitur baru", hint: "Sesuatu yang belum ada" },
  { id: "PUJIAN", label: "Yang sudah bagus", hint: "Biar kami pertahankan" },
] as const;

export const FEEDBACK_FEATURES = [
  { id: "EDITOR", label: "Editor undangan" },
  { id: "DESAIN", label: "Desain AI, kanvas & template" },
  { id: "TAMU", label: "Daftar tamu & kirim WA" },
  { id: "RSVP", label: "RSVP & ucapan" },
  { id: "PEMBAYARAN", label: "Paket & pembayaran" },
  { id: "MITRA", label: "Mitra / agency" },
  { id: "DOMPET", label: "Dompet & referral" },
  { id: "LAINNYA", label: "Lainnya" },
] as const;

export const FEEDBACK_STATUSES = [
  { id: "BARU", label: "Baru" },
  { id: "DITINJAU", label: "Sedang ditinjau" },
  { id: "DIRENCANAKAN", label: "Direncanakan" },
  { id: "SELESAI", label: "Sudah diterapkan" },
  { id: "DITOLAK", label: "Belum bisa diterapkan" },
] as const;

export const RATING_LABELS = ["", "Sangat kurang", "Kurang", "Cukup", "Bagus", "Sangat bagus"] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]["id"];
export type FeedbackFeature = (typeof FEEDBACK_FEATURES)[number]["id"];
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]["id"];

export const FEEDBACK_MESSAGE_MIN = 10;
export const FEEDBACK_MESSAGE_MAX = 2000;

export function labelOf<T extends readonly { id: string; label: string }[]>(list: T, id: string | null | undefined): string {
  return list.find((x) => x.id === id)?.label ?? id ?? "-";
}

export interface FeedbackItem {
  id: string;
  category: string;
  feature: string;
  rating: number | null;
  message: string;
  pagePath: string | null;
  status: string;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}
