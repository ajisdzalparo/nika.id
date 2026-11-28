import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyMitraGranted } from "@/lib/mitra";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";

const VALID_ROLES = ["USER", "admin"];

class LastAdminError extends Error {}
const LAST_ADMIN_RESPONSE = { error: "LAST_ADMIN", message: "Harus tersisa minimal satu admin." };

/**
 * Runs a change that removes admin rights from `targetId` (delete or demote) only if another admin remains.
 * Serializable isolation: if two admins remove each other at the same moment, one transaction fails instead of
 * both succeeding and leaving no admin at all.
 */
async function withOtherAdminRemaining<T>(targetId: string, change: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(
    async (tx) => {
      const target = await tx.user.findUnique({ where: { id: targetId }, select: { role: true } });
      if (target?.role?.toLowerCase() === "admin") {
        const others = await tx.user.count({ where: { role: { equals: "admin", mode: "insensitive" }, id: { not: targetId } } });
        if (others === 0) throw new LastAdminError();
      }
      return change(tx);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

// GET /api/users/[id] - get user details
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        invitations: true,
        _count: {
          select: {
            guests: true,
            rsvps: true,
            messages: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return apiErrorResponse(error, "Gagal memuat pengguna");
  }
}

// PATCH /api/users/[id] - update user role or agency verification / quota
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { role, agencyVerified, accountType, addAgencyQuota } = body;

    const data: Record<string, unknown> = {};

    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: "INVALID_ROLE", allowed: VALID_ROLES }, { status: 400 });
      }
      if (id === session.user.id && role !== "admin") {
        return NextResponse.json({ error: "CANNOT_DEMOTE_SELF" }, { status: 400 });
      }
      data.role = role;
    }

    if (typeof agencyVerified === "boolean") {
      data.agencyVerified = agencyVerified;
    }
    // Mitra status is granted by an admin only; verified follows it
    let grantingMitra = false;
    if (accountType === "PERSONAL" || accountType === "AGENCY") {
      const before = await prisma.user.findUnique({ where: { id }, select: { accountType: true } });
      grantingMitra = accountType === "AGENCY" && before?.accountType !== "AGENCY";
      data.accountType = accountType;
      data.agencyVerified = accountType === "AGENCY";
    }
    if (typeof addAgencyQuota === "number" && Number.isInteger(addAgencyQuota) && addAgencyQuota > 0 && addAgencyQuota <= 500) {
      data.accountType = "AGENCY";
      data.agencyVerified = true;
      data.agencyQuota = { increment: addAgencyQuota };
      data.agencyQuotaExpiresAt = new Date(Date.now() + 365 * 86_400_000);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "NO_UPDATES" }, { status: 400 });
    }

    const user =
      data.role && data.role !== "admin"
        ? await withOtherAdminRemaining(id, (tx) => tx.user.update({ where: { id }, data }))
        : await prisma.user.update({ where: { id }, data });
    if (grantingMitra) await notifyMitraGranted(id);

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof LastAdminError) return NextResponse.json(LAST_ADMIN_RESPONSE, { status: 400 });
    return apiErrorResponse(error, "Gagal memperbarui pengguna");
  }
}

// DELETE /api/users/[id] - delete user
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin(request);
    const { id } = await params;

    // Safety: admin cannot delete their own account
    if (id === session.user.id) {
      return NextResponse.json({ error: "CANNOT_DELETE_SELF" }, { status: 400 });
    }

    await withOtherAdminRemaining(id, (tx) => tx.user.delete({ where: { id } }));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof LastAdminError) return NextResponse.json(LAST_ADMIN_RESPONSE, { status: 400 });
    return apiErrorResponse(error, "Gagal menghapus pengguna");
  }
}
