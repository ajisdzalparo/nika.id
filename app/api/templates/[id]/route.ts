import { NextResponse } from "next/server";
import { getTemplateBySlug } from "@/lib/templates";

// GET /api/templates/[id] - get template by slug
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const template = getTemplateBySlug(id);

  if (!template) {
    return NextResponse.json({ error: "TEMPLATE_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(template);
}
