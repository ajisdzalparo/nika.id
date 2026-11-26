import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";
import { createNotification } from "@/lib/notifications";
import { createMitraTrialCode, grantMitra } from "@/lib/mitra";
import { prisma } from "@/lib/prisma";

const ReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  adminNote: z.string().trim().max(500).optional(),
  /** On approval: free trial invitations via a 100% promo code (0 = no trial) */
  trialInvites: z.number().int().min(0).max(10).optional(),
  trialDays: z.number().int().min(1).max(90).optional(),
});

// PATCH /api/admin/mitra-applications/[id] — approve (account becomes mitra) or reject a join request
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const parsed = ReviewSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR", message: "Aksi tidak valid" }, { status: 400 });
    const { action, adminNote, trialInvites = 0, trialDays = 30 } = parsed.data;

    const app = await prisma.mitraApplication.findUnique({ where: { id } });
    if (!app) return NextResponse.json({ error: "NOT_FOUND", message: "Pengajuan tidak ditemukan" }, { status: 404 });
    if (app.status !== "PENDING") {
      return NextResponse.json({ error: "ALREADY_REVIEWED", message: "Pengajuan ini sudah ditinjau." }, { status: 400 });
    }

    // Link to the applicant's account: the one they applied from, else an account with the same email
    const user = app.userId
      ? await prisma.user.findUnique({ where: { id: app.userId }, select: { id: true } })
      : await prisma.user.findFirst({ where: { email: { equals: app.email, mode: "insensitive" } }, select: { id: true } });

    let trial: { code: string; expiresAt: Date } | null = null;
    if (action === "APPROVE") {
      if (!user) {
        return NextResponse.json(
          { error: "NO_ACCOUNT", message: `Belum ada akun dengan email ${app.email}. Minta pendaftar membuat akun dulu, lalu setujui lagi.` },
          { status: 400 },
        );
      }
      await grantMitra(user.id, { agencyName: app.businessName || app.name, agencyWhatsapp: app.whatsapp, agencyInstagram: app.instagram });
      if (trialInvites > 0) trial = await createMitraTrialCode(user.id, trialInvites, trialDays);
    } else if (user) {
      await createNotification({
        audience: "USER",
        userId: user.id,
        type: "SYSTEM",
        title: "Pengajuan Mitra belum disetujui",
        message: adminNote || "Hubungi admin lewat WhatsApp kalau ingin tahu alasannya atau mengajukan ulang.",
        href: "/mitra",
      });
    }

    const updated = await prisma.mitraApplication.update({
      where: { id },
      data: { status: action === "APPROVE" ? "APPROVED" : "REJECTED", adminNote: adminNote || null, reviewedAt: new Date(), userId: user?.id ?? app.userId },
    });
    return NextResponse.json({ application: { id: updated.id, status: updated.status, userId: updated.userId }, trialCode: trial?.code ?? null });
  } catch (error) {
    return apiErrorResponse(error, "Gagal meninjau pengajuan");
  }
}
