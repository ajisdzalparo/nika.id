import { SiteHeader } from "@/components/site-header";
import { CatalogList, type AdminCatalogRow } from "@/components/admin/catalog-list";
import { prisma } from "@/lib/prisma";
import { ensureCatalogSeeded } from "@/lib/catalog";

export default async function AdminTemplatesPage() {
  await ensureCatalogSeeded();
  const rawRows = await prisma.catalogTemplate.findMany({
    orderBy: [{ reviewStatus: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include: { creator: { select: { name: true, email: true } } },
  });
  const rows: AdminCatalogRow[] = rawRows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    tier: r.tier,
    kind: r.kind,
    theme: r.theme,
    thumbnail: r.thumbnail,
    referenceUrl: r.referenceUrl,
    isActive: r.isActive,
    isFeatured: r.isFeatured,
    isNew: r.isNew,
    sortOrder: r.sortOrder,
    usageCount: r.usageCount,
    price: r.price,
    platformFeePct: r.platformFeePct,
    reviewStatus: r.reviewStatus,
    reviewNote: r.reviewNote,
    creatorId: r.creatorId,
    creatorName: r.creator?.name ?? null,
    creatorEmail: r.creator?.email ?? null,
  }));

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">CMS</p>
            <h2 className="font-serif text-5xl font-medium">Koleksi template</h2>
            <p className="max-w-2xl text-zinc-600">Atur template yang tampil di halaman koleksi publik dan yang bisa dipakai user. Urutan kecil tampil lebih dulu; “Unggulan” masuk karosel utama.</p>
          </header>
          <CatalogList initial={rows} />
        </div>
      </div>
    </>
  );
}
