import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { createNotification } from "@/lib/notifications";
import { CatalogInput, errorResponse, toData } from "../shared";

type Ctx = { params: Promise<{ id: string }> };

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
    const quick = CatalogInput.pick({
      isActive: true,
      isFeatured: true,
      isNew: true,
      sortOrder: true,
      price: true,
      platformFeePct: true,
      reviewStatus: true,
      reviewNote: true,
    })
      .partial()
      .strict()
      .safeParse(body);
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
