import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { invalidateCached } from "@/lib/memo-cache";

const UpdateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  adminNote: z.string().trim().max(300).optional().nullable(),
});

// PATCH /api/admin/testimonials/[id] — approve (shows on the landing), reject, or move back to pending
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const parsed = UpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "INVALID", message: "Data tidak valid." }, { status: 400 });

    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const { status, adminNote } = parsed.data;
    const item = await prisma.testimonial.update({
      where: { id },
      data: {
        status,
        // Keep the existing note unless the request sends one
        ...(adminNote !== undefined ? { adminNote: adminNote || null } : {}),
        approvedAt: status === "APPROVED" ? existing.approvedAt ?? new Date() : null,
      },
    });

    invalidateCached("landing:testimonials");
    if (status !== existing.status && status !== "PENDING") {
      await createNotification({
        audience: "USER",
        userId: existing.userId,
        type: "SYSTEM",
        title: status === "APPROVED" ? "Testimoni kalian tampil di halaman depan" : "Testimoni kalian belum bisa ditampilkan",
        message: status === "APPROVED" ? "Terima kasih sudah berbagi cerita bersama SatuMoment." : adminNote || "Silakan perbarui testimoni kalian.",
        href: "/masukan",
      });
    }
    return NextResponse.json({ item });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

// DELETE /api/admin/testimonials/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    await prisma.testimonial.deleteMany({ where: { id } });
    invalidateCached("landing:testimonials");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
