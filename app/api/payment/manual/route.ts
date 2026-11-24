import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import type { PlanType } from "@/lib/limits";
import { createNotification } from "@/lib/notifications";
import { CheckoutOrderError, amountWithUniqueCode, getManualPaymentInfo, openOrderWhere, resolveCheckoutOrder } from "@/lib/payment";

const MANUAL_ORDER_SELECT = {
  id: true,
  kind: true,
  addonUnits: true,
  plan: true,
  amount: true,
  status: true,
  paymentProof: true,
  notes: true,
  createdAt: true,
} as const;

// GET /api/payment/manual — active invitation's open manual order (if any) and where to transfer
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const active = await getActiveInvitation(session.user.id);
    const order = await prisma.transaction.findFirst({
      where: openOrderWhere(session.user.id, active.id, "MANUAL_TRANSFER"),
      orderBy: { createdAt: "desc" },
      select: MANUAL_ORDER_SELECT,
    });
    return NextResponse.json({
      order,
      invitationId: active.id,
      invitationTitle: active.title,
      invitationSlug: active.slug,
      extraGuestQuota: active.extraGuestQuota ?? 0,
      currentPlan: (active.plan ?? "FREE") as PlanType,
      ...(await getManualPaymentInfo()),
    });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

// POST /api/payment/manual { kind?: "PLAN" | "GUEST_ADDON" | "AI_CREDIT", plan?, addonUnits?, packId?, invitationId? }
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json().catch(() => ({}));

    if (!(await getManualPaymentInfo()).manualEnabled) {
      return NextResponse.json({ error: "MANUAL_DISABLED", message: "Pembayaran manual sedang tidak tersedia" }, { status: 400 });
    }

    const { kind, price, discountAmount, referralCodeUsed, promoCodeUsed, plan, templateId, addonUnits, invitationId, activeId, label, notes } =
      await resolveCheckoutOrder(session.user.id, body);

    await prisma.transaction.updateMany({
      where: openOrderWhere(session.user.id, activeId, "MANUAL_TRANSFER"),
      data: { status: "FAILED", notes: "Dibatalkan: user membuat pesanan baru" },
    });

    const order = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        invitationId,
        kind,
        plan,
        templateId,
        addonUnits,
        amount: amountWithUniqueCode(price),
        discountAmount,
        referralCodeUsed,
        promoCodeUsed,
        status: "PENDING",
        paymentMethod: "MANUAL_TRANSFER",
        notes,
      },
      select: MANUAL_ORDER_SELECT,
    });
    const rupiahAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(order.amount);
    await Promise.all([
      createNotification({
        audience: "ADMIN",
        type: "TRANSACTION",
        title: `Pesanan manual baru · ${label}`,
        message: `${session.user.name || session.user.email} membuat pesanan ${label} (${rupiahAmount}).`,
        href: "/admin/transaksi",
      }),
      createNotification({
        audience: "USER",
        userId: session.user.id,
        type: "TRANSACTION",
        title: `Menunggu transfer · ${label}`,
        message: `Pesanan ${rupiahAmount} dibuat. Transfer dengan kode unik lalu unggah bukti bayar.`,
        href: "/upgrade",
      }),
    ]);
    return NextResponse.json({ order, ...(await getManualPaymentInfo()) }, { status: 201 });
  } catch (error) {
    if (error instanceof CheckoutOrderError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    console.error("Manual payment error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan" }, { status: 500 });
  }
}

// PATCH /api/payment/manual { orderId, proofUrl, senderName? } — submit transfer proof form
export async function PATCH(request: Request) {
  try {
    const session = await requireAuth(request);
    const { orderId, proofUrl, senderName } = await request.json();
    const base = (process.env.MINIO_PUBLIC_URL || "").replace(/\/+$/, "");
    if (typeof proofUrl !== "string" || !base || !proofUrl.startsWith(`${base}/`)) {
      return NextResponse.json({ error: "INVALID_PROOF", message: "Unggah bukti transfer lewat aplikasi" }, { status: 400 });
    }
    const order = await prisma.transaction.findFirst({ where: { id: orderId, userId: session.user.id, status: "PENDING" } });
    if (!order) return NextResponse.json({ error: "NOT_FOUND", message: "Pesanan tidak ditemukan" }, { status: 404 });

    const senderClean = typeof senderName === "string" ? senderName.trim().slice(0, 80) : "";
    const baseNote = (order.notes || "").split(" · Pengirim:")[0].trim();
    const nextNotes = senderClean ? `${baseNote}${baseNote ? " · " : ""}Pengirim: ${senderClean}` : order.notes;

    const updated = await prisma.transaction.update({
      where: { id: order.id },
      data: { paymentProof: proofUrl, notes: nextNotes },
      select: MANUAL_ORDER_SELECT,
    });
    const rupiahAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(updated.amount);
    await Promise.all([
      createNotification({
        audience: "ADMIN",
        type: "TRANSACTION",
        title: "Bukti transfer diunggah",
        message: `${session.user.name || session.user.email} mengunggah bukti transfer ${rupiahAmount} — perlu verifikasi.`,
        href: "/admin/transaksi",
      }),
      createNotification({
        audience: "USER",
        userId: session.user.id,
        type: "TRANSACTION",
        title: "Bukti transfer diterima",
        message: `Bukti transfer ${rupiahAmount} sedang menunggu verifikasi admin.`,
        href: "/upgrade",
      }),
    ]);
    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    console.error("Manual payment proof error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan" }, { status: 500 });
  }
}

// DELETE /api/payment/manual — cancel the open order for active invitation or user-level AI credit
export async function DELETE(request: Request) {
  try {
    const session = await requireAuth(request);
    const active = await getActiveInvitation(session.user.id);
    await prisma.transaction.updateMany({
      where: openOrderWhere(session.user.id, active.id, "MANUAL_TRANSFER"),
      data: { status: "FAILED", notes: "Dibatalkan oleh user" },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
