import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

// GET /api/templates/[id] - get template detail
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: "TEMPLATE_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

// PATCH /api/templates/[id] - update template metadata only
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const { name, slug, category, type, thumbnail, description, isActive } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = String(name);
    if (slug !== undefined) updateData.slug = String(slug);
    if (category !== undefined) updateData.category = String(category);
    if (type !== undefined) updateData.type = type === "premium" ? "Premium" : "Gratis";
    if (thumbnail !== undefined) updateData.thumbnail = String(thumbnail);
    if (description !== undefined) updateData.description = String(description);
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    const template = await prisma.template.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

// DELETE /api/templates/[id] - delete template
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    await prisma.template.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
