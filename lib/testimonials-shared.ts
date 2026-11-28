/** Client-safe testimonial constants (no Prisma import). */
export const TESTIMONIAL_MESSAGE_MIN = 20;
export const TESTIMONIAL_MESSAGE_MAX = 400;

export const TESTIMONIAL_STATUSES = [
  { id: "PENDING", label: "Menunggu" },
  { id: "APPROVED", label: "Tampil" },
  { id: "REJECTED", label: "Ditolak" },
] as const;

export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number]["id"];

export type TestimonialRow = {
  id: string;
  displayName: string;
  city: string | null;
  rating: number;
  message: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
};
