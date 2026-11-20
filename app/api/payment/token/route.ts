import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { getMidtransClients } from "@/lib/midtrans";
import { getActiveInvitation } from "@/lib/active-invitation";
import { GUEST_ADDON_PRICE, GUEST_ADDON_SIZE, PAID_PLANS, PLAN_LIMITS, getUpgradePrice, type PlanType } from "@/lib/limits";
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

  const body = await req.json();
  const kind = body?.kind === "GUEST_ADDON" ? "GUEST_ADDON" : "PLAN";

  const active = await getActiveInvitation(session.user.id, typeof body?.invitationId === "string" ? body.invitationId : undefined);
  const currentPlan = (active.plan ?? "FREE") as PlanType;

  let price = 0;
  let plan: PlanType | null = null;
  let addonUnits = 0;
  let itemId = "";
  let itemName = "";

  if (kind === "GUEST_ADDON") {
    if (currentPlan === "FREE") {
      return NextResponse.json({ error: "PLAN_REQUIRED", message: "Pilih paket aktif terlebih dahulu" }, { status: 400 });
    }
    if (currentPlan === "EKSKLUSIF") {
      return NextResponse.json({ error: "UNLIMITED_PLAN", message: "Paket Eksklusif sudah tanpa batas tamu" }, { status: 400 });
    }
    const units = Number(body?.addonUnits ?? 1);
    if (!Number.isInteger(units) || units < 1 || units > 20) {
      return NextResponse.json({ error: "INVALID_UNITS", message: "Jumlah paket add-on harus 1–20" }, { status: 400 });
    }
    addonUnits = units;
    price = units * GUEST_ADDON_PRICE;
    itemId = `ADDON_GUEST_${units * GUEST_ADDON_SIZE}`;
    itemName = `Tambah +${units * GUEST_ADDON_SIZE} Tamu (${active.title})`;
  } else {
    const target = body?.plan as PlanType;
    if (!target || !PAID_PLANS.includes(target)) {
      return NextResponse.json({ error: "INVALID_PLAN", message: "Paket tidak valid" }, { status: 400 });
    }
    const diff = getUpgradePrice(currentPlan, target);
    if (diff === null) {
      return NextResponse.json({ error: "UPGRADE_NOT_ALLOWED", message: "Upgrade tidak tersedia untuk paket ini" }, { status: 400 });
    }
    plan = target;
    price = diff;
    itemId = target;
    itemName = currentPlan === "FREE" ? `Paket ${PLAN_LIMITS[target].name} (${active.title})` : `Upgrade ${PLAN_LIMITS[target].name} (${active.title})`;
  }

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

    // Supersede older pending Midtrans orders on the same invitation
    await prisma.transaction.updateMany({
      where: { userId: session.user.id, invitationId: active.id, paymentMethod: "MIDTRANS", status: "PENDING" },
      data: { status: "FAILED", notes: "Diganti transaksi baru" },
    });

    const transaction = await prisma.transaction.create({
      data: {
        id: orderId,
        userId: session.user.id,
        invitationId: active.id,
        kind,
        addonUnits,
        amount: price,
        status: "PENDING",
        plan,
        paymentMethod: "MIDTRANS",
        snapToken: token.token,
        notes: `Midtrans Snap · ${itemName}`,
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
