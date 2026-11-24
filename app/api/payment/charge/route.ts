import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { createCoreCharge, MIDTRANS_CHANNELS, type MidtransChannel } from "@/lib/midtrans-core";
import { getMidtransClients } from "@/lib/midtrans";
import { CheckoutOrderError, openOrderWhere, resolveCheckoutOrder } from "@/lib/payment";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession(req, "user");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const channel = body?.channel as MidtransChannel;
    if (!MIDTRANS_CHANNELS.includes(channel)) {
      return NextResponse.json({ error: "INVALID_CHANNEL", message: "Pilih metode pembayaran yang tersedia" }, { status: 400 });
    }

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

    const orderId = `UY-${Date.now()}-${session.user.id.slice(0, 5)}`;

    const details = await createCoreCharge({
      orderId,
      amount: price,
      channel,
      customer: { first_name: session.user.name, email: session.user.email },
      item: { id: itemId, price, name: itemName },
    });

    // Supersede older pending Midtrans orders on the same invitation or user-level AI credit orders
    await prisma.transaction.updateMany({
      where: openOrderWhere(session.user.id, activeId, "MIDTRANS"),
      data: { status: "FAILED", notes: "Diganti metode pembayaran baru" },
    });

    const created = await prisma.transaction.create({
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
        snapToken: JSON.stringify(details),
        notes: `${channel} · ${itemName}${promoCodeUsed ? ` · Promo ${promoCodeUsed}` : referralCodeUsed ? ` · Kode ${referralCodeUsed}` : ""}`,
      },
    });

    return NextResponse.json({
      order: {
        id: created.id,
        kind: created.kind,
        addonUnits: created.addonUnits,
        plan: created.plan,
        amount: created.amount,
        createdAt: created.createdAt.toISOString(),
        ...details,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "MIDTRANS_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "MIDTRANS_NOT_CONFIGURED", message: "Midtrans belum dikonfigurasi. Gunakan Transfer Manual." },
        { status: 503 },
      );
    }
    console.error("[MIDTRANS_CHARGE_ERROR]", error);
    return NextResponse.json(
      {
        error: "CHARGE_FAILED",
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
