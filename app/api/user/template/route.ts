import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { getTemplateBySlug } from "@/lib/templates";

// POST /api/user/template - set user's template by slug
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { templateSlug } = body;

    if (!templateSlug || typeof templateSlug !== "string") {
      return NextResponse.json({ error: "TEMPLATE_SLUG_REQUIRED" }, { status: 400 });
    }

    // Validate slug exists in source code registry
    const template = getTemplateBySlug(templateSlug);
    if (!template) {
      return NextResponse.json({ error: "TEMPLATE_NOT_FOUND" }, { status: 404 });
    }

    if (!template.isActive) {
      return NextResponse.json({ error: "TEMPLATE_NOT_ACTIVE" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { templateSlug },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error setting user template:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
