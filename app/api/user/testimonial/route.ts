import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { invalidateCached } from "@/lib/memo-cache";
import { TESTIMONIAL_MESSAGE_MAX, TESTIMONIAL_MESSAGE_MIN } from "@/lib/testimonials-shared";

const Schema = z.object({
  displayName: z.string().trim().min(2, "Isi nama yang ingin ditampilkan.").max(60),
  city: z.string().trim().max(40).optional().nullable(),
  rating: z.number().int().min(1).max(5),
  message: z
    .string()
    .trim()
    .min(TESTIMONIAL_MESSAGE_MIN, `Ceritakan sedikit lebih detail (minimal ${TESTIMONIAL_MESSAGE_MIN} karakter).`)
    .max(TESTIMONIAL_MESSAGE_MAX),
});

// GET /api/user/testimonial — the user's own testimonial (or null)
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const item = await prisma.testimonial.findUnique({ where: { userId: session.user.id } });
    return NextResponse.json({ item });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

// PUT /api/user/testimonial — create or edit; every edit goes back to admin review
export async function PUT(request: Request) {
  try {
    const session = await requireAuth(request);
    const owner = await prisma.user.findUnique({ where: { id: session.user.id }, select: { accountType: true } });
    if (owner?.accountType === "CLIENT") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Testimoni dikirim oleh pemilik akun." }, { status: 403 });
    }
    const parsed = Schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID", message: parsed.error.issues[0]?.message ?? "Data tidak valid." }, { status: 400 });
    }
    const data = { ...parsed.data, city: parsed.data.city || null, status: "PENDING", adminNote: null, approvedAt: null };
    const previous = await prisma.testimonial.findUnique({ where: { userId: session.user.id }, select: { status: true, updatedAt: true } });
    const item = await prisma.testimonial.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...data },
      update: data,
    });

    if (previous?.status === "APPROVED") invalidateCached("landing:testimonials");
    // One admin ping per review round: repeated edits while it already waits within the hour don't notify again
    const alreadyQueued = previous?.status === "PENDING" && Date.now() - previous.updatedAt.getTime() < 3_600_000;
    if (!alreadyQueued) await createNotification({
      audience: "ADMIN",
      type: "SYSTEM",
      title: "Testimoni baru menunggu ditinjau",
      message: `${data.displayName} · ${data.rating}/5 — ${data.message.slice(0, 120)}`,
      href: "/admin/testimoni",
    });

    return NextResponse.json({ item });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

// DELETE /api/user/testimonial — withdraw it
export async function DELETE(request: Request) {
  try {
    const session = await requireAuth(request);
    await prisma.testimonial.deleteMany({ where: { userId: session.user.id } });
    invalidateCached("landing:testimonials");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
