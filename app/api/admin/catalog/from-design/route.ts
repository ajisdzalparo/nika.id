import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { normalizeTheme } from "@/lib/ai-design/color";
import { slugify } from "@/lib/catalog";
import { errorResponse } from "../shared";

// POST /api/admin/catalog/from-design { designId } — copy a user's design into the catalog as an inactive draft
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const { designId } = await request.json();
    if (typeof designId !== "string") return NextResponse.json({ error: "DESIGN_REQUIRED" }, { status: 400 });

    const design = await prisma.aiDesign.findUnique({ where: { id: designId } });
    if (!design) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const theme = normalizeTheme(design.theme);
    const base = slugify(theme.name);
    let slug = base;
    for (let i = 2; await prisma.catalogTemplate.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${base}-${i}`;

    // Only the theme is copied: no names, photos or other personal data of the user.
    const row = await prisma.catalogTemplate.create({
      data: {
        slug,
        name: theme.name,
        description: theme.mood,
        category: "Elegan",
        tier: "Gratis",
        kind: "ENGINE",
        theme,
        isActive: false,
        isNew: true,
        sortOrder: 50,
      },
    });
    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
