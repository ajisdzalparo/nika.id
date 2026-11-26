import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { createNotification } from "@/lib/notifications";
import { CatalogInput, errorResponse, toData } from "../shared";

type Ctx = { params: Promise<{ id: string }> };

// Quick-toggle / review PATCH schema without `.default(...)`: using `CatalogInput.pick(...).partial()`
// would apply defaults to omitted fields and silently wipe `price`, `sortOrder`, `isFeatured`, etc.
const CatalogQuickPatch = z
  .object({
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isNew: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    price: z.number().int().min(0).max(500000).optional(),
    platformFeePct: z.number().int().min(0).max(80).optional(),
    reviewStatus: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED"]).optional(),
    reviewNote: z.string().max(300).nullable().optional(),
  })
  .strict();

// PATCH /api/admin/catalog/[id] — full update, or quick toggles ({ isActive } / { isFeatured } / { isNew } / { sortOrder })
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const prev = await prisma.catalogTemplate.findUnique({
      where: { id },
      select: { isActive: true, reviewStatus: true, creatorId: true, name: true },
    });
    const body = await request.json();
    const quick = CatalogQuickPatch.safeParse(body);
    const data = quick.success ? quick.data : toData(CatalogInput.parse(body));
    const row = await prisma.catalogTemplate.update({ where: { id }, data });

    if (prev?.creatorId && prev.reviewStatus !== row.reviewStatus) {
      if (row.reviewStatus === "APPROVED") {
        await createNotification({
          audience: "USER",
          userId: prev.creatorId,
          type: "TEMPLATE",
          title: `Template "${row.name}" disetujui!`,
          message: `Template kamu kini tayang di Marketplace seharga Rp ${row.price.toLocaleString("id-ID")} (komisi platform ${row.platformFeePct}%).`,
          href: "/pilih-template",
        });
      } else if (row.reviewStatus === "REJECTED") {
        await createNotification({
          audience: "USER",
          userId: prev.creatorId,
          type: "TEMPLATE",
          title: `Template "${row.name}" perlu revisi`,
          message: row.reviewNote || "Silakan perbaiki desain atau deskripsi di Studio Kanvas lalu ajukan kembali.",
          href: "/kanvas",
        });
      }
    }

    if (prev && !prev.isActive && row.isActive && row.reviewStatus === "APPROVED") {
      await createNotification({
        audience: "ALL_USERS",
        type: "TEMPLATE",
        title: `Template baru: ${row.name}`,
        message: `Desain ${row.category} (${row.tier}) kini tersedia di koleksi template.`,
        href: `/pilih-template?pakai=${row.slug}`,
      });
    }
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
