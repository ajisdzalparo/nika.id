import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { normalizeTheme } from "@/lib/ai-design/color";
import { getAiQuota } from "@/lib/ai-design/server";
import type { PlanType } from "@/lib/limits";
import { prisma } from "@/lib/prisma";
import { featureBlockedResponse } from "@/lib/feature-guard";

// GET /api/user/canvas — returns saved canvas/AI designs, quota, and active invitation theme
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const active = await getActiveInvitation(session.user.id);

    const [designs, quota, myTemplates] = await Promise.all([
      prisma.aiDesign.findMany({
        where: { userId: session.user.id, source: { in: ["AI", "CANVAS", "CATALOG"] } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      getAiQuota(session.user.id, active.plan as PlanType),
      prisma.catalogTemplate.findMany({
        where: { creatorId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
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
    ]);

    return NextResponse.json({
      designs: designs.map((d) => ({
        id: d.id,
        source: d.source,
        prompt: d.prompt,
        createdAt: d.createdAt.toISOString(),
        theme: normalizeTheme(d.theme),
      })),
      activeId: active.activeAiDesignId,
      invitationTitle: active.title,
      quota,
      myTemplates: myTemplates.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
    });
  } catch (error) {
    return apiErrorResponse(error, "Gagal memuat studio kanvas");
  }
}

// POST /api/user/canvas { designId?, name?, theme, apply? } — saves custom canvas design (0 AI credits)
export async function POST(request: Request) {
  const blocked = await featureBlockedResponse("KANVAS");
  if (blocked) return blocked;

  try {
    const session = await requireAuth(request);
    const active = await getActiveInvitation(session.user.id);
    const body = await request.json().catch(() => ({}));

    const theme = normalizeTheme(body?.theme);
    const designId = typeof body?.designId === "string" ? body.designId : "";
    const apply = body?.apply === true;
    const label = typeof body?.name === "string" && body.name.trim() ? body.name.trim().slice(0, 80) : theme.name;
    // User canvas is strictly visual/AI + standardized 11-section structure (custom HTML is Admin-only).
    const normalized = { ...theme, name: label, customHtml: undefined, sectionOrder: undefined, hiddenSections: undefined };

    let saved;
    if (designId) {
      const existing = await prisma.aiDesign.findFirst({
        where: { id: designId, userId: session.user.id, source: "CANVAS" },
        select: { id: true },
      });
      if (existing) {
        saved = await prisma.aiDesign.update({
          where: { id: existing.id },
          data: {
            prompt: `Kanvas: ${label}`,
            theme: normalized as unknown as Prisma.InputJsonValue,
          },
        });
      }
    }

    if (!saved) {
      saved = await prisma.aiDesign.create({
        data: {
          userId: session.user.id,
          source: "CANVAS",
          prompt: `Kanvas: ${label}`,
          theme: normalized as unknown as Prisma.InputJsonValue,
          creditsUsed: 0,
          planCreditsUsed: 0,
        },
      });
    }

    if (apply) {
      await prisma.invitation.update({
        where: { id: active.id },
        data: { templateSlug: "ai-design", activeAiDesignId: saved.id },
      });
    }

    return NextResponse.json({
      design: {
        id: saved.id,
        source: saved.source,
        prompt: saved.prompt,
        createdAt: saved.createdAt.toISOString(),
        theme: normalized,
      },
      applied: apply,
    });
  } catch (error) {
    return apiErrorResponse(error, "Gagal menyimpan desain kanvas");
  }
}

// DELETE /api/user/canvas?id=... — removes a saved design owned by the current user
export async function DELETE(request: Request) {
  const blocked = await featureBlockedResponse("KANVAS");
  if (blocked) return blocked;

  try {
    const session = await requireAuth(request);
    const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
    if (!id) {
      return NextResponse.json({ message: "ID desain wajib diisi." }, { status: 400 });
    }

    const existing = await prisma.aiDesign.findFirst({
      where: { id, userId: session.user.id, source: { in: ["AI", "CANVAS", "CATALOG"] } },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ message: "Desain tidak ditemukan." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.invitation.updateMany({
        where: { userId: session.user.id, activeAiDesignId: id },
        data: { activeAiDesignId: null, templateSlug: "minimal" },
      }),
      prisma.aiDesign.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    return apiErrorResponse(error, "Gagal menghapus desain kanvas");
  }
}
