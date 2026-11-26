import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { ACTIVE_INVITATION_COOKIE, getActiveInvitationIdFromCookie, invitationAccessWhere, isSlugTaken, sanitizeSlug } from "@/lib/active-invitation";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const existing = await prisma.invitation.findFirst({ where: { id, ...invitationAccessWhere(session.user.id) } });
    if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const update: Record<string, unknown> = {};

    if (typeof body?.title === "string" && body.title.trim()) {
      update.title = body.title.trim().slice(0, 100);
    }
    if (typeof body?.isPublic === "boolean") {
      update.isPublic = body.isPublic;
    }
    if (typeof body?.slug === "string") {
      const nextSlug = sanitizeSlug(body.slug);
      if (nextSlug.length < 2) {
        return NextResponse.json({ error: "INVALID_SLUG", message: "Slug minimal 2 karakter." }, { status: 400 });
      }
      if (nextSlug !== existing.slug && (await isSlugTaken(nextSlug, existing.id))) {
        return NextResponse.json({ error: "SLUG_TAKEN", message: "Slug tautan sudah dipakai." }, { status: 409 });
      }
      update.slug = nextSlug;
    }
    // Mitra sales report: what the client paid the mitra (null clears it)
    if (body?.clientPrice !== undefined && existing.userId === session.user.id) {
      const price = body.clientPrice === null || body.clientPrice === "" ? null : Number(body.clientPrice);
      if (price !== null && (!Number.isInteger(price) || price < 0 || price > 100_000_000)) {
        return NextResponse.json({ error: "INVALID_PRICE", message: "Harga jual harus angka rupiah." }, { status: 400 });
      }
      update.clientPrice = price;
    }
    if (body?.weddingDate !== undefined) {
      update.weddingDate = body.weddingDate ? new Date(body.weddingDate) : null;
    }

    const updated = await prisma.invitation.update({
      where: { id: existing.id },
      data: update,
      include: { _count: { select: { guests: true, rsvps: true, messages: true } } },
    });

    return NextResponse.json({ invitation: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "SLUG_TAKEN", message: "Slug tautan sudah dipakai." }, { status: 409 });
    }
    return apiErrorResponse(error, "Gagal memperbarui undangan");
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    const all = await prisma.invitation.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    const target = all.find((x) => x.id === id);
    if (!target) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (all.length <= 1) {
      return NextResponse.json({ error: "LAST_INVITATION", message: "Minimal harus ada 1 undangan aktif di akun Anda." }, { status: 400 });
    }

    await prisma.invitation.delete({ where: { id } });

    const fallback = all.find((x) => x.id !== id);
    const currentCookie = await getActiveInvitationIdFromCookie();
    const res = NextResponse.json({ success: true, nextActiveId: fallback?.id ?? null });
    if (currentCookie === id && fallback) {
      res.cookies.set(ACTIVE_INVITATION_COOKIE, fallback.id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
    return res;
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    console.error("Delete invitation error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
