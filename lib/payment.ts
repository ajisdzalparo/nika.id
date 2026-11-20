import { prisma } from "@/lib/prisma";
import { GUEST_ADDON_SIZE, PLAN_LIMITS, type PlanType } from "@/lib/limits";
import { createNotification } from "@/lib/notifications";
import { getSystemSettings, type BankAccount } from "@/lib/system-settings";

export type { BankAccount };

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
  let activatedMeta: { userId: string; title: string; message: string; isMidtrans: boolean; amount: number } | null = null;

  const result = await prisma.$transaction(async (tx) => {
    const t = await tx.transaction.findUnique({ where: { id: transactionId } });
    if (!t) throw new Error("NOT_FOUND");
    if (t.status === "SUCCESS") return t;

    const updated = await tx.transaction.update({ where: { id: t.id }, data: { status: "SUCCESS" } });

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
      };
    }
    return updated;
  });

  if (activatedMeta) {
    const meta = activatedMeta as { userId: string; title: string; message: string; isMidtrans: boolean; amount: number };
    await createNotification({
      audience: "USER",
      userId: meta.userId,
      type: "TRANSACTION",
      title: meta.title,
      message: meta.message,
      href: "/upgrade",
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

  return result;
}
