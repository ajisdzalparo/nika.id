import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import {
  ACTIVE_INVITATION_COOKIE,
  generateUniqueSlug,
  getActiveInvitation,
  isSlugTaken,
  listUserInvitations,
  sanitizeSlug,
} from "@/lib/active-invitation";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const [invitations, active] = await Promise.all([
      listUserInvitations(session.user.id),
      getActiveInvitation(session.user.id),
    ]);
    return NextResponse.json({ invitations, activeId: active.id });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    console.error("List invitations error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const title = String(body?.title ?? "").trim() || "Undangan Pernikahan";
    const requestedSlug = typeof body?.slug === "string" && body.slug.trim() ? sanitizeSlug(body.slug) : "";

    let slug: string;
    if (requestedSlug) {
      if (requestedSlug.length < 2) {
        return NextResponse.json({ error: "INVALID_SLUG", message: "Slug minimal 2 karakter (huruf, angka, tanda hubung)." }, { status: 400 });
      }
      if (await isSlugTaken(requestedSlug)) {
        return NextResponse.json({ error: "SLUG_TAKEN", message: "Slug tautan ini sudah dipakai atau tidak tersedia." }, { status: 409 });
      }
      slug = requestedSlug;
    } else {
      slug = await generateUniqueSlug(title);
    }

    const weddingDate = body?.weddingDate ? new Date(body.weddingDate) : null;
    const invitation = await prisma.invitation.create({
      data: {
        userId: session.user.id,
        title: title.slice(0, 100),
        slug,
        weddingDate: weddingDate && !Number.isNaN(weddingDate.getTime()) ? weddingDate : null,
        isPublic: typeof body?.isPublic === "boolean" ? body.isPublic : true,
        plan: "FREE",
        data: {},
      },
      include: {
        _count: { select: { guests: true, rsvps: true, messages: true } },
      },
    });

    const res = NextResponse.json({ invitation }, { status: 201 });
    res.cookies.set(ACTIVE_INVITATION_COOKIE, invitation.id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "SLUG_TAKEN", message: "Slug tautan ini sudah dipakai." }, { status: 409 });
    }
    return apiErrorResponse(error, "Gagal membuat undangan");
  }
}
