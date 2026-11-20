import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { getTemplateBySlug } from "@/lib/templates";
import { getPlanLimits, type PlanType } from "@/lib/limits";

// POST /api/user/template - set active invitation's template by slug
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { templateSlug, invitationId } = body;

    if (!templateSlug || typeof templateSlug !== "string") {
      return NextResponse.json({ error: "TEMPLATE_SLUG_REQUIRED" }, { status: 400 });
    }

    const template = getTemplateBySlug(templateSlug);
    if (!template) {
      return NextResponse.json({ error: "TEMPLATE_NOT_FOUND" }, { status: 404 });
    }

    if (!template.isActive) {
      return NextResponse.json({ error: "TEMPLATE_NOT_ACTIVE" }, { status: 400 });
    }

    const active = await getActiveInvitation(session.user.id, typeof invitationId === "string" ? invitationId : undefined);

    if (templateSlug === "ai-design" && !active.activeAiDesignId) {
      return NextResponse.json({ error: "AI_DESIGN_REQUIRED" }, { status: 400 });
    }

    const limits = getPlanLimits(active.plan as PlanType);
    if (!limits.allowedTemplateTypes.includes(template.type)) {
      return NextResponse.json({ error: "PLAN_UPGRADE_REQUIRED" }, { status: 403 });
    }

    const updated = await prisma.invitation.update({
      where: { id: active.id },
      data: { templateSlug },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    console.error("Error setting template:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
