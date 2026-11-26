import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/common/studio-ui";
import { TemplatePicker } from "@/components/user/template-picker";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { getCatalog } from "@/lib/catalog";
import { getPlanLimits, type PlanType } from "@/lib/limits";
import { prisma } from "@/lib/prisma";
import { getFeatureStatus, isAiDesignEnabled } from "@/lib/system-settings";
import { MarketplaceInterestCard, type MarketplaceInterestAnswer } from "@/components/user/marketplace-interest-card";

export default async function PilihTemplatePage({ searchParams }: { searchParams: Promise<{ pakai?: string }> }) {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");
  const { pakai } = await searchParams;

  const active = await getActiveInvitation(session.user.id);
  const [catalog, aiEnabled, purchases, marketplaceStatus, interest] = await Promise.all([
    getCatalog(),
    isAiDesignEnabled(),
    prisma.templatePurchase.findMany({
      where: { invitationId: active.id },
      select: { templateId: true },
    }),
    getFeatureStatus("MARKETPLACE"),
    prisma.marketplaceInterest.findUnique({ where: { userId: session.user.id }, select: { role: true, priceBand: true, note: true } }),
  ]);
  const marketplaceOpen = marketplaceStatus === "ACTIVE";
  const allowedTiers = getPlanLimits((active.plan ?? "FREE") as PlanType).allowedTemplateTypes;
  const purchasedTemplateIds = purchases.map((p) => p.templateId);
  // While the marketplace is closed, paid kreator templates are hidden (except ones already bought or made by this user)
  const owned = new Set(purchasedTemplateIds);
  const items = marketplaceOpen ? catalog : catalog.filter((i) => i.price <= 0 || owned.has(i.id) || i.creatorId === session.user.id);

  return (
    <>
      <SiteHeader user={session.user} />
      <div className="flex-1 px-4 pb-16 pt-6 lg:px-8 lg:pt-8">
        <div className="w-full space-y-8">
          <PageHeader
            eyebrow={`Koleksi template · ${active.title}`}
            title="Pilih desain undangan"
            description="Pakai desain yang sudah jadi, lalu ganti kapan saja. Data undangan kalian tetap aman dan tidak berubah."
          />
          <TemplatePicker
            items={items}
            allowedTiers={allowedTiers}
            highlight={pakai}
            aiEnabled={aiEnabled}
            purchasedTemplateIds={purchasedTemplateIds}
            currentUserId={session.user.id}
            marketplaceOpen={marketplaceOpen}
          />
          {!marketplaceOpen && <MarketplaceInterestCard initial={interest as MarketplaceInterestAnswer | null} />}
        </div>
      </div>
    </>
  );
}
