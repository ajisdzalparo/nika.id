import { prisma } from "@/lib/prisma";
import { getActiveInvitation } from "@/lib/active-invitation";
import {
  AGENCY_QUOTA_VALID_DAYS,
  GUEST_ADDON_PRICE,
  GUEST_ADDON_SIZE,
  PAID_PLANS,
  PLAN_LIMITS,
  REFERRAL_COMMISSION_RATE,
  REFERRAL_HOLD_DAYS,
  REFERRAL_MAX_COMMISSION,
  computeReferralDiscount,
  getAgencyPack,
  getAgencyPackByQuota,
  getAiCreditPack,
  getUpgradePrice,
  type PlanType,
} from "@/lib/limits";
import { createNotification } from "@/lib/notifications";
import { LEDGER_ACCOUNT, recordPaymentRevenue } from "@/lib/ledger";
import { resolveReferralForBuyer, sanitizeReferralCode } from "@/lib/referral";
import { resolvePromoCode, sanitizePromoCode } from "@/lib/promo";
import { getSystemSettings, type BankAccount } from "@/lib/system-settings";

export type { BankAccount };

export type TransactionKind = "PLAN" | "GUEST_ADDON" | "AI_CREDIT" | "AGENCY_QUOTA" | "MARKETPLACE";

export class CheckoutOrderError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function openOrderWhere(userId: string, activeInvitationId: string, paymentMethod?: "MIDTRANS" | "MANUAL_TRANSFER") {
  return {
    userId,
    status: "PENDING",
    ...(paymentMethod ? { paymentMethod } : {}),
    OR: [
      { invitationId: activeInvitationId },
      { invitationId: null, kind: { in: ["AI_CREDIT", "AGENCY_QUOTA"] } },
    ],
  };
}

