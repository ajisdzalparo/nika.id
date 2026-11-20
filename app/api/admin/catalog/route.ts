import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ensureCatalogSeeded } from "@/lib/catalog";
import { createNotification } from "@/lib/notifications";
import { CatalogInput, errorResponse, toData } from "./shared";

// GET /api/admin/catalog — every template, including inactive ones and admin notes
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    await ensureCatalogSeeded();
    const rows = await prisma.catalogTemplate.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
    return NextResponse.json(rows);
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/admin/catalog — create a template
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const input = CatalogInput.parse(await request.json());
    const row = await prisma.catalogTemplate.create({ data: toData(input) });
    if (row.isActive) {
      await createNotification({
        audience: "ALL_USERS",
        type: "TEMPLATE",
        title: `Template baru: ${row.name}`,
        message: `Desain ${row.category} (${row.tier}) kini tersedia di koleksi template.`,
        href: `/pilih-template?pakai=${row.slug}`,
      });
    }
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
