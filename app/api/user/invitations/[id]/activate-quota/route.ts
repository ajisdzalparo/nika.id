import { NextResponse } from "next/server";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { AGENCY_QUOTA_VALID_DAYS } from "@/lib/limits";
import { prisma } from "@/lib/prisma";

// POST /api/user/invitations/[id]/activate-quota — activates an invitation as PREMIUM (365 days) using 1 agency quota
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const [user, inv] = await Promise.all([
        tx.user.findUnique({
          where: { id: session.user.id },
          select: { agencyQuota: true, agencyQuotaExpiresAt: true },
        }),
        tx.invitation.findFirst({
          where: { id, userId: session.user.id },
          select: { id: true, plan: true, title: true },
        }),
      ]);

      if (!inv) return { error: "NOT_FOUND" as const };
      if (!user || user.agencyQuota < 1) {
        return { error: "NO_QUOTA" as const };
      }
      if (user.agencyQuotaExpiresAt && user.agencyQuotaExpiresAt.getTime() <= Date.now()) {
        return { error: "QUOTA_EXPIRED" as const };
      }
      if (inv.plan !== "FREE") {
        return { error: "ALREADY_ACTIVE" as const };
      }

      const dec = await tx.user.updateMany({
        where: { id: session.user.id, agencyQuota: { gte: 1 } },
        data: { agencyQuota: { decrement: 1 } },
      });
      if (dec.count === 0) {
        return { error: "NO_QUOTA" as const };
      }

      const expiresAt = new Date(Date.now() + AGENCY_QUOTA_VALID_DAYS * 86_400_000);
      const updatedInv = await tx.invitation.update({
        where: { id: inv.id },
        data: { plan: "PREMIUM", planExpiresAt: expiresAt, isPublic: true },
        select: { id: true, plan: true, planExpiresAt: true, isPublic: true },
      });

      return { ok: true as const, invitation: updatedInv, remainingQuota: user.agencyQuota - 1 };
    });

    if ("error" in result) {
      if (result.error === "NOT_FOUND") return NextResponse.json({ error: "NOT_FOUND", message: "Undangan tidak ditemukan" }, { status: 404 });
      if (result.error === "ALREADY_ACTIVE") return NextResponse.json({ error: "ALREADY_ACTIVE", message: "Undangan ini sudah memiliki paket aktif." }, { status: 400 });
      if (result.error === "QUOTA_EXPIRED") return NextResponse.json({ error: "QUOTA_EXPIRED", message: "Masa berlaku kuota mitra telah habis." }, { status: 400 });
      return NextResponse.json({ error: "NO_QUOTA", message: "Kuota mitra Anda habis. Beli paket kuota di halaman Upgrade." }, { status: 402 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error, "Gagal mengaktifkan undangan dengan kuota mitra");
  }
}