/** Validates and computes pricing/metadata for PLAN, GUEST_ADDON, AI_CREDIT, or AGENCY_QUOTA orders (plus referral discount). */
export async function resolveCheckoutOrder(
  userId: string,
  body: Record<string, unknown> | null | undefined,
): Promise<{
  kind: TransactionKind;
  basePrice: number;
  price: number;
  discountAmount: number;
  referralCodeUsed: string | null;
  promoCodeUsed: string | null;
  plan: PlanType | null;
  templateId: string | null;
  addonUnits: number;
  invitationId: string | null;
  activeId: string;
  itemId: string;
  itemName: string;
  label: string;
  notes: string;
}> {
  const rawKind = body?.kind;
  const kind: TransactionKind =
    rawKind === "GUEST_ADDON"
      ? "GUEST_ADDON"
      : rawKind === "AI_CREDIT"
        ? "AI_CREDIT"
        : rawKind === "AGENCY_QUOTA"
          ? "AGENCY_QUOTA"
          : rawKind === "MARKETPLACE"
            ? "MARKETPLACE"
            : "PLAN";
  const active = await getActiveInvitation(userId, typeof body?.invitationId === "string" ? body.invitationId : undefined);
  const currentPlan = (active.plan ?? "FREE") as PlanType;

  let baseOrder: {
    basePrice: number;
    plan: PlanType | null;
    templateId: string | null;
    addonUnits: number;
    invitationId: string | null;
    itemId: string;
    itemName: string;
    label: string;
    notes: string;
  };

  if (kind === "MARKETPLACE") {
    const tplId = typeof body?.templateId === "string" ? body.templateId : "";
    const tpl = tplId
      ? await prisma.catalogTemplate.findUnique({
          where: { id: tplId },
          select: { id: true, name: true, price: true, isActive: true, reviewStatus: true, creatorId: true },
        })
      : null;
    if (!tpl || !tpl.isActive || tpl.reviewStatus !== "APPROVED" || tpl.price <= 0) {
      throw new CheckoutOrderError(400, "INVALID_TEMPLATE", "Template marketplace tidak tersedia.");
    }
    if (tpl.creatorId && tpl.creatorId === userId) {
      throw new CheckoutOrderError(400, "OWN_TEMPLATE", "Anda pembuat template ini — bisa langsung dipakai gratis.");
    }
    const existingPurchase = await prisma.templatePurchase.findUnique({
      where: { invitationId_templateId: { invitationId: active.id, templateId: tpl.id } },
      select: { id: true },
    });
    if (existingPurchase) {
      throw new CheckoutOrderError(400, "ALREADY_PURCHASED", "Template ini sudah dibeli untuk undangan aktif.");
    }
    baseOrder = {
      basePrice: tpl.price,
      plan: null,
      templateId: tpl.id,
      addonUnits: 1,
      invitationId: active.id,
      itemId: `TPL_${tpl.id.slice(0, 12)}`,
      itemName: `Template ${tpl.name} (${active.title})`,
      label: `Template ${tpl.name}`,
      notes: `Marketplace · ${tpl.name} (${active.title})`,
    };
  } else if (kind === "AGENCY_QUOTA") {
    const pack = getAgencyPack(typeof body?.packId === "string" ? body.packId : undefined);
    if (!pack) {
      throw new CheckoutOrderError(400, "INVALID_PACK", "Paket kuota mitra tidak valid.");
    }
    baseOrder = {
      basePrice: pack.price,
      plan: null,
      templateId: null,
      addonUnits: pack.quota,
      invitationId: null,
      itemId: pack.id,
      itemName: `${pack.label} (${pack.quota} undangan)`,
      label: pack.label,
      notes: `${pack.label} · ${pack.quota} kuota undangan Premium (12 bulan)`,
    };
  } else if (kind === "AI_CREDIT") {
    const pack = getAiCreditPack(typeof body?.packId === "string" ? body.packId : undefined);
    if (!pack) {
      throw new CheckoutOrderError(400, "INVALID_PACK", "Paket kredit AI tidak valid.");
    }
    baseOrder = {
      basePrice: pack.price,
      plan: null,
      templateId: null,
      addonUnits: pack.credits,
      invitationId: null,
      itemId: pack.id,
      itemName: `Top-up ${pack.credits} Kredit AI`,
      label: `Top-up ${pack.credits} Kredit AI`,
      notes: `Top-up ${pack.credits} Kredit AI (per akun)`,
    };
  } else if (kind === "GUEST_ADDON") {
    if (currentPlan === "FREE") {
      throw new CheckoutOrderError(400, "PLAN_REQUIRED", "Pilih paket aktif terlebih dahulu sebelum menambah kuota tamu.");
    }
    if (currentPlan === "EKSKLUSIF") {
      throw new CheckoutOrderError(400, "UNLIMITED_PLAN", "Paket Eksklusif sudah memiliki kuota tamu tanpa batas.");
    }
    const units = Number(body?.addonUnits ?? 1);
    if (!Number.isInteger(units) || units < 1 || units > 20) {
      throw new CheckoutOrderError(400, "INVALID_UNITS", "Jumlah paket add-on harus 1–20.");
    }
    const guests = units * GUEST_ADDON_SIZE;
    baseOrder = {
      basePrice: units * GUEST_ADDON_PRICE,
      plan: null,
      templateId: null,
      addonUnits: units,
      invitationId: active.id,
      itemId: `ADDON_GUEST_${guests}`,
      itemName: `Tambah +${guests} Tamu (${active.title})`,
      label: `Add-on +${guests} tamu`,
      notes: `Add-on +${guests} tamu (${active.title})`,
    };
  } else {
    const target = body?.plan as PlanType;
    if (!target || !PAID_PLANS.includes(target)) {
      throw new CheckoutOrderError(400, "INVALID_PLAN", "Paket tidak valid");
    }
    if (currentPlan === target) {
      throw new CheckoutOrderError(400, "ALREADY_ACTIVE", "Paket ini sudah aktif untuk undangan ini");
    }
    const diff = getUpgradePrice(currentPlan, target);
    if (diff === null) {
      throw new CheckoutOrderError(400, "UPGRADE_NOT_ALLOWED", "Tidak dapat turun ke paket yang lebih rendah");
    }
    const planName = PLAN_LIMITS[target].name;
    baseOrder = {
      basePrice: diff,
      plan: target,
      templateId: null,
      addonUnits: 0,
      invitationId: active.id,
      itemId: target,
      itemName: currentPlan === "FREE" ? `Paket ${planName} (${active.title})` : `Upgrade ${planName} (${active.title})`,
      label: `Paket ${target}`,
      notes: currentPlan !== "FREE" ? `Upgrade ${currentPlan} → ${target} (${active.title})` : `Paket ${target} (${active.title})`,
    };
  }

  // One "Kode promo" field at checkout. An admin promo code wins; otherwise the code is tried as a
  // user's referral code (referral is not applied to Marketplace or AI credits: thin margins).
  // `promoCode` is the new field; `referralCode` is still read for older clients.
  let referralCodeUsed: string | null = null;
  let promoCodeUsed: string | null = null;
  let discountAmount = 0;
  const rawCodeProp = body?.promoCode ?? body?.referralCode;
  const explicitCode = typeof rawCodeProp === "string" ? sanitizePromoCode(rawCodeProp) : undefined;

  if (explicitCode) {
    const promoRes = await resolvePromoCode(explicitCode, { userId, kind, basePrice: baseOrder.basePrice });
    if (promoRes.found && !promoRes.valid) {
      throw new CheckoutOrderError(400, "INVALID_PROMO", promoRes.reason);
    }
    if (promoRes.found && promoRes.valid) {
      discountAmount = promoRes.discount;
      promoCodeUsed = promoRes.promo.code;
    }
  }

  if (!promoCodeUsed && kind !== "MARKETPLACE" && kind !== "AI_CREDIT" && rawCodeProp !== "") {
    // Explicit code that isn't a promo → referral; no code at all → referral cookie (if any)
    const refRes = await resolveReferralForBuyer({ buyerId: userId, rawCode: explicitCode ? sanitizeReferralCode(explicitCode) : undefined });
    if (explicitCode && !refRes.valid) {
      throw new CheckoutOrderError(400, "INVALID_PROMO", "Kode promo tidak ditemukan atau tidak berlaku.");
    }
    if (refRes.valid && refRes.code) {
      discountAmount = computeReferralDiscount(baseOrder.basePrice);
      if (discountAmount > 0) referralCodeUsed = refRes.code;
    }
  } else if (!promoCodeUsed && explicitCode) {
    throw new CheckoutOrderError(400, "INVALID_PROMO", "Kode promo tidak berlaku untuk pembelian ini.");
  }

  const finalPrice = Math.max(1000, baseOrder.basePrice - discountAmount);
  const notesWithRef = promoCodeUsed
    ? `${baseOrder.notes} · Promo ${promoCodeUsed} (-Rp${discountAmount.toLocaleString("id-ID")})`
    : referralCodeUsed
      ? `${baseOrder.notes} · Kode ${referralCodeUsed} (-Rp${discountAmount.toLocaleString("id-ID")})`
      : baseOrder.notes;

  return {
    kind,
    basePrice: baseOrder.basePrice,
    price: finalPrice,
    discountAmount,
    referralCodeUsed,
    promoCodeUsed,
    plan: baseOrder.plan,
    templateId: baseOrder.templateId,
    addonUnits: baseOrder.addonUnits,
    invitationId: baseOrder.invitationId,
    activeId: active.id,
    itemId: baseOrder.itemId,
    itemName: baseOrder.itemName,
    label: baseOrder.label,
    notes: notesWithRef,
  };
}

