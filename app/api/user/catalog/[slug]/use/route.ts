import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { getCatalogItem } from "@/lib/catalog";
import { getPlanLimits, type PlanType } from "@/lib/limits";

// POST /api/user/catalog/[slug]/use — apply a catalog template to the user's active invitation
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await requireAuth(request);
    const { slug } = await params;
    const item = await getCatalogItem(slug);
    if (!item) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const active = await getActiveInvitation(session.user.id);
    if (!getPlanLimits(active.plan as PlanType).allowedTemplateTypes.includes(item.tier as "Gratis" | "Premium")) {
      return NextResponse.json({ error: "PLAN_UPGRADE_REQUIRED", message: "Template ini tersedia di paket Premium." }, { status: 403 });
    }

    const updateData: Prisma.InvitationUpdateInput = {};

    if (item.kind === "ENGINE" && item.theme) {
      const design = await prisma.aiDesign.create({ data: { userId: session.user.id, source: "CATALOG", prompt: `Template: ${item.name}`, theme: item.theme } });
      updateData.templateSlug = "ai-design";
      updateData.activeAiDesignId = design.id;
    } else {
      updateData.templateSlug = item.componentSlug;
    }

    if (item.defaultMusic?.url) {
      const existingData = ((active.data ?? {}) as Record<string, unknown>) || {};
      const existingMusic = existingData.music as { url?: string; enabled?: boolean } | undefined;
      if (!existingMusic?.url) {
        updateData.data = {
          ...existingData,
          music: {
            enabled: true,
            type: item.defaultMusic.type,
            url: item.defaultMusic.url,
          },
        } as Prisma.InputJsonValue;
      }
    }

    await prisma.invitation.update({ where: { id: active.id }, data: updateData });
    await prisma.catalogTemplate.update({ where: { slug }, data: { usageCount: { increment: 1 } } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    console.error("Use catalog template error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
