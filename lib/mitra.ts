import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
import { createNotification } from "@/lib/notifications";

/** Admin grants mitra status (accountType AGENCY; users can't make themselves one), optionally filling the business profile from an application. */
export async function grantMitra(
  userId: string,
  profile?: { agencyName?: string | null; agencyWhatsapp?: string | null; agencyInstagram?: string | null },
) {
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { agencyName: true, agencyWhatsapp: true, agencyInstagram: true },
  });
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      accountType: "AGENCY",
      agencyVerified: true,
      // Keep what the user already set; fill gaps from the application
      agencyName: current?.agencyName || profile?.agencyName || null,
      agencyWhatsapp: current?.agencyWhatsapp || profile?.agencyWhatsapp || null,
      agencyInstagram: current?.agencyInstagram || profile?.agencyInstagram || null,
    },
  });
  await notifyMitraGranted(userId);
  return user;
}

/**
 * What one quota cost this mitra on average (paid quota packs ÷ units bought), used as the "modal"
 * of an invitation activated with quota in the sales report. Bonus quota lowers the real cost; this is an estimate.
 */
export async function mitraQuotaUnitCost(userId: string, client: Pick<typeof prisma, "transaction"> = prisma): Promise<number> {
  const agg = await client.transaction.aggregate({
    where: { userId, kind: "AGENCY_QUOTA", status: "SUCCESS" },
    _sum: { amount: true, addonUnits: true },
  });
  const units = agg._sum.addonUnits ?? 0;
  return units > 0 ? Math.round((agg._sum.amount ?? 0) / units) : 0;
}

/**
 * Free trial for a new mitra: a 100% promo code on invitation plans, only for their account,
 * limited to `invites` uses and `days` days. Returns the code.
 */
export async function createMitraTrialCode(userId: string, invites: number, days: number) {
  const expiresAt = new Date(Date.now() + days * 86_400_000);
  for (let i = 0; i < 5; i++) {
    const code = `TRIAL${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    try {
      await prisma.promoCode.create({
        data: {
          code,
          description: `Uji coba Mitra · ${invites} undangan gratis (${days} hari)`,
          percentOff: 100,
          appliesTo: "PLAN",
          maxUses: invites,
          perUserLimit: invites,
          expiresAt,
          forUserId: userId,
        },
      });
      await createNotification({
        audience: "USER",
        userId,
        type: "SYSTEM",
        title: `Kode uji coba Mitra: ${code}`,
        message: `Pakai kode ${code} saat mengaktifkan paket undangan klien: gratis untuk ${invites} undangan, berlaku sampai ${expiresAt.toLocaleDateString("id-ID")}.`,
        href: "/upgrade",
      });
      return { code, expiresAt };
    } catch {
      // Code clash: try another
    }
  }
  throw new Error("FAILED_TRIAL_CODE");
}

export async function notifyMitraGranted(userId: string) {
  await createNotification({
    audience: "USER",
    userId,
    type: "SYSTEM",
    title: "Selamat, akunmu sekarang Mitra SatuMoment!",
    message: "Dashboard klien, link mitra, dan paket kuota grosir sudah terbuka di menu Mitra.",
    href: "/mitra",
  });
}