/**
 * Manual transfer destinations & WhatsApp admin number.
 * Reads from SystemSetting DB first, falling back to env vars:
 *   MANUAL_PAYMENT_BANKS="BCA|1234567890|Nama Pemilik;Mandiri|0987654321|Nama Pemilik"
 *   MANUAL_PAYMENT_WHATSAPP="6281234567890"
 */
export async function getManualPaymentInfo() {
  const settings = await getSystemSettings();
  const banks = settings.manualTransferEnabled ? settings.manualBanks : [];
  const qrisImage = settings.manualQrisEnabled && settings.manualQrisImage ? settings.manualQrisImage : null;
  return {
    banks,
    qrisImage,
    /** Manual payment is offered when at least one destination (bank or QRIS) is enabled */
    manualEnabled: banks.length > 0 || Boolean(qrisImage),
    whatsapp: settings.manualWhatsapp || null,
  };
}

/** Price plus a 3-digit unique code so admins can match the transfer to the order. */
export function amountWithUniqueCode(price: number) {
  return price + 100 + Math.floor(Math.random() * 900);
}

/**
 * Marks a transaction as paid and activates its plan or guest add-on for the target invitation.
 * Safe to call twice: only the first call (PENDING -> SUCCESS) activates.
 */
export async function activateTransaction(transactionId: string) {
  let activatedMeta: { userId: string; title: string; message: string; isMidtrans: boolean; amount: number; href: string } | null = null;
  let commissionMeta: { referrerId: string; amount: number; buyerLabel: string } | null = null;
  let creatorSaleMeta: { creatorId: string; templateName: string; creatorShare: number; platformFee: number } | null = null;

  const result = await prisma.$transaction(async (tx) => {
    const t = await tx.transaction.findUnique({ where: { id: transactionId } });
    if (!t) throw new Error("NOT_FOUND");
    if (t.status === "SUCCESS") return t;

    const updated = await tx.transaction.update({ where: { id: t.id }, data: { status: "SUCCESS" } });

    if (t.promoCodeUsed) {
      await tx.promoCode.updateMany({ where: { code: t.promoCodeUsed }, data: { usedCount: { increment: 1 } } });
    }

    if (t.kind === "MARKETPLACE" && t.templateId) {
      const tpl = await tx.catalogTemplate.findUnique({ where: { id: t.templateId } });
      if (!tpl) throw new Error("TEMPLATE_NOT_FOUND");

      const basePrice = tpl.price > 0 ? tpl.price : t.amount;
      const feePct = Math.min(80, Math.max(0, tpl.platformFeePct ?? 30));
      const platformFee = Math.round(basePrice * (feePct / 100));
      const creatorShare = Math.max(0, basePrice - platformFee);

      // Owner commission goes to PLATFORM_REVENUE; creator share goes to USER_EARNINGS.
      await recordPaymentRevenue(updated, tx, platformFee);

      const targetInv = t.invitationId
        ? await tx.invitation.findUnique({ where: { id: t.invitationId } })
        : await tx.invitation.findFirst({ where: { userId: t.userId }, orderBy: { createdAt: "asc" } });

      if (targetInv) {
        await tx.templatePurchase.upsert({
          where: { invitationId_templateId: { invitationId: targetInv.id, templateId: tpl.id } },
          update: {},
          create: {
            userId: t.userId,
            invitationId: targetInv.id,
            templateId: tpl.id,
            transactionId: updated.id,
            price: basePrice,
            platformFee,
            creatorShare,
          },
        });
        if (tpl.kind === "ENGINE" && tpl.theme) {
          const design = await tx.aiDesign.create({
            data: {
              userId: t.userId,
              source: "CATALOG",
              prompt: `Template Marketplace: ${tpl.name}`,
              theme: tpl.theme,
              creditsUsed: 0,
              planCreditsUsed: 0,
            },
          });
          await tx.invitation.update({
            where: { id: targetInv.id },
            data: { templateSlug: "ai-design", activeAiDesignId: design.id },
          });
        } else if (tpl.componentSlug) {
          await tx.invitation.update({
            where: { id: targetInv.id },
            data: { templateSlug: tpl.componentSlug },
          });
        }
      }

      await tx.catalogTemplate.update({ where: { id: tpl.id }, data: { usageCount: { increment: 1 } } });

      if (tpl.creatorId && creatorShare > 0) {
        await tx.ledgerEntry.createMany({
          data: [
            {
              key: `sale-share:${updated.id}`,
              account: LEDGER_ACCOUNT.earnings,
              type: "SALE_SHARE",
              source: "MARKETPLACE",
              amount: creatorShare,
              userId: tpl.creatorId,
              transactionId: updated.id,
              availableAt: new Date(Date.now() + REFERRAL_HOLD_DAYS * 86_400_000),
              note: `Penjualan template "${tpl.name}" (net ${100 - feePct}%)`,
            },
          ],
          skipDuplicates: true,
        });
        creatorSaleMeta = { creatorId: tpl.creatorId, templateName: tpl.name, creatorShare, platformFee };
      }

      activatedMeta = {
        userId: t.userId,
        title: `Template "${tpl.name}" siap dipakai!`,
        message: `Pembelian berhasil diverifikasi dan desain langsung diterapkan ke ${targetInv?.title || "undangan kamu"}.`,
        isMidtrans: t.paymentMethod === "MIDTRANS",
        amount: t.amount,
        href: "/dashboard",
      };
      return updated;
    }

    // Book the payment as platform revenue in the same database transaction (idempotent)
    await recordPaymentRevenue(updated, tx);

    // Book referral commission (idempotent) if a valid referral code was used
    if (updated.referralCodeUsed) {
      const referrer = await tx.user.findUnique({
        where: { referralCode: updated.referralCodeUsed },
        select: { id: true, email: true },
      });
      const buyer = await tx.user.findUnique({
        where: { id: updated.userId },
        select: { id: true, email: true, name: true, referredById: true },
      });
      if (referrer && buyer && referrer.id !== buyer.id && referrer.email.toLowerCase() !== buyer.email.toLowerCase()) {
        if (!buyer.referredById) {
          await tx.user.update({ where: { id: buyer.id }, data: { referredById: referrer.id } });
        }
        const commission = Math.min(Math.round(updated.amount * REFERRAL_COMMISSION_RATE), REFERRAL_MAX_COMMISSION);
        if (commission > 0) {
          const availableAt = new Date(Date.now() + REFERRAL_HOLD_DAYS * 86_400_000);
          await tx.ledgerEntry.createMany({
            data: [
              {
                key: `commission:${updated.id}`,
                account: LEDGER_ACCOUNT.earnings,
                type: "COMMISSION",
                source: updated.kind,
                amount: commission,
                userId: referrer.id,
                transactionId: updated.id,
                availableAt,
                note: `Komisi 15% · ${buyer.name || buyer.email}`,
              },
            ],
            skipDuplicates: true,
          });
          commissionMeta = {
            referrerId: referrer.id,
            amount: commission,
            buyerLabel: buyer.name || buyer.email,
          };
        }
      }
    }

    if (t.kind === "AGENCY_QUOTA" && t.addonUnits > 0) {
      const pack = getAgencyPackByQuota(t.addonUnits);
      const currentUser = await tx.user.findUnique({
        where: { id: t.userId },
        select: { agencyQuotaExpiresAt: true },
      });
      const baseExpiry =
        currentUser?.agencyQuotaExpiresAt && currentUser.agencyQuotaExpiresAt.getTime() > Date.now()
          ? currentUser.agencyQuotaExpiresAt.getTime()
          : Date.now();
      const nextExpiresAt = new Date(baseExpiry + AGENCY_QUOTA_VALID_DAYS * 86_400_000);
      const bonusAi = pack?.bonusAiCredits ?? 0;

      await tx.user.update({
        where: { id: t.userId },
        data: {
          accountType: "AGENCY",
          agencyQuota: { increment: t.addonUnits },
          agencyQuotaExpiresAt: nextExpiresAt,
          ...(bonusAi > 0 ? { aiCredits: { increment: bonusAi } } : {}),
        },
      });
      activatedMeta = {
        userId: t.userId,
        title: `${pack?.label ?? `Kuota Mitra ${t.addonUnits}`} aktif!`,
        message: `Pembayaran berhasil diverifikasi. +${t.addonUnits} kuota undangan Mitra${bonusAi > 0 ? ` dan +${bonusAi} Kredit AI` : ""} telah ditambahkan.`,
        isMidtrans: t.paymentMethod === "MIDTRANS",
        amount: t.amount,
        href: "/mitra",
      };
      return updated;
    }

    if (t.kind === "AI_CREDIT" && t.addonUnits > 0) {
      await tx.user.update({
        where: { id: t.userId },
        data: { aiCredits: { increment: t.addonUnits } },
      });
      activatedMeta = {
        userId: t.userId,
        title: `Top-up +${t.addonUnits} Kredit AI aktif!`,
        message: `Pembayaran berhasil diverifikasi. ${t.addonUnits} kredit desain AI telah ditambahkan ke akun kamu.`,
        isMidtrans: t.paymentMethod === "MIDTRANS",
        amount: t.amount,
        href: "/desain-ai",
      };
      return updated;
    }

    const targetInv = t.invitationId
      ? await tx.invitation.findUnique({ where: { id: t.invitationId } })
      : await tx.invitation.findFirst({ where: { userId: t.userId }, orderBy: { createdAt: "asc" } });

    const invTitle = targetInv?.title || "undangan kamu";

    if (t.kind === "GUEST_ADDON" && t.addonUnits > 0) {
      const inc = t.addonUnits * GUEST_ADDON_SIZE;
      if (targetInv) {
        await tx.invitation.update({ where: { id: targetInv.id }, data: { extraGuestQuota: { increment: inc } } });
      }
      await tx.user.update({ where: { id: t.userId }, data: { extraGuestQuota: { increment: inc } } });
      activatedMeta = {
        userId: t.userId,
        title: `Add-on +${inc} Tamu aktif!`,
        message: `Pembayaran berhasil diverifikasi. Kuota tamu untuk ${invTitle} sudah bertambah.`,
        isMidtrans: t.paymentMethod === "MIDTRANS",
        amount: t.amount,
        href: "/upgrade",
      };
      return updated;
    }

    const plan = t.plan as PlanType | null;
    const limits = plan && plan in PLAN_LIMITS ? PLAN_LIMITS[plan] : undefined;
    if (plan && plan !== "FREE" && limits) {
      const expiresAt = limits.activeDays ? new Date(Date.now() + limits.activeDays * 86_400_000) : null;
      if (targetInv) {
        await tx.invitation.update({
          where: { id: targetInv.id },
          data: { plan, planExpiresAt: expiresAt },
        });
      }
      await tx.user.update({
        where: { id: t.userId },
        data: { plan, planExpiresAt: expiresAt },
      });
      activatedMeta = {
        userId: t.userId,
        title: `Paket ${limits.name} aktif!`,
        message: `Pembayaran berhasil diverifikasi. ${invTitle} kini aktif dengan paket ${limits.name}.`,
        isMidtrans: t.paymentMethod === "MIDTRANS",
        amount: t.amount,
        href: "/upgrade",
      };
    }
    return updated;
  });

  if (activatedMeta) {
    const meta = activatedMeta as { userId: string; title: string; message: string; isMidtrans: boolean; amount: number; href: string };
    await createNotification({
      audience: "USER",
      userId: meta.userId,
      type: "TRANSACTION",
      title: meta.title,
      message: meta.message,
      href: meta.href,
    });
    if (meta.isMidtrans) {
      const rp = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(meta.amount);
      await createNotification({
        audience: "ADMIN",
        type: "TRANSACTION",
        title: "Pembayaran otomatis masuk",
        message: `${meta.title} (${rp}) telah dibayar melalui Midtrans.`,
        href: "/admin/transaksi",
      });
    }
  }

  if (commissionMeta) {
    const cm = commissionMeta as { referrerId: string; amount: number; buyerLabel: string };
    const rp = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(cm.amount);
    await createNotification({
      audience: "USER",
      userId: cm.referrerId,
      type: "TRANSACTION",
      title: `Komisi referral ${rp} masuk!`,
      message: `${cm.buyerLabel} menyelesaikan transaksi dengan kode referral kamu. Komisi masuk ke Dompet (masa tahan ${REFERRAL_HOLD_DAYS} hari).`,
      href: "/dompet",
    });
  }

  if (creatorSaleMeta) {
    const cs = creatorSaleMeta as { creatorId: string; templateName: string; creatorShare: number; platformFee: number };
    const rp = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(cs.creatorShare);
    await createNotification({
      audience: "USER",
      userId: cs.creatorId,
      type: "TRANSACTION",
      title: `Template terjual! +${rp}`,
      message: `Template "${cs.templateName}" dibeli user. Penghasilan bersih masuk ke Dompet (masa tahan ${REFERRAL_HOLD_DAYS} hari).`,
      href: "/dompet",
    });
  }

  return result;
}
