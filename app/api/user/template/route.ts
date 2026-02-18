import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// POST /api/user/template - set user's template
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { templateId } = body;

    if (!templateId || typeof templateId !== "string") {
      return NextResponse.json({ error: "TEMPLATE_ID_REQUIRED" }, { status: 400 });
    }

    // Check if template exists
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json({ error: "TEMPLATE_NOT_FOUND" }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { templateId },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error setting user template:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
