import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { InvitationListClient, type UserInvitationSummary } from "@/components/user/invitation-list-client";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation, listUserInvitations } from "@/lib/active-invitation";
import type { PlanType } from "@/lib/limits";

export default async function UndanganListPage() {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");

  const [invitations, active] = await Promise.all([
    listUserInvitations(session.user.id),
    getActiveInvitation(session.user.id),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const serialized: UserInvitationSummary[] = invitations.map((inv) => ({
    id: inv.id,
    slug: inv.slug,
    title: inv.title,
    weddingDate: inv.weddingDate ? inv.weddingDate.toISOString() : null,
    templateSlug: inv.templateSlug,
    plan: inv.plan as PlanType,
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
          <InvitationListClient initialInvitations={serialized} initialActiveId={active.id} baseUrl={baseUrl} />
        </div>
      </div>
    </>
  );
}
