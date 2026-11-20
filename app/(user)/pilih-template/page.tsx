import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { TemplatePicker } from "@/components/user/template-picker";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCatalog } from "@/lib/catalog";
import { getPlanLimits, type PlanType } from "@/lib/limits";

export default async function PilihTemplatePage({ searchParams }: { searchParams: Promise<{ pakai?: string }> }) {
  const session = await auth.api.getSession({ headers: Object.fromEntries(await headers()) });
  if (!session) redirect("/login");
  const { pakai } = await searchParams;

  const [user, items] = await Promise.all([prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }), getCatalog()]);
  const allowedTiers = getPlanLimits((user?.plan ?? "FREE") as PlanType).allowedTemplateTypes;

  return (
    <>
      <SiteHeader user={session.user} />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">Koleksi template</p>
            <h2 className="font-serif text-5xl font-medium">Pilih desain undangan</h2>
            <p className="max-w-2xl text-zinc-600">Pakai desain yang sudah jadi, lalu ganti kapan saja. Data undangan kalian tetap sama.</p>
          </header>
          <TemplatePicker items={items} allowedTiers={allowedTiers} highlight={pakai} />
        </div>
      </div>
    </>
  );
}
