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

  const { enabled, snap } = await getMidtransClients();
  if (!enabled) {
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
      return NextResponse.json({ error: "Pilih paket aktif terlebih dahulu" }, { status: 400 });
    }
    if (currentPlan === "EKSKLUSIF") {
      return NextResponse.json({ error: "Paket Eksklusif sudah tanpa batas tamu" }, { status: 400 });
    }
    const units = Number(body?.addonUnits ?? 1);
    if (!Number.isInteger(units) || units < 1 || units > 20) {
      return NextResponse.json({ error: "Invalid addon units" }, { status: 400 });
    }
    addonUnits = units;
    price = units * GUEST_ADDON_PRICE;
    itemId = `ADDON_GUEST_${units * GUEST_ADDON_SIZE}`;
    itemName = `Tambah +${units * GUEST_ADDON_SIZE} Tamu (${active.title})`;
  } else {
    const target = body?.plan as PlanType;
    if (!target || !PAID_PLANS.includes(target)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    const diff = getUpgradePrice(currentPlan, target);
    if (diff === null) {
      return NextResponse.json({ error: "Upgrade not available for this plan" }, { status: 400 });
    }
    plan = target;
    price = diff;
    itemId = target;
    itemName = currentPlan === "FREE" ? `Paket ${PLAN_LIMITS[target].name} (${active.title})` : `Upgrade ke ${PLAN_LIMITS[target].name} (${active.title})`;
  }

  try {
    const orderId = `TRX-${Date.now()}-${session.user.id.slice(0, 5)}`;

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
      },
    });

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

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { snapToken: token.token },
    });

    return NextResponse.json({ token: token.token });
  } catch (error) {
    console.error("Midtrans Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to create transaction", details: errorMessage }, { status: 500 });
  }
}
