import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { CatalogInput, errorResponse, toData } from "../shared";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/catalog/[id] — full update, or quick toggles ({ isActive } / { isFeatured } / { isNew } / { sortOrder })
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const quick = CatalogInput.pick({ isActive: true, isFeatured: true, isNew: true, sortOrder: true }).partial().strict().safeParse(body);
    const data = quick.success ? quick.data : toData(CatalogInput.parse(body));
    const row = await prisma.catalogTemplate.update({ where: { id }, data });
    return NextResponse.json(row);
  } catch (error) {
    return errorResponse(error);
  }
}

// DELETE /api/admin/catalog/[id]
export async function DELETE(request: Request, { params }: Ctx) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    await prisma.catalogTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
