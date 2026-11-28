import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/memo-cache";

export type LandingStat = { id: string; value: number; label: string };

/** Real platform totals for the landing stats band, always shown. */
const STATS = [
  { id: "couples", label: "Pasangan sudah mendaftar untuk menyiapkan undangan pernikahan mereka" },
  { id: "invitations", label: "Undangan pernikahan sudah dirancang dan dibagikan lewat SatuMoment" },
  { id: "guests", label: "Tamu menerima undangan dengan nama mereka sendiri di sampulnya" },
  { id: "wishes", label: "Ucapan dan doa terkirim untuk para pengantin lewat buku tamu digital" },
] as const;

const LANDING_TTL_MS = 5 * 60_000;

/** Registered couples: everyone except admins and the client logins a Mitra creates for its customers. Cached 5 min. */
export function countCouples() {
  return cached("landing:couples", LANDING_TTL_MS, () =>
    prisma.user.count({ where: { role: { not: "admin" }, accountType: { not: "CLIENT" } } }),
  );
}

/** Totals for the landing band. Cached 5 minutes: the landing is public and these are full-table counts. */
export async function getLandingStats(): Promise<LandingStat[]> {
  const [couples, invitations, guests, wishes] = await Promise.all([
    countCouples(),
    cached("landing:invitations", LANDING_TTL_MS, () => prisma.invitation.count()),
    cached("landing:guests", LANDING_TTL_MS, () => prisma.guest.count()),
    cached("landing:wishes", LANDING_TTL_MS, () => prisma.guestMessage.count()),
  ]);
  const values: Record<(typeof STATS)[number]["id"], number> = { couples, invitations, guests, wishes };
  return STATS.map((s) => ({ id: s.id, value: values[s.id], label: s.label }));
}
