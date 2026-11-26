import { cookies } from "next/headers";
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
import { getAiQuota } from "@/lib/ai-design/server";
import { getCatalog } from "@/lib/catalog";
import { getMidtransConfig } from "@/lib/midtrans";
import { getManualPaymentInfo, openOrderWhere } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { REFERRAL_COOKIE, resolveReferralForBuyer } from "@/lib/referral";
import { getPlanPrices } from "@/lib/system-settings";
import type { PlanType } from "@/lib/limits";

export default async function UpgradePage({
  searchParams,
}: {
  searchParams?: Promise<{ pilih?: string; templateId?: string }>;
}) {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");

  const resolvedParams = searchParams ? await searchParams : {};
  const active = await getActiveInvitation(session.user.id);
  const currentPlan = (active.plan ?? "FREE") as PlanType;
  const cookieStore = await cookies();
  const refCookie = cookieStore.get(REFERRAL_COOKIE)?.value;

  const [catalogItems, manualInfo, midtrans, aiQuota, userMeta, referralRes, txRows, openManualOrder, openMidtransOrder, planPrices] = await Promise.all([
    getCatalog(),
    getManualPaymentInfo(),
    getMidtransConfig(),
    getAiQuota(session.user.id, currentPlan),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { agencyQuota: true, accountType: true } }),
    resolveReferralForBuyer({ buyerId: session.user.id, buyerEmail: session.user.email, rawCode: refCookie }),
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        invitation: { select: { title: true } },
      },
    }),
    prisma.transaction.findFirst({
      where: openOrderWhere(session.user.id, active.id, "MANUAL_TRANSFER"),
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findFirst({
      where: openOrderWhere(session.user.id, active.id, "MIDTRANS"),
      orderBy: { createdAt: "desc" },
    }),
    getPlanPrices(),
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
    invitationTitle:
      t.kind === "AI_CREDIT"
        ? "Kredit per akun"
        : t.kind === "AGENCY_QUOTA"
          ? "Kuota Mitra (per akun)"
          : (t.invitation?.title ?? active.title),
    createdAt: t.createdAt.toISOString(),
  }));

  const selectedMarketplaceItem = resolvedParams?.templateId
    ? catalogItems.find((c) => c.id === resolvedParams.templateId && c.price > 0) ?? null
    : null;
  const initialMarketplaceTemplate = selectedMarketplaceItem
    ? {
        id: selectedMarketplaceItem.id,
        slug: selectedMarketplaceItem.slug,
        name: selectedMarketplaceItem.name,
        category: selectedMarketplaceItem.category,
        price: selectedMarketplaceItem.price,
        creatorName: selectedMarketplaceItem.creatorName ?? null,
      }
    : null;

  const initialKind =
    resolvedParams?.pilih === "template" && initialMarketplaceTemplate
      ? "MARKETPLACE"
      : resolvedParams?.pilih === "kredit"
        ? "AI_CREDIT"
        : resolvedParams?.pilih === "mitra" && userMeta?.accountType === "AGENCY"
          ? "AGENCY_QUOTA"
          : undefined;

  const initialReferral =
    referralRes.valid && referralRes.code
      ? { code: referralRes.code, referrerName: referralRes.referrerName || "Mitra SatuMoment", isAgency: referralRes.referrerIsAgency }
      : null;

  return (
    <>
      <SiteHeader user={session.user} />
      <UpgradeCheckout
        invitationId={active.id}
        invitationTitle={active.title}
        currentPlan={currentPlan}
        planExpiresAt={active.planExpiresAt ? active.planExpiresAt.toISOString() : null}
        extraGuestQuota={active.extraGuestQuota ?? 0}
        agencyQuota={userMeta?.agencyQuota ?? 0}
        isMitra={userMeta?.accountType === "AGENCY"}
        planPrices={planPrices}
        aiQuota={aiQuota}
        initialKind={initialKind}
        initialMarketplaceTemplate={initialMarketplaceTemplate}
        initialReferral={initialReferral}
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
