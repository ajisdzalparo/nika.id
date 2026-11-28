import { prisma } from "@/lib/prisma";
import { countCouples } from "@/lib/landing-stats";
import { cached } from "@/lib/memo-cache";

export { TESTIMONIAL_MESSAGE_MAX, TESTIMONIAL_MESSAGE_MIN } from "@/lib/testimonials-shared";

export type LandingTestimonial = {
  id: string;
  displayName: string;
  city: string | null;
  rating: number;
  message: string;
  /** Placeholder copy shown only while no real testimonial is approved; rendered with an "Contoh" label. */
  isSample: boolean;
};

/** Placeholder cards for the landing page until the first real testimonial is approved. */
export const SAMPLE_TESTIMONIALS: LandingTestimonial[] = [
  {
    id: "sample-1",
    displayName: "Dimas & Laras",
    city: "Yogyakarta",
    rating: 5,
    message:
      "Kami cuma menulis konsep adat Jawa yang kami mau, dan desainnya langsung terasa seperti dibuat desainer. Keluarga besar sampai menanyakan siapa yang membuatnya.",
    isSample: true,
  },
  {
    id: "sample-2",
    displayName: "Fajar & Anisa",
    city: "Semarang",
    rating: 5,
    message:
      "Rekap RSVP-nya rapi sekali. Kami jadi tahu jumlah tamu yang pasti datang jauh hari sebelum acara, jadi pesan katering tidak lagi kira-kira.",
    isSample: true,
  },
  {
    id: "sample-3",
    displayName: "Yoga & Citra",
    city: "Makassar",
    rating: 5,
    message:
      "Nama tiap tamu muncul di sampul undangan, jadi terasa personal. Mengubah jam acara setelah undangan tersebar juga tinggal sekali edit.",
    isSample: true,
  },
];

/** Below this many registered couples the landing shows no number at all, so a small count never reads as weak. */
export const USER_COUNT_MIN_TO_SHOW = 50;

/**
 * Landing data: approved testimonials (newest first) and the number of registered couples.
 * Sample cards are returned only when there is no approved testimonial yet, never mixed with real ones.
 */
export async function getLandingTestimonials(): Promise<{ items: LandingTestimonial[]; userCount: number }> {
  const [rows, userCount] = await Promise.all([
    // Cached 5 min; the admin approve/hide/delete routes clear "landing:testimonials" so changes show at once
    cached("landing:testimonials", 5 * 60_000, () =>
      prisma.testimonial.findMany({
        where: { status: "APPROVED" },
        orderBy: { approvedAt: "desc" },
        take: 6,
        select: { id: true, displayName: true, city: true, rating: true, message: true },
      }),
    ),
    countCouples(),
  ]);
  const items = rows.length ? rows.map((r) => ({ ...r, isSample: false })) : SAMPLE_TESTIMONIALS;
  return { items, userCount };
}
