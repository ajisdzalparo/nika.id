import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

// GET /api/templates - list all active templates (public/admin)
export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

// POST /api/templates - create new template (admin only)
export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { name, slug, category, type, thumbnail, description, isActive = true } = body;

    if (!name || !slug || !category || !thumbnail) {
      return NextResponse.json({ error: "NAME_SLUG_CATEGORY_THUMBNAIL_REQUIRED" }, { status: 400 });
    }

    // Check if slug already exists
    const existingTemplate = await prisma.template.findUnique({
      where: { slug: slug },
    });

    if (existingTemplate) {
      return NextResponse.json({ error: "SLUG_ALREADY_EXISTS" }, { status: 400 });
    }

    const template = await prisma.template.create({
      data: {
        name,
        slug,
        category,
        type: type ?? "Gratis",
        thumbnail,
        description,
        isActive,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
