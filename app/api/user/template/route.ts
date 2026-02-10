import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// POST /api/user/template - set selected template for current user
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);

    const body = await request.json();
    const { templateId } = body as { templateId?: string };

    if (!templateId) {
      return NextResponse.json({ error: "TEMPLATE_ID_REQUIRED" }, { status: 400 });
    }

    // Make sure template exists and active
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isActive) {
      return NextResponse.json({ error: "TEMPLATE_NOT_FOUND" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        templateId: template.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error selecting template:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

