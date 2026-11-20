import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// POST /api/ai/design/[id]/apply — use this AI design as the invitation's template
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    const design = await prisma.aiDesign.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
    if (!design) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { activeAiDesignId: design.id, templateSlug: "ai-design" },
    });

    return NextResponse.json({ success: true, activeId: design.id });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    console.error("AI design apply error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
