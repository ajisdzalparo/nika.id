import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { GUEST_ADDON_PRICE, GUEST_ADDON_SIZE, PAID_PLANS, getUpgradePrice, type PlanType } from "@/lib/limits";
import { createNotification } from "@/lib/notifications";
import { amountWithUniqueCode, getManualPaymentInfo } from "@/lib/payment";

// GET /api/payment/manual — active invitation's open manual order (if any) and where to transfer
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const active = await getActiveInvitation(session.user.id);
    const order = await prisma.transaction.findFirst({
      where: { userId: session.user.id, invitationId: active.id, paymentMethod: "MANUAL_TRANSFER", status: "PENDING" },
      orderBy: { createdAt: "desc" },
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

// POST /api/payment/manual { kind?: "PLAN" | "GUEST_ADDON", plan?, addonUnits?, invitationId? }
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const kind = body?.kind === "GUEST_ADDON" ? "GUEST_ADDON" : "PLAN";

    if (!(await getManualPaymentInfo()).manualEnabled) {
      return NextResponse.json({ error: "MANUAL_DISABLED", message: "Pembayaran manual sedang tidak tersedia" }, { status: 400 });
    }

    const active = await getActiveInvitation(session.user.id, typeof body?.invitationId === "string" ? body.invitationId : undefined);
    const currentPlan = (active.plan ?? "FREE") as PlanType;

    let price = 0;
    let plan: PlanType | null = null;
    let addonUnits = 0;

    if (kind === "GUEST_ADDON") {
      if (currentPlan === "FREE") {
        return NextResponse.json({ error: "PLAN_REQUIRED", message: "Pilih paket aktif terlebih dahulu sebelum menambah kuota tamu." }, { status: 400 });
      }
      if (currentPlan === "EKSKLUSIF") {
        return NextResponse.json({ error: "UNLIMITED_PLAN", message: "Paket Eksklusif sudah memiliki kuota tamu tanpa batas." }, { status: 400 });
      }
      const units = Number(body?.addonUnits ?? 1);
      if (!Number.isInteger(units) || units < 1 || units > 20) {
        return NextResponse.json({ error: "INVALID_UNITS", message: "Jumlah paket add-on harus 1–20." }, { status: 400 });
      }
      addonUnits = units;
      price = units * GUEST_ADDON_PRICE;
    } else {
      const target = body?.plan as PlanType;
      if (!PAID_PLANS.includes(target)) {
        return NextResponse.json({ error: "INVALID_PLAN", message: "Paket tidak valid" }, { status: 400 });
      }
      if (currentPlan === target) {
        return NextResponse.json({ error: "ALREADY_ACTIVE", message: "Paket ini sudah aktif untuk undangan ini" }, { status: 400 });
      }
      const diff = getUpgradePrice(currentPlan, target);
      if (diff === null) {
        return NextResponse.json({ error: "DOWNGRADE_NOT_ALLOWED", message: "Tidak dapat turun ke paket yang lebih rendah" }, { status: 400 });
      }
      plan = target;
      price = diff;
    }

    await prisma.transaction.updateMany({
      where: { userId: session.user.id, invitationId: active.id, paymentMethod: "MANUAL_TRANSFER", status: "PENDING" },
      data: { status: "FAILED", notes: "Dibatalkan: user membuat pesanan baru" },
    });

    const order = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        invitationId: active.id,
        kind,
        plan,
        addonUnits,
        amount: amountWithUniqueCode(price),
        status: "PENDING",
        paymentMethod: "MANUAL_TRANSFER",
        notes:
          kind === "GUEST_ADDON"
            ? `Add-on +${addonUnits * GUEST_ADDON_SIZE} tamu (${active.title})`
            : currentPlan !== "FREE"
              ? `Upgrade ${currentPlan} → ${plan} (${active.title})`
              : `Paket ${plan} (${active.title})`,
      },
    });
    const rupiahAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(order.amount);
    const label = kind === "GUEST_ADDON" ? `Add-on +${addonUnits * GUEST_ADDON_SIZE} tamu` : `Paket ${plan}`;
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

// DELETE /api/payment/manual — cancel the open order for active invitation
export async function DELETE(request: Request) {
  try {
    const session = await requireAuth(request);
    const active = await getActiveInvitation(session.user.id);
    await prisma.transaction.updateMany({
      where: { userId: session.user.id, invitationId: active.id, paymentMethod: "MANUAL_TRANSFER", status: "PENDING" },
      data: { status: "FAILED", notes: "Dibatalkan oleh user" },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
