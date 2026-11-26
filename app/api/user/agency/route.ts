import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isValidPhoneDigits, normalizePhoneDigits } from "@/lib/phone";
import { getUserReferralSummary } from "@/lib/referral";
import { featureBlockedResponse } from "@/lib/feature-guard";

const AgencyProfileSchema = z.object({
  agencyName: z.string().trim().min(2, "Nama usaha minimal 2 karakter").max(80),
  agencyWhatsapp: z.string().trim().min(8, "Nomor WhatsApp bisnis tidak valid").max(25),
  agencyInstagram: z.string().trim().max(60).optional().or(z.literal("")),
  agencyLogo: z.string().trim().url().optional().or(z.literal("")).nullable(),
});

export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const userId = session.user.id;

    const [user, invitations, referral] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          accountType: true,
          agencyName: true,
          agencyWhatsapp: true,
          agencyInstagram: true,
          agencyLogo: true,
          agencyVerified: true,
          agencyQuota: true,
          agencyQuotaExpiresAt: true,
          aiCredits: true,
        },
      }),
      prisma.invitation.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          weddingDate: true,
          templateSlug: true,
          plan: true,
          planExpiresAt: true,
          isPublic: true,
          views: true,
          clientName: true,
          clientWhatsapp: true,
          clientEditToken: true,
          updatedAt: true,
          _count: { select: { guests: true, rsvps: true, messages: true } },
        },
      }),
      getUserReferralSummary(userId),
    ]);

    if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json({
      agency: {
        ...user,
        agencyQuotaExpiresAt: user.agencyQuotaExpiresAt ? user.agencyQuotaExpiresAt.toISOString() : null,
      },
      invitations: invitations.map((inv) => ({
        ...inv,
        weddingDate: inv.weddingDate ? inv.weddingDate.toISOString() : null,
        planExpiresAt: inv.planExpiresAt ? inv.planExpiresAt.toISOString() : null,
        updatedAt: inv.updatedAt.toISOString(),
      })),
      referral,
    });
  } catch (error) {
    return apiErrorResponse(error, "Gagal memuat data mitra");
  }
}

// PATCH /api/user/agency — 1-step activation & update of Agency profile
export async function PATCH(request: Request) {
  const blocked = await featureBlockedResponse("MITRA");
  if (blocked) return blocked;

  try {
    const session = await requireAuth(request);
    const parsed = AgencyProfileSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 },
      );
    }

    const cleanWa = normalizePhoneDigits(parsed.data.agencyWhatsapp);
    if (!isValidPhoneDigits(cleanWa)) {
      return NextResponse.json({ error: "INVALID_WHATSAPP", message: "Nomor WhatsApp bisnis tidak valid." }, { status: 400 });
    }
    const cleanIg = (parsed.data.agencyInstagram || "").replace(/^@+/, "").trim() || null;
    const cleanLogo = parsed.data.agencyLogo ? parsed.data.agencyLogo.trim() : null;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        accountType: "AGENCY",
        agencyName: parsed.data.agencyName,
        agencyWhatsapp: cleanWa,
        agencyInstagram: cleanIg,
        ...(parsed.data.agencyLogo !== undefined ? { agencyLogo: cleanLogo } : {}),
      },
      select: {
        accountType: true,
        agencyName: true,
        agencyWhatsapp: true,
        agencyInstagram: true,
        agencyLogo: true,
        agencyVerified: true,
        agencyQuota: true,
        agencyQuotaExpiresAt: true,
      },
    });

    return NextResponse.json({
      agency: {
        ...updated,
        agencyQuotaExpiresAt: updated.agencyQuotaExpiresAt ? updated.agencyQuotaExpiresAt.toISOString() : null,
      },
    });
  } catch (error) {
    return apiErrorResponse(error, "Gagal menyimpan profil mitra");
  }
}
