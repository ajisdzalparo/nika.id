import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { InvitationListClient, type UserInvitationSummary } from "@/components/user/invitation-list-client";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation, listUserInvitations } from "@/lib/active-invitation";
import { prisma } from "@/lib/prisma";
import { getUsableAgencyQuota, type PlanType } from "@/lib/limits";

export default async function UndanganListPage() {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");

  const [invitations, active, owner] = await Promise.all([
    listUserInvitations(session.user.id),
    getActiveInvitation(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { accountType: true, agencyQuota: true, agencyQuotaExpiresAt: true },
    }),
  ]);

  const usableAgencyQuota = getUsableAgencyQuota(owner);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Paid plans without a successful PLAN transaction were activated with agency quota
  const paidIds = new Set(
    (
      await prisma.transaction.findMany({
        where: { invitationId: { in: invitations.map((i) => i.id) }, kind: "PLAN", status: "SUCCESS" },
        select: { invitationId: true },
      })
    ).map((t) => t.invitationId),
  );

  const serialized: UserInvitationSummary[] = invitations.map((inv) => ({
    id: inv.id,
    slug: inv.slug,
    title: inv.title,
    weddingDate: inv.weddingDate ? inv.weddingDate.toISOString() : null,
    templateSlug: inv.templateSlug,
    plan: inv.plan as PlanType,
    planExpiresAt: inv.planExpiresAt ? inv.planExpiresAt.toISOString() : null,
    activatedVia: inv.plan === "FREE" ? null : paidIds.has(inv.id) ? "PAYMENT" : "QUOTA",
    isPublic: inv.isPublic,
    views: inv.views,
    updatedAt: inv.updatedAt.toISOString(),
    _count: inv._count,
  }));

  return (
    <>
      <SiteHeader user={session.user} />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <InvitationListClient
            initialInvitations={serialized}
            initialActiveId={active.id}
            baseUrl={baseUrl}
            agencyQuota={usableAgencyQuota}
            isAgency={owner?.accountType === "AGENCY"}
          />
        </div>
      </div>
    </>
  );
}
