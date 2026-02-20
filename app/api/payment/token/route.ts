import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { snap } from "@/lib/midtrans";
import { PLAN_LIMITS, PlanType } from "@/lib/limits";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await req.json();

  if (!plan || !PLAN_LIMITS[plan as PlanType]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const selectedPlan = PLAN_LIMITS[plan as PlanType];

  if (selectedPlan.price === 0) {
    return NextResponse.json({ error: "Cannot pay for free plan" }, { status: 400 });
  }

  try {
    const orderId = `TRX-${Date.now()}-${session.user.id.slice(0, 5)}`;

    // Create database transaction record
    const transaction = await prisma.transaction.create({
      data: {
        id: orderId,
        userId: session.user.id,
        amount: selectedPlan.price,
        status: "PENDING",
        plan: plan,
        paymentMethod: "MIDTRANS",
      },
    });

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: selectedPlan.price,
      },
      customer_details: {
        first_name: session.user.name,
        email: session.user.email,
      },
      item_details: [
        {
          id: plan,
          price: selectedPlan.price,
          quantity: 1,
          name: `Upgrade to ${selectedPlan.name}`,
        },
      ],
    };

    const token = await snap.createTransaction(parameter);

    // Update transaction with snap token
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
