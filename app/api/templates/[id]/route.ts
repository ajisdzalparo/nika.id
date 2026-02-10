import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

// GET /api/templates/[id] - get template detail
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // @ts-expect-error - Template model is available at runtime
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

// PATCH /api/templates/[id] - update template
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    // Check Content-Type to determine if it's JSON or FormData
    const contentType = request.headers.get("content-type") || "";

    let updateData: any = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const name = formData.get("name") as string;
      const slug = formData.get("slug") as string;
      const category = formData.get("category") as string;
      const type = formData.get("type") as string;
      const thumbnail = formData.get("thumbnail") as string;
      const description = formData.get("description") as string;
      const isActiveStr = formData.get("isActive") as string;

      updateData = {
        name,
        slug,
        category,
        type: type ? (type === "premium" ? "Premium" : "Gratis") : undefined,
        thumbnail,
        description,
        isActive: isActiveStr ? isActiveStr === "true" : undefined,
      };

      // Handle File Replacement
      if (file && slug) {
        const { writeFile, readFile } = await import("fs/promises");
        const path = await import("path");

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const safeSlug = slug.replace(/[^a-zA-Z0-9-_]/g, "");
        const filename = `${safeSlug}.tsx`;
        const templatesDir = path.join(process.cwd(), "components", "templates");
        const filePath = path.join(templatesDir, filename);

        await writeFile(filePath, buffer);

        // Note: We don't strictly need to update registry.ts here if the slug hasn't changed,
        // as the dynamic import points to the filename.
        // If slug changed, registry update would be more complex (delete old, add new).
        // For now, we assume standard usage (replacing content of same slug).
      }
    } else {
      const body = await request.json();
      const { name, slug, category, type, thumbnail, description, isActive } = body;

      updateData = {
        name,
        slug,
        category,
        type: type ? (type === "premium" ? "Premium" : "Gratis") : undefined,
        thumbnail,
        description,
        isActive,
      };
    }

    // Remove undefined keys
    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

    // @ts-expect-error - Template model is available at runtime
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

    // @ts-expect-error - Template model is available at runtime
    await prisma.template.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
