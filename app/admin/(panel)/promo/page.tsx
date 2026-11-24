import { SiteHeader } from "@/components/site-header";
import { PromoManager } from "@/components/admin/promo-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPromoPage() {
  const rows = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <header className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">Penjualan</p>
            <h1 className="font-serif text-4xl font-medium text-[#1E1B17]">Kode promo</h1>
            <p className="max-w-2xl text-[15px] text-[#6B6358]">
              Buat kode diskon yang diketik pembeli di kolom &ldquo;Kode promo&rdquo; saat checkout. Kode yang sudah pernah dipakai tidak bisa dihapus, cukup dinonaktifkan.
            </p>
          </header>
          <PromoManager
            initialItems={rows.map((r) => ({
              id: r.id,
              code: r.code,
              description: r.description,
              percentOff: r.percentOff,
              amountOff: r.amountOff,
              maxDiscount: r.maxDiscount,
              appliesTo: r.appliesTo,
              minPurchase: r.minPurchase,
              maxUses: r.maxUses,
              perUserLimit: r.perUserLimit,
              usedCount: r.usedCount,
              expiresAt: r.expiresAt?.toISOString() ?? null,
              isActive: r.isActive,
            }))}
          />
        </div>
      </div>
    </>
  );
}
