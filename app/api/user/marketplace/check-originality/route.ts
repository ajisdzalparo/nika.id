import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { normalizeTheme } from "@/lib/ai-design/color";
import { checkTemplatePlagiarism, loadComparisonCatalog } from "@/lib/ai-design/plagiarism-ai";
import { ensureCatalogSeeded } from "@/lib/catalog";

const CheckOriginalitySchema = z.object({
  name: z.string().trim().max(80).optional(),
  theme: z.unknown(),
});

// POST /api/user/marketplace/check-originality — pre-sell AI + structural originality inspection
export async function POST(request: Request) {
  try {
    await requireAuth(request);
    const parsed = CheckOriginalitySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Data tema tidak valid untuk pengecekan orisinalitas" },
        { status: 400 },
      );
    }

    await ensureCatalogSeeded();
    const rawTheme = normalizeTheme(parsed.data.theme);
    const theme = { ...rawTheme, customHtml: undefined, sectionOrder: undefined, hiddenSections: undefined };
    const existing = await loadComparisonCatalog({ includeBuiltInPresets: true });
    const report = await checkTemplatePlagiarism(
      { name: parsed.data.name || theme.name, theme },
      existing,
      { useAi: true },
    );

    return NextResponse.json({ report });
  } catch (error) {
    return apiErrorResponse(error, "Gagal memeriksa orisinalitas template");
  }
}
