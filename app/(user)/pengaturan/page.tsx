import { SiteHeader } from "@/components/site-header";
import { SettingsForm } from "@/components/user/settings-form";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { redirect } from "next/navigation";
import type { PlanType } from "@/lib/limits";

export default async function PengaturanPage() {
  let session;
  try {
    session = await requireAuth();
  } catch {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const active = await getActiveInvitation(session.user.id);
  const userWithPlan = {
    ...user,
    plan: active.plan as PlanType,
    planExpiresAt: active.planExpiresAt,
    extraGuestQuota: active.extraGuestQuota,
    templateSlug: active.templateSlug,
    activeAiDesignId: active.activeAiDesignId,
    weddingDate: active.weddingDate,
    invitationSlug: active.slug,
  } as unknown as import("@/types/user").UserWithPlan;

  const invitationData = { data: (active.data ?? {}) as unknown as import("@/types/wedding").WeddingData };

  return (
    <>
      <SiteHeader user={userWithPlan} />
      <div className="flex flex-1 flex-col min-h-screen">
        <div className="flex flex-col gap-8 py-10 px-4 lg:px-8 w-full">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-zinc-900 dark:text-zinc-50 tracking-tight">Pengaturan</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Kelola musik, amplop untuk <strong>{active.title}</strong>, serta profil akun Anda.
            </p>
          </div>

          <SettingsForm user={userWithPlan} invitation={invitationData} />
        </div>
      </div>
    </>
  );
}
