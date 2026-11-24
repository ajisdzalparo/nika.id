import { NextResponse } from "next/server";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";
import { normalizeTheme } from "@/lib/ai-design/color";
import { checkTemplatePlagiarism, loadComparisonCatalog } from "@/lib/ai-design/plagiarism-ai";
import { ensureCatalogSeeded, withPresetKit } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/admin/catalog/[id]/similarity — AI + structural plagiarism audit against all other templates
export async function POST(request: Request, { params }: Ctx) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    await ensureCatalogSeeded();
    const target = await prisma.catalogTemplate.findUnique({
      where: { id },
      include: { creator: { select: { name: true, email: true } } },
    });

    if (!target) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Template tidak ditemukan" }, { status: 404 });
    }
    if (target.kind !== "ENGINE" || !target.theme) {
      return NextResponse.json(
        { error: "UNSUPPORTED", message: "Template berbasis komponen kode tidak menggunakan mesin tema JSON" },
        { status: 400 },
      );
    }

    const targetTheme = withPresetKit(target.slug, normalizeTheme(target.theme));
    const others = await loadComparisonCatalog({ excludeId: target.id, includeBuiltInPresets: false });
    const report = await checkTemplatePlagiarism(
      { name: target.name, slug: target.slug, theme: targetTheme },
      others,
      { useAi: true },
    );

    return NextResponse.json({
      target: {
        id: target.id,
        slug: target.slug,
        name: target.name,
        category: target.category,
        tier: target.tier,
        reviewStatus: target.reviewStatus,
        isActive: target.isActive,
        creatorName: target.creator?.name ?? target.creator?.email ?? null,
        theme: targetTheme,
      },
      report,
    });
  } catch (error) {
    return apiErrorResponse(error, "Gagal memeriksa kemiripan template");
  }
}
