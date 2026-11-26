import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { AgencyHub } from "@/components/user/agency-hub";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getUserReferralSummary } from "@/lib/referral";
import { getSystemSettings } from "@/lib/system-settings";

export default async function MitraPage() {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");

  const [user, invitations, referral, application, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        accountType: true,
        agencyName: true,
        agencyWhatsapp: true,
        agencyInstagram: true,
        agencyLogo: true,
        agencyVerified: true,
        agencyQuota: true,
        agencyQuotaExpiresAt: true,
        aiCredits: true,
      },
    }),
    prisma.invitation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        weddingDate: true,
        templateSlug: true,
        plan: true,
        planExpiresAt: true,
        isPublic: true,
        views: true,
        clientName: true,
        clientWhatsapp: true,
        clientEditToken: true,
        clientPrice: true,
        mitraCost: true,
        activatedAt: true,
        updatedAt: true,
        _count: { select: { guests: true, rsvps: true, messages: true } },
      },
    }),
    getUserReferralSummary(session.user.id),
    prisma.mitraApplication.findFirst({
      where: { OR: [{ userId: session.user.id }, { email: { equals: session.user.email, mode: "insensitive" } }] },
      orderBy: { createdAt: "desc" },
      select: { status: true, createdAt: true, adminNote: true },
    }),
    getSystemSettings(),
  ]);

  if (!user) redirect("/login");

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/+$/, "");

  return (
    <>
      <SiteHeader user={session.user} />
      <AgencyHub
        initialAgency={{
          ...user,
          agencyQuotaExpiresAt: user.agencyQuotaExpiresAt ? user.agencyQuotaExpiresAt.toISOString() : null,
        }}
        initialInvitations={invitations.map((inv) => ({
          ...inv,
          weddingDate: inv.weddingDate ? inv.weddingDate.toISOString() : null,
          planExpiresAt: inv.planExpiresAt ? inv.planExpiresAt.toISOString() : null,
          updatedAt: inv.updatedAt.toISOString(),
        }))}
        initialReferral={referral}
        appUrl={appUrl}
        application={application ? { ...application, createdAt: application.createdAt.toISOString() } : null}
        adminWhatsapp={settings.manualWhatsapp || null}
      />
    </>
  );
}
