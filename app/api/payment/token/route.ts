import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { getMidtransClients } from "@/lib/midtrans";
import { CheckoutOrderError, openOrderWhere, resolveCheckoutOrder } from "@/lib/payment";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getSession(req, "user");

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { checkoutEnabled, snap } = await getMidtransClients();
  if (!checkoutEnabled) {
    return NextResponse.json(
      { error: "MIDTRANS_NOT_CONFIGURED", message: "Pembayaran otomatis belum dikonfigurasi di server. Gunakan Transfer Manual." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));
  let resolved;
  try {
    resolved = await resolveCheckoutOrder(session.user.id, body);
  } catch (error) {
    if (error instanceof CheckoutOrderError) {
      return NextResponse.json({ error: error.code, message: error.message }, { status: error.status });
    }
    throw error;
  }

  const { kind, price, discountAmount, referralCodeUsed, promoCodeUsed, plan, templateId, addonUnits, invitationId, activeId, itemId, itemName } = resolved;

  try {
    const orderId = `TRX-${Date.now()}-${session.user.id.slice(0, 5)}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: price,
      },
      customer_details: {
        first_name: session.user.name,
        email: session.user.email,
      },
      item_details: [
        {
          id: itemId,
          price,
          quantity: 1,
          name: itemName.slice(0, 50),
        },
      ],
    };

    const token = await snap.createTransaction(parameter);

    // Supersede older pending Midtrans orders on the same invitation or user-level AI credit orders
    await prisma.transaction.updateMany({
      where: openOrderWhere(session.user.id, activeId, "MIDTRANS"),
      data: { status: "FAILED", notes: "Diganti transaksi baru" },
    });

    const transaction = await prisma.transaction.create({
      data: {
        id: orderId,
        userId: session.user.id,
        invitationId,
        kind,
        addonUnits,
        amount: price,
        discountAmount,
        referralCodeUsed,
        promoCodeUsed,
        status: "PENDING",
        plan,
        templateId,
        paymentMethod: "MIDTRANS",
        snapToken: token.token,
        notes: `Midtrans Snap · ${itemName}${promoCodeUsed ? ` · Promo ${promoCodeUsed}` : referralCodeUsed ? ` · Kode ${referralCodeUsed}` : ""}`,
      },
    });

    return NextResponse.json({
      token: token.token,
      order: {
        id: transaction.id,
        token: token.token,
        kind: transaction.kind,
        addonUnits: transaction.addonUnits,
        plan: transaction.plan,
        amount: transaction.amount,
        createdAt: transaction.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Midtrans Error:", error);
    return NextResponse.json(
      {
        error: "SNAP_FAILED",
        message: "Layanan pembayaran otomatis sedang mengalami kendala. Silakan coba sesaat lagi atau gunakan Transfer Manual.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession(req, "user");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (orderId) {
      const tx = await prisma.transaction.findFirst({
        where: { id: orderId, userId: session.user.id, paymentMethod: "MIDTRANS", status: "PENDING" },
      });
      if (tx) {
        const { enabled, core } = await getMidtransClients();
        if (enabled) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (core as any).transaction.cancel(tx.id).catch(() => {});
        }
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { status: "FAILED", notes: "Dibatalkan oleh user" },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
