import { SiteHeader } from "@/components/site-header";
import { CatalogList, type AdminCatalogRow } from "@/components/admin/catalog-list";
import { prisma } from "@/lib/prisma";
import { ensureCatalogSeeded } from "@/lib/catalog";

export default async function AdminTemplatesPage() {
  await ensureCatalogSeeded();
  const rows = await prisma.catalogTemplate.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });

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
          <CatalogList initial={rows as AdminCatalogRow[]} />
        </div>
      </div>
    </>
  );
}
