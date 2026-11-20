import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { getCatalogItem } from "@/lib/catalog";
import { getPlanLimits, type PlanType } from "@/lib/limits";

// POST /api/user/catalog/[slug]/use — apply a catalog template to the user's invitation
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await requireAuth(request);
    const { slug } = await params;
    const item = await getCatalogItem(slug);
    if (!item) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
    if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    if (!getPlanLimits(user.plan as PlanType).allowedTemplateTypes.includes(item.tier as "Gratis" | "Premium")) {
      return NextResponse.json({ error: "PLAN_UPGRADE_REQUIRED", message: "Template ini tersedia di paket Premium." }, { status: 403 });
    }

    if (item.kind === "ENGINE" && item.theme) {
      // Copy the theme into the user's own designs (does not use AI quota) and make it active
      const design = await prisma.aiDesign.create({ data: { userId: session.user.id, source: "CATALOG", prompt: `Template: ${item.name}`, theme: item.theme } });
      await prisma.user.update({ where: { id: session.user.id }, data: { templateSlug: "ai-design", activeAiDesignId: design.id } });
    } else {
      await prisma.user.update({ where: { id: session.user.id }, data: { templateSlug: item.componentSlug } });
    }

    await prisma.catalogTemplate.update({ where: { slug }, data: { usageCount: { increment: 1 } } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    console.error("Use catalog template error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
