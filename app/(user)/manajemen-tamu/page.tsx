import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { InvitationSwitcher } from "@/components/user/active-invitation-context";
import { GuestList } from "@/components/user/guest-list";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { prisma } from "@/lib/prisma";
import { PlanType } from "@/lib/limits";

export default async function ManajemenTamuPage() {
  const session = await getSession(undefined, "user");

  if (!session) redirect("/login");

  const active = await getActiveInvitation(session.user.id);
  const initialGuests = await prisma.guest.findMany({
    where: { invitationId: active.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col min-h-screen">
        <div className="flex flex-col gap-8 py-10 px-4 lg:px-8 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8A6A2F]">{active.title}</p>
              <h1 className="font-serif text-3xl md:text-4xl font-medium text-zinc-900 dark:text-zinc-50 tracking-tight">Daftar Tamu</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Kelola siapa saja yang akan menerima undangan spesialmu.</p>
            </div>
            <InvitationSwitcher compact />
          </div>
          <GuestList
            initialGuests={initialGuests}
            invitationSlug={active.slug || "undangan"}
            userPlan={active.plan as PlanType}
            extraGuestQuota={active.extraGuestQuota ?? 0}
          />
        </div>
      </div>
    </>
  );
}
