import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { normalizeTheme } from "@/lib/ai-design/color";
import { PLAGIARISM_THRESHOLD } from "@/lib/ai-design/originality";
import { checkTemplatePlagiarism, loadComparisonCatalog } from "@/lib/ai-design/plagiarism-ai";
import { ensureCatalogSeeded, slugify } from "@/lib/catalog";
import { CATALOG_CATEGORIES } from "@/lib/catalog-shared";
import { DEFAULT_MARKETPLACE_FEE_PCT, MARKETPLACE_MAX_PRICE, MARKETPLACE_MIN_PRICE } from "@/lib/limits";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

/** Open submissions a creator may have waiting for review at the same time */
const MAX_PENDING_SUBMISSIONS = 3;

const SubmitMarketplaceSchema = z.object({
  name: z.string().trim().min(3, "Nama template minimal 3 karakter").max(60),
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter").max(300),
  category: z.enum(CATALOG_CATEGORIES),
  price: z
    .number()
    .int()
    .min(MARKETPLACE_MIN_PRICE, `Harga minimal Rp ${MARKETPLACE_MIN_PRICE.toLocaleString("id-ID")}`)
    .max(MARKETPLACE_MAX_PRICE, `Harga maksimal Rp ${MARKETPLACE_MAX_PRICE.toLocaleString("id-ID")}`),
  theme: z.unknown(),
});

// GET /api/user/marketplace — creator's submitted templates & sales summary
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const [templates, purchases] = await Promise.all([
      prisma.catalogTemplate.findMany({
        where: { creatorId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          category: true,
          price: true,
          platformFeePct: true,
          reviewStatus: true,
          reviewNote: true,
          isActive: true,
          usageCount: true,
          createdAt: true,
        },
      }),
      prisma.templatePurchase.findMany({
        where: { template: { creatorId: session.user.id } },
        select: { price: true, platformFee: true, creatorShare: true },
      }),
    ]);

    return NextResponse.json({
      templates: templates.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
      stats: {
        salesCount: purchases.length,
        grossSales: purchases.reduce((s, p) => s + p.price, 0),
        totalCreatorShare: purchases.reduce((s, p) => s + p.creatorShare, 0),
      },
    });
  } catch (error) {
    return apiErrorResponse(error, "Gagal memuat marketplace kreator");
  }
}

// POST /api/user/marketplace — submit a custom Canvas/AI design to be sold on the Template Marketplace
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const parsed = SubmitMarketplaceSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data template tidak valid" },
        { status: 400 },
      );
    }

    await ensureCatalogSeeded();
    const rawTheme = normalizeTheme(parsed.data.theme);
    const theme = { ...rawTheme, customHtml: undefined, sectionOrder: undefined, hiddenSections: undefined };

    // Anti-spam: a few open submissions at a time
    const pending = await prisma.catalogTemplate.count({ where: { creatorId: session.user.id, reviewStatus: "PENDING_REVIEW" } });
    if (pending >= MAX_PENDING_SUBMISSIONS) {
      return NextResponse.json(
        { error: "TOO_MANY_PENDING", message: `Anda masih punya ${pending} template yang menunggu review. Tunggu hasil review dulu sebelum mengajukan lagi.` },
        { status: 429 },
      );
    }

    // Only original work can be sold: compare against ALL non-rejected templates (including creator's own) + built-in presets
    const existing = await loadComparisonCatalog({ includeBuiltInPresets: true });
    const report = await checkTemplatePlagiarism({ name: parsed.data.name, theme }, existing, { useAi: true });

    if (report.verdict === "PLAGIAT" || report.score >= Math.round(PLAGIARISM_THRESHOLD * 100)) {
      const matchedName = report.topMatch?.name ?? "template yang sudah ada";
      return NextResponse.json(
        {
          error: "NOT_ORIGINAL",
          message: `Desain terindikasi plagiasi (${report.score}% mirip dengan template "${matchedName}"). Tidak cukup hanya mengganti font atau sedikit warna — buat komposisi ilustrasi, layout sampul, dan palet yang benar-benar orisinal.`,
          report,
        },
        { status: 422 },
      );
    }

    const baseSlug = slugify(parsed.data.name);
    const slug = `${baseSlug}-${Date.now().toString(36).slice(-5)}`;

    const created = await prisma.catalogTemplate.create({
      data: {
        slug,
        name: parsed.data.name,
        description: parsed.data.description,
        category: parsed.data.category,
        tier: "Marketplace",
        kind: "ENGINE",
        theme: { ...theme, name: parsed.data.name } as unknown as Prisma.InputJsonValue,
        creatorId: session.user.id,
        price: parsed.data.price,
        platformFeePct: DEFAULT_MARKETPLACE_FEE_PCT,
        reviewStatus: "PENDING_REVIEW",
        isActive: false,
        isNew: true,
      },
    });

    const similarityAlert =
      report.verdict === "MIRIP" && report.topMatch
        ? ` ⚠ Peringatan kemiripan ${report.score}% dengan "${report.topMatch.name}" — wajib cek perbandingan manual di Admin.`
        : "";

    await createNotification({
      audience: "ADMIN",
      type: "TEMPLATE",
      title: `Pengajuan template marketplace · ${created.name}`,
      message: `${session.user.name || session.user.email} mengajukan template seharga Rp ${created.price.toLocaleString("id-ID")} untuk direview.${similarityAlert}`,
      href: "/admin/templates",
    });

    return NextResponse.json({ template: created, originalityReport: report }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Gagal mengajukan template ke marketplace");
  }
}
