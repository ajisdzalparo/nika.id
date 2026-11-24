import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/common/studio-ui";
import { CatalogList, type AdminCatalogRow } from "@/components/admin/catalog-list";
import { normalizeTheme } from "@/lib/ai-design/color";
import { analyzeTemplateSimilarity, type SimilarityCandidate } from "@/lib/ai-design/originality";
import { prisma } from "@/lib/prisma";
import { ensureCatalogSeeded, withPresetKit } from "@/lib/catalog";

export default async function AdminTemplatesPage() {
  await ensureCatalogSeeded();
  const rawRows = await prisma.catalogTemplate.findMany({
    orderBy: [{ reviewStatus: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include: { creator: { select: { name: true, email: true } } },
  });

  // Pre-normalize engine themes & run fast deterministic similarity scan for instant admin badges
  const normalizedById = new Map<string, ReturnType<typeof normalizeTheme>>();
  const comparisonPool: SimilarityCandidate[] = [];

  for (const r of rawRows) {
    if (r.kind === "ENGINE" && r.theme) {
      const t = withPresetKit(r.slug, normalizeTheme(r.theme));
      normalizedById.set(r.id, t);
      if (r.reviewStatus !== "REJECTED") {
        comparisonPool.push({
          id: r.id,
          slug: r.slug,
          name: r.name,
          category: r.category,
          tier: r.tier,
          theme: t,
        });
      }
    }
  }

  const rows: AdminCatalogRow[] = rawRows.map((r) => {
    const normalizedTheme = normalizedById.get(r.id) ?? null;
    let similaritySummary: AdminCatalogRow["similaritySummary"] = null;
    if (normalizedTheme) {
      const others = comparisonPool.filter((c) => c.id !== r.id);
      const [top] = analyzeTemplateSimilarity(normalizedTheme, others, { limit: 1 });
      if (top) {
        similaritySummary = {
          score: top.scorePct,
          verdict: top.verdict,
          matchedId: top.id ?? "",
          matchedSlug: top.slug,
          matchedName: top.name,
        };
      }
    }

    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      category: r.category,
      tier: r.tier,
      kind: r.kind,
      theme: normalizedTheme ?? r.theme,
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
      similaritySummary,
    };
  });

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-6 lg:px-8 lg:pt-8">
        <div className="w-full space-y-8">
          <PageHeader
            eyebrow="CMS"
            title="Koleksi template"
            description="Atur template yang tampil di halaman koleksi publik dan tinjau orisinalitas pengajuan kreator dengan cek plagiasi AI serta perbandingan visual berdampingan."
          />
          <CatalogList initial={rows} />
        </div>
      </div>
    </>
  );
}
