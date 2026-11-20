import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ensureCatalogSeeded } from "@/lib/catalog";
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
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
