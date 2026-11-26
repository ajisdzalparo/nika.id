import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { DefaultMusicManager, type AdminDefaultMusic } from "@/components/admin/default-music-manager";
import { SystemSettingsManager } from "@/components/admin/system-settings-manager";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getFeatureStatuses, getPlanPrices, getSystemSettings } from "@/lib/system-settings";
import { PlanPriceManager } from "@/components/admin/plan-price-manager";
import { INTEREST_ROLE_LABEL, type InterestRole } from "@/lib/marketplace-interest";

export default async function PengaturanPage() {
  const session = await getSession(undefined, "admin");

  const role = session?.user.role;
  if (!session || role?.toLowerCase() !== "admin") {
    redirect("/admin/login");
  }

  const [defaultMusicRows, initialSettings, initialFeatures, interestRows, planPrices] = await Promise.all([
    prisma.defaultMusic.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    getSystemSettings(),
    getFeatureStatuses(),
    prisma.marketplaceInterest.groupBy({ by: ["role"], _count: true }),
    getPlanPrices(),
  ]);

  // Marketplace interest survey results, shown under the Marketplace feature row
  const interestTotal = interestRows.reduce((n, r) => n + r._count, 0);
  const featureNotes = {
    MARKETPLACE: interestTotal
      ? `Survei minat: ${interestTotal} jawaban · ${interestRows
          .map((r) => `${INTEREST_ROLE_LABEL[r.role as InterestRole] ?? r.role} ${r._count}`)
          .join(" · ")}`
      : "Survei minat: belum ada jawaban",
  };

  const initialDefaultMusic: AdminDefaultMusic[] = defaultMusicRows.map((m) => ({
    id: m.id,
    title: m.title,
    artist: m.artist,
    type: m.type === "youtube" ? "youtube" : "upload",
    url: m.url,
    isActive: m.isActive,
  }));

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
          <div>
            <h1 className="font-serif text-4xl font-medium text-[#1F1A14]">Pengaturan sistem</h1>
            <p className="text-muted-foreground">Harga paket, musik default undangan, status fitur, WhatsApp admin, dan rekening pembayaran</p>
          </div>

          <div className="w-full space-y-6">
            <PlanPriceManager initialPrices={planPrices} />
            <DefaultMusicManager initialItems={initialDefaultMusic} />
            <SystemSettingsManager initialSettings={initialSettings} initialFeatures={initialFeatures} featureNotes={featureNotes} />
          </div>
        </div>
      </div>
    </>
  );
}
