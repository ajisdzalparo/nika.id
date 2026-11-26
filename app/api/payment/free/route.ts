import { NextResponse } from "next/server";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { activateTransaction, CheckoutOrderError, resolveCheckoutOrder } from "@/lib/payment";
import { prisma } from "@/lib/prisma";

// POST /api/payment/free — completes an order a 100% promo code made free (e.g. a mitra trial), no gateway.
// The server recomputes the price; anything above Rp0 is refused here.
export async function POST(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const order = await resolveCheckoutOrder(session.user.id, body);
    if (order.price !== 0 || !order.promoCodeUsed) {
      return NextResponse.json({ error: "NOT_FREE", message: "Pesanan ini tidak gratis. Lanjutkan dengan pembayaran." }, { status: 400 });
    }

    const t = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        invitationId: order.invitationId,
        kind: order.kind,
        plan: order.plan,
        templateId: order.templateId,
        addonUnits: order.addonUnits,
        amount: 0,
        discountAmount: order.discountAmount,
        referralCodeUsed: order.referralCodeUsed,
        promoCodeUsed: order.promoCodeUsed,
        status: "PENDING",
        paymentMethod: "PROMO",
        notes: order.notes,
      },
      select: { id: true },
    });
    await activateTransaction(t.id);
    return NextResponse.json({ ok: true, transactionId: t.id, label: order.label });
  } catch (error) {
    if (error instanceof CheckoutOrderError) return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    return apiErrorResponse(error, "Gagal mengaktifkan pesanan gratis");
  }
}
