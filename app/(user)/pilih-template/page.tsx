import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { TemplatePicker } from "@/components/user/template-picker";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { getCatalog } from "@/lib/catalog";
import { getPlanLimits, type PlanType } from "@/lib/limits";

export default async function PilihTemplatePage({ searchParams }: { searchParams: Promise<{ pakai?: string }> }) {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");
  const { pakai } = await searchParams;

  const [active, items] = await Promise.all([getActiveInvitation(session.user.id), getCatalog()]);
  const allowedTiers = getPlanLimits((active.plan ?? "FREE") as PlanType).allowedTemplateTypes;

  return (
    <>
      <SiteHeader user={session.user} />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">Koleksi template · {active.title}</p>
            <h2 className="font-serif text-5xl font-medium">Pilih desain undangan</h2>
            <p className="max-w-2xl text-zinc-600">Pakai desain yang sudah jadi, lalu ganti kapan saja. Data undangan kalian tetap sama.</p>
          </header>
          <TemplatePicker items={items} allowedTiers={allowedTiers} highlight={pakai} />
        </div>
      </div>
    </>
  );
}
