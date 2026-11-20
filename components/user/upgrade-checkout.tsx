"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUpRight,
  IconBrandWhatsapp,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheckFilled,
  IconClock,
  IconCopy,
  IconCrown,
  IconHeartHandshake,
  IconLoader2,
  IconMinus,
  IconPlus,
  IconQrcode,
  IconBuildingBank,
  IconReceipt,
  IconRefresh,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { CoverThumb } from "@/components/templates/ai-design/cover-thumb";
import { SafeImg } from "@/components/common/safe-img";
import type { CatalogItem } from "@/lib/catalog-shared";
import { GUEST_ADDON_PRICE, GUEST_ADDON_SIZE, PAID_PLANS, PLAN_LIMITS, getMaxGuests, getUpgradePrice, type PlanType } from "@/lib/limits";

declare global {
  interface Window {
    snap?: {
      pay: (
        snapToken: string,
        options?: {
          onSuccess?: () => void;
          onPending?: () => void;
          onError?: () => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

function loadSnapScript(clientKey: string, isProduction: boolean): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("NO_WINDOW"));
  const expectedSrc = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  const existing = document.querySelector<HTMLScriptElement>("script[data-midtrans-snap='true']");
  if (existing && existing.src === expectedSrc && existing.dataset.clientKey === clientKey && window.snap) {
    return Promise.resolve();
  }
  if (existing) {
    existing.remove();
    delete window.snap;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = expectedSrc;
    script.dataset.midtransSnap = "true";
    script.dataset.clientKey = clientKey;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat Midtrans Snap"));
    document.body.appendChild(script);
  });
}

export interface CheckoutOrder {
  id: string;
  kind?: string;
  addonUnits?: number;
  plan: PlanType | null;
  amount: number;
  paymentProof: string | null;
  createdAt: string;
}

export interface MidtransSnapOrder {
  id: string;
  token: string;
  kind: string;
  addonUnits: number;
  plan: PlanType | null;
  amount: number;
  createdAt: string;
}

export interface TransactionHistoryItem {
  id: string;
  kind: string;
  addonUnits: number;
  plan: PlanType | null;
  amount: number;
  status: string;
  paymentMethod: string;
  paymentProof: string | null;
  notes: string | null;
  invitationTitle: string;
  createdAt: string;
}

export interface BankAccount {
  bank: string;
  number: string;
  holder: string;
}

interface UpgradeCheckoutProps {
  invitationId: string;
  invitationTitle: string;
  currentPlan: PlanType;
  extraGuestQuota: number;
  initialOrder: CheckoutOrder | null;
  initialSnapOrder: MidtransSnapOrder | null;
  initialTransactions: TransactionHistoryItem[];
  initialBanks: BankAccount[];
  initialWhatsapp: string | null;
  /** Static QRIS image for manual payment (null when disabled by admin) */
  initialQris: string | null;
  /** False when the admin turned off both manual transfer and manual QRIS */
  manualEnabled: boolean;
  catalogItems: CatalogItem[];
  midtrans: {
    enabled: boolean;
    clientKey: string;
    isProduction: boolean;
  };
}

type PaymentMethod = "MIDTRANS" | "MANUAL_TRANSFER";
type CheckoutKind = "PLAN" | "ADDON";

const PLAN_TAGLINES: Record<PlanType, string> = {
  FREE: "Mode pratinjau sebelum aktivasi",
  HEMAT: "Intim, simpel & desain esensial",
  PREMIUM: "Paling pas untuk acara lengkap",
  EKSKLUSIF: "Paling lengkap, tanpa watermark & video",
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const countLabel = (n: number) => (n === Infinity ? "Tanpa batas" : String(n));

function getPlanBenefits(k: PlanType) {
  const p = PLAN_LIMITS[k];
  return [
    `Link undangan bernama hingga ${countLabel(p.maxGuests).toLowerCase()} tamu`,
    `${p.aiDesignQuota}× generasi desain AI kustom`,
    `Galeri hingga ${countLabel(p.maxGalleryPhotos).toLowerCase()} foto`,
    p.canUseMusic ? "Musik latar dari daftar, upload MP3, atau link YouTube" : "",
    p.canUseRSVP ? "Tamu bisa kirim RSVP, ucapan & doa" : "",
    p.canUseLoveStory ? "Cerita perjalanan cinta kalian" : "",
    p.canUseDigitalGift ? "Amplop digital: transfer rekening & e-wallet" : "",
    p.canUseVideo ? "Embed video momen spesial" : "",
    p.canRemoveWatermark ? "Tanpa watermark UNDANGIN YUK" : "",
    p.activeDays === null ? "Masa aktif undangan selamanya" : `Masa aktif ${p.activeDays} hari sejak aktivasi`,
    `Akses template ${p.allowedTemplateTypes.join(" & ")}`,
  ].filter(Boolean);
}

function getDefaultSelectedPlan(current: PlanType): PlanType {
  if (current === "FREE") return "PREMIUM";
  if (current === "HEMAT") return "PREMIUM";
  return "EKSKLUSIF";
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#DDD5C7] bg-[#FAF8F4] px-3 text-xs font-medium text-[#15130F] transition hover:bg-[#EFEAE0]"
      aria-label={label}
    >
      {done ? <IconCheck size={14} className="text-[#8A6A2F]" /> : <IconCopy size={14} />}
      {done ? "Tersalin" : "Salin"}
    </button>
  );
}

export function UpgradeCheckout({
  invitationId,
  invitationTitle,
  currentPlan,
  extraGuestQuota,
  initialOrder,
  initialSnapOrder,
  initialTransactions,
  initialBanks,
  initialWhatsapp,
  initialQris,
  manualEnabled,
  catalogItems,
  midtrans,
}: UpgradeCheckoutProps) {
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement>(null);

  const [order, setOrder] = useState<CheckoutOrder | null>(initialOrder);
  const [snapOrder, setSnapOrder] = useState<MidtransSnapOrder | null>(initialSnapOrder);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>(initialTransactions);
  const [draftProof, setDraftProof] = useState<string>(initialOrder?.paymentProof ?? "");
  const [senderName, setSenderName] = useState<string>("");
  const [submittingProof, setSubmittingProof] = useState(false);
  const [banks, setBanks] = useState<BankAccount[]>(initialBanks);
  const [whatsapp, setWhatsapp] = useState<string | null>(initialWhatsapp);
  const [qris, setQris] = useState<string | null>(initialQris);

  const [checkoutKind, setCheckoutKind] = useState<CheckoutKind>("PLAN");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(() => getDefaultSelectedPlan(currentPlan));
  const [addonUnits, setAddonUnits] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => (midtrans.enabled ? "MIDTRANS" : "MANUAL_TRANSFER"));
  const [busy, setBusy] = useState(false);

  const totalGuestsAllowed = getMaxGuests(currentPlan, extraGuestQuota);
  const selectedPlanSpec = PLAN_LIMITS[selectedPlan];
  const planBenefits = useMemo(() => getPlanBenefits(selectedPlan), [selectedPlan]);

  // Catalog designs included in the currently inspected plan
  const includedTemplates = useMemo(() => {
    const allowed = selectedPlanSpec.allowedTemplateTypes as readonly string[];
    const matching = catalogItems.filter((item) => allowed.includes(item.tier));
    return {
      total: matching.length,
      preview: matching.slice(0, 6),
    };
  }, [catalogItems, selectedPlanSpec]);

  // Checkout pricing math
  const planDiff = getUpgradePrice(currentPlan, selectedPlan);
  const canPaySelectedPlan = planDiff !== null && currentPlan !== selectedPlan;
  const planPayAmount = planDiff ?? selectedPlanSpec.price;
  const isUpgradeDiscount = currentPlan !== "FREE" && planDiff !== null && planDiff < selectedPlanSpec.price;

  const addonPayAmount = addonUnits * GUEST_ADDON_PRICE;
  const summaryAmount = checkoutKind === "ADDON" ? addonPayAmount : planPayAmount;
  const canCheckout =
    checkoutKind === "ADDON" ? currentPlan !== "FREE" && currentPlan !== "EKSKLUSIF" : canPaySelectedPlan;

  const scrollPlans = (dir: -1 | 1) => {
    sliderRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  };

  const checkSnapStatus = useCallback(
    async (orderId: string, silent = false) => {
      if (!silent) setCheckingStatus(true);
      try {
        const res = await fetch(`/api/payment/status?orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) return;
        if (d.status === "SUCCESS") {
          toast.success("Pembayaran berhasil diterima! Paket undangan langsung aktif.");
          setTransactions((prev) => prev.map((t) => (t.id === orderId ? { ...t, status: "SUCCESS" } : t)));
          setSnapOrder(null);
          router.refresh();
        } else if (d.status === "FAILED") {
          toast.error("Tagihan dibatalkan atau kedaluwarsa.");
          setTransactions((prev) => prev.map((t) => (t.id === orderId ? { ...t, status: "FAILED" } : t)));
          setSnapOrder(null);
          router.refresh();
        } else if (!silent) {
          toast("Pembayaran belum terdeteksi. Selesaikan pembayaran lalu cek kembali.");
        }
      } finally {
        if (!silent) setCheckingStatus(false);
      }
    },
    [router],
  );

  const openSnapPopup = useCallback(
    (target: MidtransSnapOrder) => {
      if (!window.snap) {
        toast.error("Popup Midtrans belum siap. Silakan coba klik ulang.");
        return;
      }
      window.snap.pay(target.token, {
        onSuccess: () => {
          void checkSnapStatus(target.id, false);
        },
        onPending: () => {
          toast("Tagihan dibuat. Selesaikan pembayaran pada metode yang Anda pilih.");
          void checkSnapStatus(target.id, true);
        },
        onError: () => {
          toast.error("Pembayaran gagal diproses oleh Midtrans.");
        },
        onClose: () => {
          void checkSnapStatus(target.id, true);
        },
      });
    },
    [checkSnapStatus],
  );

  const handleCreatePayment = async () => {
    if (!canCheckout || busy) return;
    setBusy(true);

    try {
      if (paymentMethod === "MIDTRANS") {
        if (!midtrans.enabled) {
          toast.error("Pembayaran otomatis belum aktif. Silakan pilih Transfer manual.");
          setPaymentMethod("MANUAL_TRANSFER");
          return;
        }
        const payload =
          checkoutKind === "ADDON"
            ? { kind: "GUEST_ADDON", addonUnits, invitationId }
            : { kind: "PLAN", plan: selectedPlan, invitationId };

        await loadSnapScript(midtrans.clientKey, midtrans.isProduction);
        const res = await fetch("/api/payment/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.order || !data.token) {
          toast.error(data.message || data.details || data.error || "Gagal membuat pembayaran Midtrans");
          return;
        }
        const createdSnap: MidtransSnapOrder = data.order;
        setSnapOrder(createdSnap);
        setTransactions((prev) => [
          {
            id: createdSnap.id,
            kind: createdSnap.kind,
            addonUnits: createdSnap.addonUnits,
            plan: createdSnap.plan,
            amount: createdSnap.amount,
            status: "PENDING",
            paymentMethod: "MIDTRANS",
            paymentProof: null,
            notes: "Midtrans Snap",
            invitationTitle,
            createdAt: createdSnap.createdAt,
          },
          ...prev.map((t) =>
            t.paymentMethod === "MIDTRANS" && t.status === "PENDING" ? { ...t, status: "FAILED" } : t,
          ),
        ]);
        openSnapPopup(createdSnap);
        return;
      }

      // MANUAL_TRANSFER
      const payload =
        checkoutKind === "ADDON"
          ? { kind: "GUEST_ADDON", addonUnits, invitationId }
          : { kind: "PLAN", plan: selectedPlan, invitationId };

      const res = await fetch("/api/payment/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Gagal membuat pesanan pembayaran");
        return;
      }
      setOrder(data.order);
      setDraftProof(data.order?.paymentProof ?? "");
      setSenderName("");
      setBanks(data.banks ?? []);
      setWhatsapp(data.whatsapp ?? null);
      setQris(data.qrisImage ?? null);
      if (data.order) {
        const newItem: TransactionHistoryItem = {
          id: data.order.id,
          kind: data.order.kind ?? checkoutKind,
          addonUnits: data.order.addonUnits ?? 0,
          plan: data.order.plan ?? null,
          amount: data.order.amount,
          status: "PENDING",
          paymentMethod: "MANUAL_TRANSFER",
          paymentProof: data.order.paymentProof ?? null,
          notes: data.order.notes ?? null,
          invitationTitle,
          createdAt: data.order.createdAt ?? new Date().toISOString(),
        };
        setTransactions((prev) => [
          newItem,
          ...prev.map((t) =>
            t.paymentMethod === "MANUAL_TRANSFER" && t.status === "PENDING" ? { ...t, status: "FAILED" } : t,
          ),
        ]);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Terjadi kendala koneksi. Coba lagi beberapa saat.");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !draftProof) {
      toast.error("Unggah foto atau screenshot bukti transfer terlebih dahulu.");
      return;
    }
    setSubmittingProof(true);
    try {
      const res = await fetch("/api/payment/manual", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, proofUrl: draftProof, senderName }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Gagal mengirim pengajuan pembayaran");
        return;
      }
      setOrder(data.order);
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === data.order.id
            ? { ...t, paymentProof: data.order.paymentProof, notes: data.order.notes ?? t.notes }
            : t,
        ),
      );
      toast.success("Pengajuan pembayaran terkirim! Admin akan segera memverifikasi.");
      router.refresh();
    } catch {
      toast.error("Gagal mengirim pengajuan pembayaran.");
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Batalkan pengajuan ini dan pilih ulang paket?")) return;
    setBusy(true);
    try {
      await fetch("/api/payment/manual", { method: "DELETE" });
      if (order) {
        setTransactions((prev) => prev.map((t) => (t.id === order.id ? { ...t, status: "FAILED", notes: "Dibatalkan oleh user" } : t)));
      }
      setOrder(null);
      setDraftProof("");
      setSenderName("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!snapOrder) return;
    const timer = setInterval(() => {
      void checkSnapStatus(snapOrder.id, true);
    }, 5000);
    return () => clearInterval(timer);
  }, [snapOrder, checkSnapStatus]);

  const handleReopenSnap = async () => {
    if (!snapOrder || busy) return;
    setBusy(true);
    try {
      await loadSnapScript(midtrans.clientKey, midtrans.isProduction);
      openSnapPopup(snapOrder);
    } catch {
      toast.error("Gagal membuka popup Midtrans Snap.");
    } finally {
      setBusy(false);
    }
  };

  const handleCancelSnapOrder = async () => {
    if (!snapOrder) return;
    if (!confirm("Batalkan tagihan ini dan pilih metode pembayaran lain?")) return;
    setBusy(true);
    try {
      await fetch(`/api/payment/token?orderId=${encodeURIComponent(snapOrder.id)}`, { method: "DELETE" });
      setTransactions((prev) => prev.map((t) => (t.id === snapOrder.id ? { ...t, status: "FAILED", notes: "Dibatalkan oleh user" } : t)));
      setSnapOrder(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const orderTitle = order
    ? order.kind === "GUEST_ADDON"
      ? `Add-on +${(order.addonUnits ?? 1) * GUEST_ADDON_SIZE} Tamu`
      : order.plan && PLAN_LIMITS[order.plan]
        ? `Paket ${PLAN_LIMITS[order.plan].name}`
        : "Pesanan"
    : snapOrder
      ? snapOrder.kind === "GUEST_ADDON"
        ? `Add-on +${(snapOrder.addonUnits || 1) * GUEST_ADDON_SIZE} Tamu`
        : snapOrder.plan && PLAN_LIMITS[snapOrder.plan]
          ? `Paket ${PLAN_LIMITS[snapOrder.plan].name}`
          : "Pesanan"
      : "";

  return (
    <div className="flex-1 bg-[#FAF8F4] px-4 pb-20 pt-8 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header section matching reference layout */}
        <header className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A6A2F]">
            Aktivasi Undangan{invitationTitle ? ` · ${invitationTitle}` : ""}
          </p>
          <h1 className="font-serif text-4xl font-medium leading-tight tracking-tight text-[#15130F] sm:text-5xl">
            {order || snapOrder ? "Selesaikan pembayaran kamu" : "Aktifkan undangan kamu"}
          </h1>
          <p className="max-w-2xl text-sm text-[#5E574D] sm:text-base">
            Sekali bayar per undangan. Setelah aktif kamu tetap bisa mengedit data, foto, maupun desain tanpa batas.
          </p>

          {/* Status info pill */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            {currentPlan === "FREE" ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E7D4A6] bg-[#FBF5E6] px-4 py-1.5 text-xs font-medium text-[#6D5221]">
                <IconClock size={14} className="shrink-0" />
                Mode Pratinjau · Aktifkan paket agar undangan siap dibagikan ke tamu.
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#DFD7C8] bg-white px-4 py-1.5 text-xs font-medium text-[#3F3A33]">
                <IconCheck size={14} className="shrink-0 text-[#8A6A2F]" />
                Paket aktif: <strong className="text-[#15130F]">{PLAN_LIMITS[currentPlan].name}</strong> · Kuota tamu:{" "}
                <strong className="text-[#15130F]">{countLabel(totalGuestsAllowed)}</strong> · Upgrade cukup bayar selisih.
              </div>
            )}
          </div>
        </header>

        {/* Active Automatic Midtrans Snap Payment View */}
        {snapOrder ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="space-y-6 rounded-2xl border border-[#E6DFD3] bg-white p-6 shadow-xs sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFEAE0] pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DFD2BC] bg-[#F5EFE3] px-3 py-1 text-[11px] font-semibold text-[#5C4620]">
                    <IconClock size={13} className="text-[#8A6A2F]" /> Menunggu Pembayaran · Midtrans Snap
                  </span>
                  <p className="mt-2 text-sm text-[#5E574D]">
                    {orderTitle} · {invitationTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-[#8C8272]">Order ID: {snapOrder.id}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelSnapOrder}
                  disabled={busy}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E1D8C9] px-3.5 text-xs font-medium text-[#5E574D] transition hover:bg-[#FAF8F4] hover:text-[#15130F]"
                >
                  <IconArrowLeft size={14} /> Ganti metode
                </button>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[#8A6A2F]">Total Pembayaran</p>
                <p className="mt-1 font-serif text-4xl font-medium lining-nums text-[#15130F] sm:text-5xl">
                  {rupiah(snapOrder.amount)}
                </p>
              </div>

              <div className="rounded-2xl border border-[#E6DFD3] bg-[#FAF8F4] p-5 text-sm leading-relaxed text-[#5E574D]">
                Popup pembayaran resmi Midtrans Snap menyediakan semua metode yang aktif pada akun merchant (Virtual Account, QRIS, e-wallet, atau kartu). Klik tombol di bawah jika popup belum terbuka atau tertutup.
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EFEAE0] pt-4">
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleReopenSnap}
                    disabled={busy}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[#15130F] px-5 text-sm font-semibold text-[#FAF8F4] transition hover:bg-[#2A261F] disabled:opacity-50"
                  >
                    {busy ? <IconLoader2 size={16} className="animate-spin" /> : <IconQrcode size={16} />}
                    Buka Pembayaran Midtrans
                  </button>
                  <button
                    type="button"
                    onClick={() => void checkSnapStatus(snapOrder.id, false)}
                    disabled={checkingStatus}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-[#DFD7C8] bg-white px-5 text-sm font-medium text-[#15130F] transition hover:bg-[#FAF8F4] disabled:opacity-50"
                  >
                    <IconRefresh size={16} className={checkingStatus ? "animate-spin" : ""} />
                    {checkingStatus ? "Mengecek..." : "Cek Status"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCancelSnapOrder}
                  disabled={busy}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm text-[#6E675C] hover:bg-[#FAF8F4] hover:text-[#15130F]"
                >
                  <IconX size={16} /> Batalkan tagihan
                </button>
              </div>
            </div>

            <aside className="space-y-4 rounded-2xl border border-[#E6DFD3] bg-white p-6 shadow-xs lg:sticky lg:top-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6A2F]">Status Otomatis</p>
                <h2 className="mt-1 font-serif text-2xl font-medium text-[#15130F]">Aktivasi Seketika</h2>
              </div>
              <p className="text-xs leading-relaxed text-[#5E574D]">
                Halaman ini memantau status transaksi Midtrans secara otomatis setiap beberapa detik. Setelah pembayaran selesai, paket undangan langsung aktif tanpa perlu unggah bukti.
              </p>
            </aside>
          </section>
        ) : order ? (
          <section className="space-y-6">
            {/* Progress Stepper */}
            <div className="rounded-2xl border border-[#E6DFD3] bg-white p-5 shadow-xs sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">Progress Pengajuan Pembayaran</p>
                  <p className="mt-0.5 text-sm font-medium text-[#15130F]">
                    {order.paymentProof
                      ? "Tahap 3 dari 4 · Bukti diterima, sedang menunggu verifikasi admin"
                      : "Tahap 2 dari 4 · Silakan transfer sesuai nominal lalu kirim form pengajuan"}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    order.paymentProof
                      ? "border border-[#D9C79E] bg-[#FBF3E0] text-[#78571E]"
                      : "border border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  <IconClock size={13} />
                  {order.paymentProof ? "Menunggu verifikasi admin" : "Menunggu transfer & pengajuan"}
                </span>
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-4">
                {[
                  { step: 1, label: "Pesanan dibuat", sub: "Nominal & kode unik siap", done: true, active: false },
                  {
                    step: 2,
                    label: "Transfer & unggah bukti",
                    sub: order.paymentProof ? "Bukti sudah diunggah" : "Kirim form konfirmasi",
                    done: Boolean(order.paymentProof),
                    active: !order.paymentProof,
                  },
                  {
                    step: 3,
                    label: "Verifikasi admin",
                    sub: order.paymentProof ? "Sedang dicek admin" : "Menunggu pengajuan",
                    done: false,
                    active: Boolean(order.paymentProof),
                  },
                  { step: 4, label: "Paket aktif", sub: "Undangan siap dibagikan", done: false, active: false },
                ].map((s) => (
                  <div
                    key={s.step}
                    className={`flex items-start gap-3 rounded-xl border p-3 ${
                      s.active
                        ? "border-[#8A6A2F] bg-[#FBF7EE]"
                        : s.done
                          ? "border-[#DFD2BC] bg-[#F5EFE3]"
                          : "border-[#EFEAE0] bg-[#FAF8F4]/60 opacity-70"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        s.done
                          ? "bg-[#8A6A2F] text-white"
                          : s.active
                            ? "bg-[#15130F] text-[#FAF8F4]"
                            : "bg-[#E6DFD3] text-[#5E574D]"
                      }`}
                    >
                      {s.done ? <IconCheck size={13} /> : s.step}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#15130F]">{s.label}</p>
                      <p className="text-[11px] text-[#6B6358]">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
              <div className="space-y-6 rounded-2xl border border-[#E6DFD3] bg-white p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFEAE0] pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8A6A2F]">Rincian Pengajuan</p>
                    <p className="mt-1 text-sm font-medium text-[#15130F]">
                      {orderTitle} · {invitationTitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={busy}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E1D8C9] px-3.5 text-xs font-medium text-[#5E574D] transition hover:bg-[#FAF8F4] hover:text-[#15130F]"
                  >
                    <IconArrowLeft size={14} /> Ganti paket / batalkan
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[#8A6A2F]">Total Transfer</p>
                    <p className="mt-1 font-serif text-4xl font-medium lining-nums text-[#15130F] sm:text-5xl">{rupiah(order.amount)}</p>
                    <p className="mt-2 text-sm text-[#5E574D]">
                      Transfer <strong className="font-semibold text-[#15130F]">tepat sampai 3 digit terakhir</strong> ({String(order.amount).slice(-3)}) agar pengajuan cepat dicocokkan.
                    </p>
                  </div>
                  <CopyButton text={String(order.amount)} label="Salin nominal transfer" />
                </div>

                <div className="space-y-3 border-t border-[#EFEAE0] pt-5">
                  {qris && (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-[#E6DFD3] bg-white p-5 text-center sm:flex-row sm:text-left">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qris} alt="Kode QRIS pembayaran" className="h-48 w-48 shrink-0 rounded-lg object-contain" />
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-[#15130F]">Scan QRIS</p>
                        <p className="text-sm text-[#5E574D]">Buka e-wallet atau m-banking, pindai kode ini, lalu bayar <strong className="font-semibold text-[#15130F]">{rupiah(order.amount)}</strong> tepat sampai 3 digit terakhir.</p>
                      </div>
                    </div>
                  )}
                  {(banks.length > 0 || !qris) && <p className="text-sm font-semibold text-[#15130F]">{qris ? "Atau transfer ke rekening" : "Rekening Tujuan Transfer"}</p>}
                  {banks.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {banks.map((b) => (
                        <div key={b.number} className="flex items-center justify-between gap-3 rounded-xl border border-[#E6DFD3] bg-[#FAF8F4]/70 p-4">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A6A2F]">{b.bank}</p>
                            <p className="mt-1 font-serif text-xl font-medium tabular-nums lining-nums text-[#15130F]">{b.number}</p>
                            <p className="truncate text-xs text-[#5E574D]">a.n. {b.holder}</p>
                          </div>
                          <CopyButton text={b.number} label={`Salin nomor rekening ${b.bank}`} />
                        </div>
                      ))}
                    </div>
                  ) : !qris ? (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      Rekening tujuan belum diatur oleh admin. Silakan hubungi admin untuk informasi transfer.
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3 border-t border-[#EFEAE0] pt-5">
                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Halo, saya sudah mengajukan konfirmasi transfer ${rupiah(order.amount)} untuk ${orderTitle} (pesanan ${order.id.slice(-6)}).`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-[#D8CFC0] bg-white px-4 text-sm font-medium text-[#15130F] transition hover:bg-[#FAF8F4]"
                    >
                      <IconBrandWhatsapp size={17} className="text-emerald-600" /> Konfirmasi via WhatsApp
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={busy}
                    className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm text-[#6E675C] transition hover:bg-[#FAF8F4] hover:text-[#15130F]"
                  >
                    <IconX size={16} /> Batalkan pengajuan
                  </button>
                </div>
              </div>

              <aside className="rounded-2xl border border-[#E6DFD3] bg-white p-6 shadow-xs lg:sticky lg:top-6">
                <form onSubmit={handleSubmitProof} className="space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6A2F]">Form Pengajuan</p>
                    <h2 className="mt-1 font-serif text-2xl font-medium text-[#15130F]">Konfirmasi Transfer</h2>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="sender-name" className="block text-xs font-medium text-[#3F3A33]">
                      Nama Pengirim / Bank Asal (opsional)
                    </label>
                    <input
                      id="sender-name"
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Contoh: Budi Santoso - BCA"
                      className="h-10 w-full rounded-xl border border-[#DDD5C7] bg-[#FAF8F4] px-3 text-sm text-[#15130F] placeholder:text-[#9A9183] focus:border-[#8A6A2F] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-[#3F3A33]">Bukti Transfer / Screenshot</p>
                    <ImageUploadField
                      value={draftProof}
                      onChange={(url) => setDraftProof(url)}
                      aspect="aspect-[4/3]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingProof || !draftProof}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#15130F] px-4 text-sm font-semibold text-[#FAF8F4] transition hover:bg-[#2A261F] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {submittingProof && <IconLoader2 size={16} className="animate-spin" />}
                    {order.paymentProof ? "Perbarui Pengajuan Pembayaran" : "Kirim Pengajuan Pembayaran"}
                  </button>

                  {order.paymentProof ? (
                    <p className="flex gap-2 rounded-xl bg-[#F4EAD6] p-3 text-xs leading-relaxed text-[#6E5426]">
                      <IconClock size={16} className="mt-0.5 shrink-0" />
                      Pengajuan sudah masuk. Paket aktif otomatis setelah diverifikasi admin, atau kamu bisa perbarui bukti bila salah unggah.
                    </p>
                  ) : (
                    <p className="text-xs leading-relaxed text-[#5E574D]">
                      Unggah foto/screenshot bukti transfer lalu klik <strong>Kirim Pengajuan Pembayaran</strong> agar masuk antrean verifikasi admin.
                    </p>
                  )}
                </form>
              </aside>
            </div>
          </section>
        ) : (
          /* Two-column checkout UI matching reference screenshot */
          <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start">
            {/* LEFT COLUMN: Package selector + Included benefits & design preview + Add-on */}
            <div className="min-w-0 space-y-6">
              {/* 1. Pilih paket */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[#15130F]">Pilih paket</h2>
                  <div className="flex items-center gap-1.5 sm:hidden">
                    <button
                      type="button"
                      onClick={() => scrollPlans(-1)}
                      aria-label="Geser paket ke kiri"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DFD7C8] bg-white text-[#15130F]"
                    >
                      <IconChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollPlans(1)}
                      aria-label="Geser paket ke kanan"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DFD7C8] bg-white text-[#15130F]"
                    >
                      <IconChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div
                  ref={sliderRef}
                  className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-2 [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0"
                >
                  {PAID_PLANS.map((k) => {
                    const spec = PLAN_LIMITS[k];
                    const diff = getUpgradePrice(currentPlan, k);
                    const isCurrent = k === currentPlan;
                    const isDowngrade = !isCurrent && diff === null;
                    const isDark = k === "EKSKLUSIF";
                    const isPopular = k === "PREMIUM";
                    const isSelected = checkoutKind === "PLAN" && selectedPlan === k;
                    const displayPrice = diff ?? spec.price;
                    const showStrikethrough = currentPlan !== "FREE" && diff !== null && diff < spec.price;

                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setSelectedPlan(k);
                          setCheckoutKind("PLAN");
                        }}
                        className={`group relative flex min-w-[235px] snap-start flex-col justify-between rounded-2xl border p-4 text-left transition-all sm:min-w-0 ${
                          isDark
                            ? isSelected
                              ? "border-[#C9A45C] bg-[#15130F] text-[#FAF8F4] ring-2 ring-[#C9A45C]/40 shadow-md"
                              : "border-[#2D2820] bg-[#1D1A15] text-[#FAF8F4] hover:border-[#8A6A2F]"
                            : isSelected
                              ? isPopular
                                ? "border-[#8A6A2F] bg-gradient-to-b from-[#FBF4E4] to-white text-[#15130F] ring-2 ring-[#C9A45C]/35 shadow-sm"
                                : "border-[#15130F] bg-white text-[#15130F] ring-2 ring-[#15130F]/15 shadow-sm"
                              : isPopular
                                ? "border-[#E6D5B2] bg-[#FDF9F0] text-[#15130F] hover:border-[#C9A45C]"
                                : "border-[#E6DFD3] bg-white text-[#15130F] hover:border-[#C5BBA8]"
                        } ${isDowngrade ? "opacity-65" : ""}`}
                      >
                        {/* Top badge (PALING LARIS on Premium, or icon on Dark/Eksklusif) */}
                        {isPopular && (
                          <span className="absolute -top-2.5 left-4 rounded-full bg-[#8A6A2F] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                            Paling Laris
                          </span>
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            {isDark && (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[#C9A45C]">
                                <IconCrown size={13} />
                              </span>
                            )}
                            <p className="font-serif text-xl font-medium leading-tight">{spec.name}</p>
                            <p className={`text-xs leading-snug ${isDark ? "text-zinc-400" : "text-[#6B6358]"}`}>
                              {PLAN_TAGLINES[k]}
                            </p>
                          </div>

                          <span className="mt-0.5 shrink-0">
                            {isSelected ? (
                              <IconCircleCheckFilled size={20} className={isDark ? "text-[#C9A45C]" : "text-[#15130F]"} />
                            ) : (
                              <span
                                className={`block h-4.5 w-4.5 rounded-full border ${
                                  isDark ? "border-white/30" : "border-[#CFC6B8]"
                                }`}
                              />
                            )}
                          </span>
                        </div>

                        <div className="mt-5 pt-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className={`text-xs ${isDark ? "text-zinc-400" : "text-[#6B6358]"}`}>Rp</span>
                            <span className="font-serif text-2xl font-semibold tracking-tight lining-nums">
                              {displayPrice.toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {showStrikethrough && (
                              <span className={`text-[11px] line-through ${isDark ? "text-zinc-500" : "text-[#9A9183]"}`}>
                                {rupiah(spec.price)}
                              </span>
                            )}
                            {isCurrent ? (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDark ? "bg-[#C9A45C]/25 text-[#F4EAD6]" : "border border-[#DFD2BC] bg-[#F5EFE3] text-[#5C4620]"}`}>
                                Paket aktif
                              </span>
                            ) : isDowngrade ? (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isDark ? "bg-white/10 text-zinc-300" : "bg-[#F1ECE2] text-[#6B6358]"}`}>
                                Sudah tercakup
                              </span>
                            ) : showStrikethrough ? (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDark ? "bg-[#C9A45C]/20 text-[#E6CB8A]" : "bg-[#F4EAD6] text-[#6E5426]"}`}>
                                Bayar selisih
                              </span>
                            ) : (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isDark ? "bg-[#C9A45C]/20 text-[#E6CB8A]" : "bg-[#F4EFE5] text-[#6E5426]"}`}>
                                {spec.activeDays ? `Aktif ${spec.activeDays} hari` : "Aktif selamanya"}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Yang kamu dapat di paket [Selected] + Pilihan desain */}
              <div className="rounded-2xl border border-[#E6DFD3] bg-white p-5 shadow-xs sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4EAD6] text-[#8A6A2F]">
                      <IconHeartHandshake size={18} />
                    </span>
                    <div>
                      <p className="text-xs text-[#6B6358]">Yang kamu dapat di paket</p>
                      <h3 className="font-serif text-xl font-medium leading-tight text-[#15130F]">
                        {selectedPlanSpec.name}
                      </h3>
                    </div>
                  </div>
                  <span className="rounded-full border border-[#E6DFD3] bg-[#FAF8F4] px-3 py-1 text-xs font-medium text-[#5E574D]">
                    {planBenefits.length} fitur
                  </span>
                </div>

                {/* 2-column checklist */}
                <ul className="mt-5 grid gap-x-6 gap-y-2.5 text-sm text-[#3F3A33] sm:grid-cols-2">
                  {planBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5">
                      <IconCheck size={16} className="mt-0.5 shrink-0 text-[#8A6A2F]" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* Template showcase inside selected tier */}
                {includedTemplates.preview.length > 0 && (
                  <div className="mt-6 border-t border-[#EFEAE0] pt-5">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-[#15130F]">
                          Pilihan desain di paket {selectedPlanSpec.name}
                        </h4>
                        <p className="mt-0.5 text-xs text-[#6B6358]">
                          {includedTemplates.total} desain siap pakai bisa kamu gunakan di paket ini
                        </p>
                      </div>
                      <Link
                        href="/pilih-template"
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#E1D8C9] bg-[#FAF8F4] px-3 py-1.5 text-xs font-medium text-[#15130F] transition hover:bg-[#EFEAE0]"
                      >
                        Lihat semua <IconArrowUpRight size={14} />
                      </Link>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
                      {includedTemplates.preview.map((item) => (
                        <Link
                          key={item.id}
                          href={`/preview/t/${item.slug}`}
                          target="_blank"
                          className="group space-y-2"
                        >
                          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-[#ECE6DA] bg-[#EFECE5] p-2.5 transition group-hover:border-[#C9A45C]">
                            {/* Mini badge */}
                            {(item.isNew || item.usageCount > 0 || item.tier === "Premium") && (
                              <span className="absolute left-2 top-2 z-10 inline-flex items-center rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-[#15130F] shadow-xs">
                                {item.isNew ? "Terbaru" : item.usageCount > 0 ? "Banyak dipakai" : item.tier}
                              </span>
                            )}
                            <div className="relative aspect-[9/16] h-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-transform duration-300 group-hover:scale-[1.03]">
                              {item.kind === "ENGINE" && item.theme ? (
                                <CoverThumb theme={item.theme} zoom={0.28} className="h-full w-full" />
                              ) : (
                                <SafeImg src={item.thumbnail} alt={item.name} className="h-full w-full object-cover" />
                              )}
                            </div>
                          </div>
                          <div className="px-0.5">
                            <p className="truncate text-xs font-semibold text-[#15130F]">{item.name}</p>
                            <p className="truncate text-[11px] text-[#6B6358]">
                              {item.usageCount > 0 ? `Dipakai ${item.usageCount} undangan` : `${item.category} · ${item.tier}`}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Add-on Kuota Tamu (+100 Tamu) */}
              {currentPlan !== "EKSKLUSIF" && (
                <div
                  className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 transition sm:flex-row sm:items-center ${
                    checkoutKind === "ADDON"
                      ? "border-[#15130F] bg-white ring-2 ring-[#15130F]/10"
                      : "border-[#E6DFD3] bg-[#FFFDF9]"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFE8DC] text-[#8A6A2F]">
                      <IconUsers size={19} />
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">
                        Add-on Kuota Tamu
                      </p>
                      <h3 className="font-serif text-xl font-medium text-[#15130F]">
                        Tambah +{GUEST_ADDON_SIZE} Tamu Bernama
                      </h3>
                      <p className="text-xs text-[#6B6358]">
                        {rupiah(GUEST_ADDON_PRICE)} per +{GUEST_ADDON_SIZE} tamu.{" "}
                        {currentPlan === "FREE"
                          ? "Aktifkan paket Hemat atau Premium terlebih dahulu untuk membeli add-on."
                          : `Kuota saat ini: ${countLabel(totalGuestsAllowed)} tamu.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <div className="flex h-10 items-center rounded-full border border-[#DFD7C8] bg-[#FAF8F4] px-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAddonUnits((u) => Math.max(1, u - 1));
                          if (currentPlan !== "FREE") setCheckoutKind("ADDON");
                        }}
                        disabled={addonUnits <= 1 || currentPlan === "FREE"}
                        aria-label="Kurangi unit add-on"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#15130F] hover:bg-white disabled:opacity-40"
                      >
                        <IconMinus size={14} />
                      </button>
                      <span className="min-w-14 text-center text-xs font-semibold tabular-nums">
                        +{addonUnits * GUEST_ADDON_SIZE}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAddonUnits((u) => Math.min(20, u + 1));
                          if (currentPlan !== "FREE") setCheckoutKind("ADDON");
                        }}
                        disabled={currentPlan === "FREE"}
                        aria-label="Tambah unit add-on"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#15130F] hover:bg-white disabled:opacity-40"
                      >
                        <IconPlus size={14} />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={currentPlan === "FREE"}
                      onClick={() => setCheckoutKind((k) => (k === "ADDON" ? "PLAN" : "ADDON"))}
                      className={`h-10 rounded-full px-4 text-xs font-medium transition disabled:opacity-45 ${
                        checkoutKind === "ADDON"
                          ? "bg-[#15130F] text-[#FAF8F4]"
                          : "border border-[#15130F] text-[#15130F] hover:bg-[#FAF8F4]"
                      }`}
                    >
                      {checkoutKind === "ADDON" ? "Dipilih" : `Pilih (${rupiah(addonPayAmount)})`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Sticky Checkout Summary & Payment Method */}
            <aside className="rounded-2xl border border-[#E6DFD3] bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">Ringkasan</p>

                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#15130F]">
                        {checkoutKind === "ADDON"
                          ? `Add-on +${addonUnits * GUEST_ADDON_SIZE} Tamu`
                          : currentPlan !== "FREE" && isUpgradeDiscount
                            ? `Upgrade ke ${selectedPlanSpec.name}`
                            : `Paket ${selectedPlanSpec.name}`}
                      </p>
                      <p className="text-xs text-[#6B6358]">Untuk: {invitationTitle || "Undangan Anda"}</p>
                    </div>
                    <div className="text-right">
                      {checkoutKind === "PLAN" && isUpgradeDiscount && (
                        <p className="text-xs text-[#9A9183] line-through">{rupiah(selectedPlanSpec.price)}</p>
                      )}
                      <p className="text-sm font-semibold tabular-nums text-[#15130F]">{rupiah(summaryAmount)}</p>
                    </div>
                  </div>
                </div>

                {/* Note banner */}
                <div className="rounded-xl border border-[#E7DEC9] bg-[#FAF6EC] px-3.5 py-2.5 text-xs leading-relaxed text-[#5E5038]">
                  {checkoutKind === "ADDON"
                    ? `Menambah kapasitas total menjadi ${countLabel(
                        totalGuestsAllowed === Infinity ? Infinity : totalGuestsAllowed + addonUnits * GUEST_ADDON_SIZE,
                      )} tamu bernama.`
                    : isUpgradeDiscount
                      ? `Hemat ${rupiah(selectedPlanSpec.price - summaryAmount)} — cukup bayar selisih dari paket ${PLAN_LIMITS[currentPlan].name}.`
                      : selectedPlanSpec.activeDays
                        ? `Berlaku ${selectedPlanSpec.activeDays} hari penuh tanpa batasan edit.`
                        : "Sekali bayar, undangan aktif selamanya tanpa biaya perpanjangan."}
                </div>

                {/* CARA BAYAR */}
                <div className="space-y-2.5 border-t border-[#EFEAE0] pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6358]">Cara Bayar</p>

                  {/* Option 1: Bayar Otomatis (Midtrans Snap) */}
                  <button
                    type="button"
                    disabled={!midtrans.enabled}
                    onClick={() => setPaymentMethod("MIDTRANS")}
                    className={`w-full rounded-xl border p-3.5 text-left transition ${
                      paymentMethod === "MIDTRANS"
                        ? "border-[#8A6A2F] bg-[#FCF9F2] ring-1 ring-[#8A6A2F]/40"
                        : "border-[#E6DFD3] bg-white hover:border-[#CFC6B8]"
                    } ${!midtrans.enabled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          paymentMethod === "MIDTRANS" ? "border-[#8A6A2F]" : "border-[#CFC6B8]"
                        }`}
                      >
                        {paymentMethod === "MIDTRANS" && <span className="h-2 w-2 rounded-full bg-[#8A6A2F]" />}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#15130F]">
                            <IconQrcode size={15} className="text-[#8A6A2F]" /> Bayar otomatis
                          </span>
                          {midtrans.enabled ? (
                            <span className="rounded-full bg-[#F4EAD6] px-2 py-0.5 text-[10px] font-semibold text-[#8A6A2F]">
                              Langsung aktif
                            </span>
                          ) : (
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                              Belum aktif
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-[#6B6358]">
                          {midtrans.enabled
                            ? "Virtual Account, QRIS, e-wallet, dan kartu melalui popup resmi Midtrans Snap."
                            : "Payment gateway otomatis belum diaktifkan di server. Gunakan Transfer manual di bawah."}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Transfer / QRIS manual (hidden when the admin disabled both) */}
                  {manualEnabled && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("MANUAL_TRANSFER")}
                    className={`w-full rounded-xl border p-3.5 text-left transition ${
                      paymentMethod === "MANUAL_TRANSFER"
                        ? "border-[#8A6A2F] bg-[#FCF9F2] ring-1 ring-[#8A6A2F]/40"
                        : "border-[#E6DFD3] bg-white hover:border-[#CFC6B8]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          paymentMethod === "MANUAL_TRANSFER" ? "border-[#8A6A2F]" : "border-[#CFC6B8]"
                        }`}
                      >
                        {paymentMethod === "MANUAL_TRANSFER" && <span className="h-2 w-2 rounded-full bg-[#8A6A2F]" />}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#15130F]">
                          <IconBuildingBank size={15} className="text-[#8A6A2F]" /> {banks.length > 0 && qris ? "Transfer bank / QRIS manual" : qris ? "QRIS manual" : "Transfer bank manual"}
                        </span>
                        <p className="text-xs leading-relaxed text-[#6B6358]">
                          {[banks.length > 0 ? `transfer ke ${banks.map((b) => b.bank).join(", ")}` : "", qris ? "scan QRIS" : ""].filter(Boolean).join(" atau ").replace(/^./, (c) => c.toUpperCase())}
                          , lalu unggah bukti pembayaran untuk diverifikasi admin.
                        </p>
                      </div>
                    </div>
                  </button>
                  )}
                  {!manualEnabled && !midtrans.enabled && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Metode pembayaran sedang tidak tersedia. Silakan hubungi admin.</p>
                  )}
                </div>

                {/* Total Breakdown */}
                <div className="space-y-2 border-t border-[#EFEAE0] pt-4">
                  {paymentMethod === "MANUAL_TRANSFER" && (
                    <div className="flex items-center justify-between text-xs text-[#6B6358]">
                      <span>Kode unik verifikasi</span>
                      <span>+Rp100–Rp999 saat order</span>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-[#3F3A33]">Total</span>
                    <span className="font-serif text-2xl font-semibold tabular-nums lining-nums text-[#15130F]">
                      {rupiah(summaryAmount)}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={!canCheckout || busy}
                    onClick={handleCreatePayment}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#15130F] px-5 text-sm font-semibold text-[#FAF8F4] transition hover:bg-[#2A261F] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {busy ? (
                      <>
                        <IconLoader2 size={17} className="animate-spin" /> Memproses...
                      </>
                    ) : !canCheckout && checkoutKind === "PLAN" ? (
                      currentPlan === selectedPlan ? "Paket ini sudah aktif" : "Sudah termasuk di paketmu"
                    ) : (
                      <>
                        Buat pembayaran <IconArrowRight size={17} />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[11px] leading-relaxed text-[#6B6358]">
                    {paymentMethod === "MIDTRANS"
                      ? "Popup pembayaran resmi Midtrans Snap akan terbuka dengan metode bayar yang aktif."
                      : "Kamu akan mendapatkan nominal kode unik dan rekening tujuan untuk menyelesaikan pembayaran."}
                  </p>
                </div>
              </div>
            </aside>
          </section>
        )}

        {/* Riwayat Pengajuan & Pembayaran */}
        {transactions.length > 0 && (
          <section className="rounded-2xl border border-[#E6DFD3] bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-[#EFEAE0] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4EAD6] text-[#8A6A2F]">
                  <IconReceipt size={18} />
                </span>
                <div>
                  <h2 className="font-serif text-xl font-medium text-[#15130F]">Riwayat Pengajuan &amp; Pembayaran</h2>
                  <p className="text-xs text-[#6B6358]">Pantau status dan riwayat transaksi aktivasi maupun upgrade undanganmu</p>
                </div>
              </div>
            </div>

            <div className="mt-4 divide-y divide-[#EFEAE0]">
              {transactions.map((t) => {
                const title =
                  t.kind === "GUEST_ADDON"
                    ? `Add-on +${(t.addonUnits || 1) * GUEST_ADDON_SIZE} Tamu`
                    : t.plan && PLAN_LIMITS[t.plan]
                      ? `Paket ${PLAN_LIMITS[t.plan].name}`
                      : "Pembayaran";

                const progressLabel =
                  t.status === "SUCCESS"
                    ? { text: "Berhasil · Paket Aktif", cls: "bg-[#F5EFE3] text-[#5C4620] border-[#DFD2BC]" }
                    : t.status === "FAILED"
                      ? { text: "Dibatalkan / Ditolak", cls: "bg-zinc-100 text-zinc-600 border-zinc-200" }
                      : t.paymentMethod === "MANUAL_TRANSFER"
                        ? t.paymentProof
                          ? { text: "Tahap 3/4 · Menunggu verifikasi admin", cls: "bg-[#FBF3E0] text-[#78571E] border-[#E3CFA0]" }
                          : { text: "Tahap 2/4 · Menunggu transfer & bukti", cls: "bg-amber-50 text-amber-800 border-amber-200" }
                        : { text: "Menunggu pembayaran otomatis", cls: "bg-sky-50 text-sky-700 border-sky-200" };

                return (
                  <div key={t.id} className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#15130F]">{title}</p>
                        <span className="rounded-full bg-[#FAF8F4] px-2 py-0.5 text-[11px] text-[#6B6358]">
                          {t.paymentMethod === "MIDTRANS" ? "Bayar otomatis" : "Transfer manual"}
                        </span>
                      </div>
                      <p className="truncate text-xs text-[#6B6358]">
                        {t.invitationTitle} ·{" "}
                        {new Date(t.createdAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {t.notes && <p className="text-xs text-[#5E574D]">{t.notes}</p>}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      {t.paymentProof && (
                        <a
                          href={t.paymentProof}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-[#8A6A2F] underline-offset-2 hover:underline"
                        >
                          Lihat bukti
                        </a>
                      )}
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${progressLabel.cls}`}>
                        {progressLabel.text}
                      </span>
                      <span className="min-w-24 text-right font-serif text-base font-semibold tabular-nums lining-nums text-[#15130F]">
                        {rupiah(t.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
