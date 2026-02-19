import { SiteHeader } from "@/components/site-header";
import { SettingsForm } from "@/components/user/settings-form";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function PengaturanPage() {
  let session;
  try {
    session = await requireAuth();
  } catch {
    redirect("/login");
  }

  const user = (await prisma.user.findUnique({
    where: { id: session.user.id },
  })) as unknown as import("@/types/user").UserWithPlan;

  if (!user) {
    redirect("/login");
  }

  const invitation = await prisma.invitation.findUnique({
    where: { userId: session.user.id },
  });

  const invitationData = (invitation as unknown as { data: import("@/types/wedding").WeddingData }) || {
    data: {},
  };

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-1 flex-col bg-[#FAFAFA] dark:bg-zinc-950 min-h-screen">
        <div className="flex flex-col gap-8 py-10 px-4 lg:px-8 w-full">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-zinc-900 dark:text-zinc-50 tracking-tight">Pengaturan</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">Kelola preferensi dan akun Anda.</p>
          </div>

          <SettingsForm user={user} invitation={invitationData} />
        </div>
      </div>
    </>
  );
}
