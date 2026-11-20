import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { PLAN_LIMITS, type PlanType } from "@/lib/limits";
import { amountWithUniqueCode, getManualPaymentInfo } from "@/lib/payment";

const PAID_PLANS = (Object.keys(PLAN_LIMITS) as PlanType[]).filter((p) => PLAN_LIMITS[p].price > 0);

// GET /api/payment/manual — the user's open manual order (if any) and where to transfer
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const order = await prisma.transaction.findFirst({
      where: { userId: session.user.id, paymentMethod: "MANUAL_TRANSFER", status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ order, ...getManualPaymentInfo() });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

// POST /api/payment/manual { plan } — start (or replace) a manual transfer order
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const { plan } = await request.json();
    if (!PAID_PLANS.includes(plan)) return NextResponse.json({ error: "INVALID_PLAN", message: "Paket tidak valid" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
    if (user?.plan === plan) return NextResponse.json({ error: "ALREADY_ACTIVE", message: "Paket ini sudah aktif" }, { status: 400 });

    // One open order at a time: cancel older unpaid manual orders
    await prisma.transaction.updateMany({
      where: { userId: session.user.id, paymentMethod: "MANUAL_TRANSFER", status: "PENDING" },
      data: { status: "FAILED", notes: "Dibatalkan: user memilih paket lain" },
    });

    const order = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        plan,
        amount: amountWithUniqueCode(PLAN_LIMITS[plan as PlanType].price),
        status: "PENDING",
        paymentMethod: "MANUAL_TRANSFER",
      },
    });
    return NextResponse.json({ order, ...getManualPaymentInfo() }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    console.error("Manual payment error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan" }, { status: 500 });
  }
}

// PATCH /api/payment/manual { orderId, proofUrl } — attach the transfer receipt
export async function PATCH(request: Request) {
  try {
    const session = await requireAuth(request);
    const { orderId, proofUrl } = await request.json();
    const base = (process.env.MINIO_PUBLIC_URL || "").replace(/\/+$/, "");
    if (typeof proofUrl !== "string" || !base || !proofUrl.startsWith(`${base}/`)) {
      return NextResponse.json({ error: "INVALID_PROOF", message: "Unggah bukti transfer lewat aplikasi" }, { status: 400 });
    }
    const order = await prisma.transaction.findFirst({ where: { id: orderId, userId: session.user.id, status: "PENDING" } });
    if (!order) return NextResponse.json({ error: "NOT_FOUND", message: "Pesanan tidak ditemukan" }, { status: 404 });

    const updated = await prisma.transaction.update({ where: { id: order.id }, data: { paymentProof: proofUrl } });
    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    console.error("Manual payment proof error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan" }, { status: 500 });
  }
}

// DELETE /api/payment/manual — cancel the open order
export async function DELETE(request: Request) {
  try {
    const session = await requireAuth(request);
    await prisma.transaction.updateMany({
      where: { userId: session.user.id, paymentMethod: "MANUAL_TRANSFER", status: "PENDING" },
      data: { status: "FAILED", notes: "Dibatalkan oleh user" },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
