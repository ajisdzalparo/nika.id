import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { AGENCY_QUOTA_VALID_DAYS, MAX_FREE_DRAFTS, MAX_FREE_DRAFTS_AGENCY } from "@/lib/limits";
import {
  ACTIVE_INVITATION_COOKIE,
  generateUniqueSlug,
  getActiveInvitation,
  isSlugTaken,
  listUserInvitations,
  sanitizeSlug,
} from "@/lib/active-invitation";
import { prisma } from "@/lib/prisma";
import { mitraQuotaUnitCost } from "@/lib/mitra";
import { normalizePhoneDigits } from "@/lib/phone";

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

    // Pricing is per invitation: new ones start as unpaid preview drafts. Cap the drafts so free
    // accounts can't hoard link slugs or storage; activating with agency quota doesn't count.
    if (body?.activateWithQuota !== true) {
      const [owner, draftCount] = await Promise.all([
        prisma.user.findUnique({ where: { id: session.user.id }, select: { accountType: true } }),
        prisma.invitation.count({ where: { userId: session.user.id, plan: "FREE" } }),
      ]);
      const maxDrafts = owner?.accountType === "AGENCY" ? MAX_FREE_DRAFTS_AGENCY : MAX_FREE_DRAFTS;
      if (draftCount >= maxDrafts) {
        return NextResponse.json(
          {
            error: "DRAFT_LIMIT",
            message: `Kamu sudah punya ${draftCount} undangan pratinjau yang belum aktif. Aktifkan paket salah satunya atau hapus yang tidak dipakai dulu.`,
          },
          { status: 403 },
        );
      }
    }

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
    const clientName = typeof body?.clientName === "string" ? body.clientName.trim().slice(0, 100) || null : null;
    const clientWhatsapp = typeof body?.clientWhatsapp === "string" ? normalizePhoneDigits(body.clientWhatsapp).slice(0, 20) || null : null;
    const clientEditToken = body?.generateClientLink === true ? crypto.randomBytes(16).toString("hex") : null;
    const activateWithQuota = body?.activateWithQuota === true;

    const invitation = await prisma.$transaction(async (tx) => {
      let plan: "FREE" | "PREMIUM" = "FREE";
      let planExpiresAt: Date | null = null;

      if (activateWithQuota) {
        const owner = await tx.user.findUnique({
          where: { id: session.user.id },
          select: { agencyQuota: true, agencyQuotaExpiresAt: true, accountType: true },
        });
        if (!owner || owner.accountType !== "AGENCY" || owner.agencyQuota < 1) {
          throw new Error("NO_QUOTA");
        }
        if (owner.agencyQuotaExpiresAt && owner.agencyQuotaExpiresAt.getTime() <= Date.now()) {
          throw new Error("QUOTA_EXPIRED");
        }
        const dec = await tx.user.updateMany({
          where: { id: session.user.id, agencyQuota: { gte: 1 } },
          data: { agencyQuota: { decrement: 1 } },
        });
        if (dec.count === 0) throw new Error("NO_QUOTA");
        plan = "PREMIUM";
        planExpiresAt = new Date(Date.now() + AGENCY_QUOTA_VALID_DAYS * 86_400_000);
      }

      return tx.invitation.create({
        data: {
          userId: session.user.id,
          title: title.slice(0, 100),
          slug,
          weddingDate: weddingDate && !Number.isNaN(weddingDate.getTime()) ? weddingDate : null,
          isPublic: typeof body?.isPublic === "boolean" ? body.isPublic : true,
          plan,
          planExpiresAt,
          ...(plan === "PREMIUM" ? { mitraCost: await mitraQuotaUnitCost(session.user.id, tx), activatedAt: new Date() } : {}),
          clientName,
          clientWhatsapp,
          clientEditToken,
          data: {},
        },
        include: {
          _count: { select: { guests: true, rsvps: true, messages: true } },
        },
      });
    });

    const res = NextResponse.json({ invitation }, { status: 201 });
    res.cookies.set(ACTIVE_INVITATION_COOKIE, invitation.id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  } catch (error) {
    if (error instanceof Error && error.message === "NO_QUOTA") {
      return NextResponse.json({ error: "NO_QUOTA", message: "Kuota mitra tidak mencukupi." }, { status: 402 });
    }
    if (error instanceof Error && error.message === "QUOTA_EXPIRED") {
      return NextResponse.json({ error: "QUOTA_EXPIRED", message: "Masa berlaku kuota mitra telah habis." }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "SLUG_TAKEN", message: "Slug tautan ini sudah dipakai." }, { status: 409 });
    }
    return apiErrorResponse(error, "Gagal membuat undangan");
  }
}
