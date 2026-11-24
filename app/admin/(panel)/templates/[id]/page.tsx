import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { CatalogEditor } from "@/components/admin/catalog-editor";
import { prisma } from "@/lib/prisma";
import { normalizeTheme } from "@/lib/ai-design/color";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.catalogTemplate.findUnique({ where: { id } });
  if (!row) notFound();

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="w-full space-y-6">
          <h2 className="font-serif text-5xl font-medium">{row.name}</h2>
          <CatalogEditor
            initial={{
              id: row.id,
              slug: row.slug,
              name: row.name,
              description: row.description,
              category: row.category,
              tier: row.tier === "Premium" ? "Premium" : "Gratis",
              kind: row.kind === "CODE" ? "CODE" : "ENGINE",
              theme: row.theme ? normalizeTheme(row.theme) : null,
              defaultMusic: (row.defaultMusic as { type: "youtube" | "upload"; url: string; title?: string } | null) ?? null,
              componentSlug: row.componentSlug,
              thumbnail: row.thumbnail ?? "",
              referenceUrl: row.referenceUrl ?? "",
              isActive: row.isActive,
              isFeatured: row.isFeatured,
              isNew: row.isNew,
              sortOrder: row.sortOrder,
            }}
          />
        </div>
      </div>
    </>
  );
}
