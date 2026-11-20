import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import {
  UpgradeCheckout,
  type CheckoutOrder,
  type MidtransSnapOrder,
  type TransactionHistoryItem,
} from "@/components/user/upgrade-checkout";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { getCatalog } from "@/lib/catalog";
import { getMidtransConfig } from "@/lib/midtrans";
import { getManualPaymentInfo } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import type { PlanType } from "@/lib/limits";

export default async function UpgradePage() {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");

  const [active, catalogItems, manualInfo, midtrans, txRows] = await Promise.all([
    getActiveInvitation(session.user.id),
    getCatalog(),
    getManualPaymentInfo(),
    getMidtransConfig(),
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        invitation: { select: { title: true } },
      },
    }),
  ]);

  const [openManualOrder, openMidtransOrder] = await Promise.all([
    prisma.transaction.findFirst({
      where: {
        userId: session.user.id,
        invitationId: active.id,
        paymentMethod: "MANUAL_TRANSFER",
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findFirst({
      where: {
        userId: session.user.id,
        invitationId: active.id,
        paymentMethod: "MIDTRANS",
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const initialOrder: CheckoutOrder | null = openManualOrder
    ? {
        id: openManualOrder.id,
        kind: openManualOrder.kind,
        addonUnits: openManualOrder.addonUnits,
        plan: (openManualOrder.plan as PlanType | null) ?? null,
        amount: openManualOrder.amount,
        paymentProof: openManualOrder.paymentProof,
        createdAt: openManualOrder.createdAt.toISOString(),
      }
    : null;

  const initialSnapOrder: MidtransSnapOrder | null =
    openMidtransOrder?.snapToken && !openMidtransOrder.snapToken.startsWith("{")
      ? {
          id: openMidtransOrder.id,
          token: openMidtransOrder.snapToken,
          kind: openMidtransOrder.kind,
          addonUnits: openMidtransOrder.addonUnits,
          plan: (openMidtransOrder.plan as PlanType | null) ?? null,
          amount: openMidtransOrder.amount,
          createdAt: openMidtransOrder.createdAt.toISOString(),
        }
      : null;

  const initialTransactions: TransactionHistoryItem[] = txRows.map((t) => ({
    id: t.id,
    kind: t.kind,
    addonUnits: t.addonUnits,
    plan: (t.plan as PlanType | null) ?? null,
    amount: t.amount,
    status: t.status,
    paymentMethod: t.paymentMethod ?? "MANUAL_TRANSFER",
    paymentProof: t.paymentProof,
    notes: t.notes,
    invitationTitle: t.invitation?.title ?? active.title,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <>
      <SiteHeader user={session.user} />
      <UpgradeCheckout
        invitationId={active.id}
        invitationTitle={active.title}
        currentPlan={(active.plan ?? "FREE") as PlanType}
        extraGuestQuota={active.extraGuestQuota ?? 0}
        initialOrder={initialOrder}
        initialSnapOrder={initialSnapOrder}
        initialTransactions={initialTransactions}
        initialBanks={manualInfo.banks}
        initialWhatsapp={manualInfo.whatsapp}
        initialQris={manualInfo.qrisImage}
        manualEnabled={manualInfo.manualEnabled}
        catalogItems={catalogItems}
        midtrans={{
          enabled: midtrans.checkoutEnabled,
          clientKey: midtrans.clientKey,
          isProduction: midtrans.isProduction,
        }}
      />
    </>
  );
}
