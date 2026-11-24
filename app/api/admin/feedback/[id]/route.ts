import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { FEEDBACK_STATUSES, labelOf } from "@/lib/feedback-shared";

const statusIds = FEEDBACK_STATUSES.map((s) => s.id) as [string, ...string[]];

const UpdateSchema = z.object({
  status: z.enum(statusIds).optional(),
  adminReply: z.string().trim().max(2000).optional(),
});

// PATCH /api/admin/feedback/[id] — change status and/or reply; the user is notified when either changes
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const parsed = UpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID", message: "Data tidak valid." }, { status: 400 });
    }

    const existing = await prisma.feedback.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const { status, adminReply } = parsed.data;
    const replyChanged = adminReply !== undefined && adminReply !== (existing.adminReply ?? "");
    const statusChanged = status !== undefined && status !== existing.status;

    const item = await prisma.feedback.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(replyChanged ? { adminReply: adminReply || null, repliedAt: adminReply ? new Date() : null } : {}),
      },
    });

    if (replyChanged || statusChanged) {
      await createNotification({
        audience: "USER",
        userId: existing.userId,
        type: "SYSTEM",
        title: replyChanged && adminReply ? "Tim kami membalas masukanmu" : `Masukanmu: ${labelOf(FEEDBACK_STATUSES, item.status)}`,
        message: replyChanged && adminReply ? adminReply.slice(0, 200) : `"${existing.message.slice(0, 80)}" sekarang berstatus ${labelOf(FEEDBACK_STATUSES, item.status).toLowerCase()}.`,
        href: "/masukan",
      });
    }

    return NextResponse.json({ item });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
