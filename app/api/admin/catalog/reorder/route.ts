import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { errorResponse } from "../shared";

const ReorderInput = z.object({ ids: z.array(z.string().min(1)).min(1).max(1000) });

// POST /api/admin/catalog/reorder { ids } — save the catalog order from the admin drag & drop list.
// Order is stored as sortOrder 10, 20, 30… so a single template can still be slotted in between later.
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const { ids } = ReorderInput.parse(await request.json());
    await prisma.$transaction(ids.map((id, i) => prisma.catalogTemplate.update({ where: { id }, data: { sortOrder: (i + 1) * 10 } })));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
