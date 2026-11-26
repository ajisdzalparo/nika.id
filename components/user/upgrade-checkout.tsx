"use client";

import { waLink } from "@/lib/phone";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { computePromoDiscount, promoAppliesToKind, type PromoCheckoutKind, type PromoRule } from "@/lib/promo-shared";
import {
  IconArrowLeft,
  IconArrowRight,
  IconArrowUpRight,
  IconBrandWhatsapp,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheckFilled,
  IconClock,
  IconCopy,
  IconCrown,
  IconLoader2,
  IconMinus,
  IconPlus,
  IconQrcode,
  IconBuildingBank,
  IconBuildingStore,
  IconPalette,
  IconReceipt,
  IconRefresh,
  IconTag,
  IconCalendarPlus,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { CoverThumb } from "@/components/templates/ai-design/cover-thumb";
import { SafeImg } from "@/components/common/safe-img";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AiQuota } from "@/lib/ai-design/server";
import type { CatalogItem } from "@/lib/catalog-shared";
import {
  AGENCY_PACKS,
  AI_CREDIT_COST_REFERENCE,
  AI_CREDIT_COST_STANDARD,
  AI_CREDIT_PACKS,
  GUEST_ADDON_PRICE,
  RENEWAL_PRICE,
  GUEST_ADDON_SIZE,
  PAID_PLANS,
  PLAN_LIMITS,
  computeReferralDiscount,
  getAgencyPack,
  getAiCreditPack,
  getMaxGuests,
  getUpgradePrice,
  planPrice,
  type PaidPlan,
  type PlanPrices,
  type AgencyPackId,
  type AiCreditPackId,
  type PlanType,
} from "@/lib/limits";

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

interface MarketplaceTemplateSummary {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  creatorName: string | null;
}

interface UpgradeCheckoutProps {
  invitationId: string;
  invitationTitle: string;
  currentPlan: PlanType;
  /** ISO expiry of the active invitation's plan (for the renewal option) */
  planExpiresAt: string | null;
  extraGuestQuota: number;
  agencyQuota: number;
  /** Admin-approved mitra: only they see and buy the wholesale quota packs */
  isMitra: boolean;
  /** Current plan prices (admin-editable) */
  planPrices: PlanPrices;
  aiQuota: AiQuota;
  initialKind?: CheckoutKind;
  initialMarketplaceTemplate?: MarketplaceTemplateSummary | null;
  initialReferral: { code: string; referrerName: string; isAgency: boolean } | null;
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
type CheckoutKind = "PLAN" | "ADDON" | "AI_CREDIT" | "AGENCY_QUOTA" | "MARKETPLACE" | "RENEWAL";
type UpgradeTab = "PLAN" | "AGENCY_QUOTA" | "AI_CREDIT" | "EXTRAS" | "MARKETPLACE" | "HISTORY";

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
    p.canRemoveWatermark ? "Tanpa watermark SatuMoment" : "",
    p.activeDays === null ? "Masa aktif undangan selamanya" : `Masa aktif ${p.activeDays} hari sejak aktivasi`,
    p.allowedTemplateTypes.length > 1 ? "Semua template katalog" : `Akses template ${p.allowedTemplateTypes.join(" & ")}`,
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
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#DDD5C7] bg-[#FCF8F1] px-3 text-xs font-medium text-[#1A1510] transition hover:bg-[#F3EBDB]"
      aria-label={label}
    >
      {done ? <IconCheck size={14} className="text-[#8A6424]" /> : <IconCopy size={14} />}
      {done ? "Tersalin" : "Salin"}
    </button>
  );
}

interface AppliedCode {
  /** MITRA: a mitra's code, no client discount (the mitra earns bonus quota) */
  type: "PROMO" | "REFERRAL" | "MITRA";
  code: string;
  label: string;
  rule?: PromoRule;
}

/** 90 → "3 bulan", 180 → "6 bulan", 365 → "1 tahun"; null means no expiry (legacy plans). */
function durationLabel(days: number | null) {
  if (!days) return "selamanya";
  if (days % 365 === 0) return `${days / 365} tahun`;
  if (days % 30 === 0) return `${days / 30} bulan`;
  return `${days} hari`;
}

export function UpgradeCheckout({
  invitationId,
  invitationTitle,
  currentPlan,
  extraGuestQuota,
  agencyQuota,
  isMitra,
  planPrices,
  planExpiresAt,
  aiQuota,
  initialKind,
  initialMarketplaceTemplate = null,
  initialReferral,
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
  const summaryRef = useRef<HTMLElement>(null);

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

  const resolvedInitialKind: CheckoutKind =
    initialKind === "MARKETPLACE" && initialMarketplaceTemplate ? "MARKETPLACE" : (initialKind ?? "PLAN");
  const [checkoutKind, setCheckoutKind] = useState<CheckoutKind>(resolvedInitialKind);
  const [activeTab, setActiveTab] = useState<UpgradeTab>(() => {
    if (resolvedInitialKind === "MARKETPLACE" && initialMarketplaceTemplate) return "MARKETPLACE";
    if (resolvedInitialKind === "AGENCY_QUOTA" && isMitra) return "AGENCY_QUOTA";
    if (resolvedInitialKind === "AI_CREDIT") return "AI_CREDIT";
    if (resolvedInitialKind === "ADDON" || resolvedInitialKind === "RENEWAL") return "EXTRAS";
    return "PLAN";
  });
  const [showTemplates, setShowTemplates] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const marketplaceTemplate = initialMarketplaceTemplate;
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(() => getDefaultSelectedPlan(currentPlan));
  const [addonUnits, setAddonUnits] = useState(1);
  const [selectedPackId, setSelectedPackId] = useState<AiCreditPackId>("AI_30");
  const [selectedAgencyPackId, setSelectedAgencyPackId] = useState<AgencyPackId>("AGENCY_30");
  // One "Kode promo" field: an admin promo code, or a friend's referral code (auto-filled from a referral link)
  const [appliedCode, setAppliedCode] = useState<AppliedCode | null>(
    initialReferral
      ? initialReferral.isAgency
        ? { type: "MITRA", code: initialReferral.code, label: `Dibantu mitra ${initialReferral.referrerName}` }
        : { type: "REFERRAL", code: initialReferral.code, label: `Kode dari ${initialReferral.referrerName} · diskon 10% (maks Rp15rb)` }
      : null,
  );
  const [codeInput, setCodeInput] = useState(initialReferral?.code ?? "");
  const [checkingCode, setCheckingCode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => (midtrans.enabled ? "MIDTRANS" : "MANUAL_TRANSFER"));
  const [busy, setBusy] = useState(false);
  const [confirmCancelMode, setConfirmCancelMode] = useState<"manual" | "snap" | null>(null);

  const selectedCreditPack = getAiCreditPack(selectedPackId) ?? AI_CREDIT_PACKS[1];
  const selectedAgencyPack = getAgencyPack(selectedAgencyPackId) ?? AGENCY_PACKS[1];

  const totalGuestsAllowed = getMaxGuests(currentPlan, extraGuestQuota);
  const selectedPlanSpec = { ...PLAN_LIMITS[selectedPlan], price: planPrice(selectedPlan, planPrices) };
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
  const planDiff = getUpgradePrice(currentPlan, selectedPlan, planPrices);
  const canPaySelectedPlan = planDiff !== null && currentPlan !== selectedPlan;
  const planPayAmount = planDiff ?? selectedPlanSpec.price;
  const isUpgradeDiscount = currentPlan !== "FREE" && planDiff !== null && planDiff < selectedPlanSpec.price;

  const addonPayAmount = addonUnits * GUEST_ADDON_PRICE;
  const rawSummaryAmount =
    checkoutKind === "MARKETPLACE" && marketplaceTemplate
      ? marketplaceTemplate.price
      : checkoutKind === "RENEWAL"
        ? RENEWAL_PRICE
      : checkoutKind === "ADDON"
        ? addonPayAmount
        : checkoutKind === "AI_CREDIT"
          ? selectedCreditPack.price
          : checkoutKind === "AGENCY_QUOTA"
            ? selectedAgencyPack.price
            : planPayAmount;
  // Mirrors resolveCheckoutOrder: no referral on marketplace templates or AI credit top-ups.
  const apiKind: PromoCheckoutKind =
    checkoutKind === "ADDON" ? "GUEST_ADDON" : checkoutKind === "RENEWAL" || checkoutKind === "AI_CREDIT" || checkoutKind === "AGENCY_QUOTA" || checkoutKind === "MARKETPLACE" ? checkoutKind : "PLAN";
  const codeFieldAllowed = checkoutKind !== "MARKETPLACE";
  const codeDiscount = !appliedCode
    ? 0
    : appliedCode.type === "PROMO" && appliedCode.rule
      ? promoAppliesToKind(appliedCode.rule, apiKind) && rawSummaryAmount >= appliedCode.rule.minPurchase
        ? computePromoDiscount(appliedCode.rule, rawSummaryAmount)
        : 0
      : appliedCode.type === "REFERRAL" && apiKind !== "AI_CREDIT" && apiKind !== "MARKETPLACE"
        ? computeReferralDiscount(rawSummaryAmount)
        : 0;
  const codeNotApplicable = Boolean(appliedCode) && (appliedCode?.type === "MITRA" ? apiKind !== "PLAN" : codeDiscount === 0);
  // A 100% promo (e.g. a mitra trial code) makes the order free; it is activated without payment
  const isFreeOrder = codeDiscount > 0 && codeDiscount >= rawSummaryAmount;
  const summaryAmount = isFreeOrder ? 0 : Math.max(1000, rawSummaryAmount - codeDiscount);
  const canCheckout =
    checkoutKind === "MARKETPLACE"
      ? marketplaceTemplate !== null
      : checkoutKind === "RENEWAL"
        ? currentPlan !== "FREE" && Boolean(planExpiresAt)
        : checkoutKind === "ADDON"
          ? currentPlan !== "FREE" && currentPlan !== "EKSKLUSIF"
          : checkoutKind === "AI_CREDIT" || checkoutKind === "AGENCY_QUOTA"
            ? true
            : canPaySelectedPlan;

  const hasExtras = currentPlan !== "FREE";

  const switchTab = (tab: UpgradeTab) => {
    setActiveTab(tab);
    if (tab === "PLAN") setCheckoutKind("PLAN");
    else if (tab === "AGENCY_QUOTA") setCheckoutKind("AGENCY_QUOTA");
    else if (tab === "AI_CREDIT") setCheckoutKind("AI_CREDIT");
    else if (tab === "MARKETPLACE" && marketplaceTemplate) setCheckoutKind("MARKETPLACE");
    else if (tab === "EXTRAS") {
      setCheckoutKind(currentPlan !== "EKSKLUSIF" ? "ADDON" : "RENEWAL");
    }
  };

  useEffect(() => {
    const el = summaryRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setSummaryVisible(Boolean(entries[0]?.isIntersecting)),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [activeTab, order, snapOrder]);

  const applyCode = async () => {
    const clean = codeInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!clean) {
      setAppliedCode(null);
      return;
    }
    setCheckingCode(true);
    try {
      const params = new URLSearchParams({ code: clean, kind: apiKind, amount: String(rawSummaryAmount) });
      const res = await fetch(`/api/promo/validate?${params.toString()}`);
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.valid) {
        toast.error(d.message || "Kode promo tidak berlaku");
        return;
      }
      setAppliedCode({ type: d.type, code: d.code, label: d.label, rule: d.rule });
      setCodeInput(d.code);
      toast.success(`Kode ${d.code} dipakai.`);
    } catch {
      toast.error("Gagal memeriksa kode promo. Coba lagi.");
    } finally {
      setCheckingCode(false);
    }
  };

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
          toast.success("Pembayaran berhasil diterima! Paket atau kredit AI langsung aktif.");
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

  const buildCheckoutPayload = () => {
    // "" tells the server not to fall back to a referral cookie after the user removed the code
    const refPart = { promoCode: appliedCode && !codeNotApplicable ? appliedCode.code : "" };
    if (checkoutKind === "MARKETPLACE" && marketplaceTemplate) {
      return { kind: "MARKETPLACE", templateId: marketplaceTemplate.id, invitationId, referralCode: "" };
    }
    if (checkoutKind === "ADDON") return { kind: "GUEST_ADDON", addonUnits, invitationId, ...refPart };
    if (checkoutKind === "RENEWAL") return { kind: "RENEWAL", invitationId, ...refPart };
    if (checkoutKind === "AI_CREDIT") return { kind: "AI_CREDIT", packId: selectedPackId, referralCode: "" };
    if (checkoutKind === "AGENCY_QUOTA") return { kind: "AGENCY_QUOTA", packId: selectedAgencyPackId, ...refPart };
    return { kind: "PLAN", plan: selectedPlan, invitationId, ...refPart };
  };

  const handleCreatePayment = async () => {
    if (!canCheckout || busy) return;
    setBusy(true);

    try {
      const payload = buildCheckoutPayload();
      if (isFreeOrder) {
        const res = await fetch("/api/payment/free", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(d.message || "Gagal mengaktifkan pesanan");
          return;
        }
        toast.success(`${d.label} aktif dengan kode promo.`);
        router.refresh();
        return;
      }
      if (paymentMethod === "MIDTRANS") {
        if (!midtrans.enabled) {
          toast.error("Pembayaran otomatis belum aktif. Silakan pilih Transfer manual.");
          setPaymentMethod("MANUAL_TRANSFER");
          return;
        }

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
            invitationTitle:
              createdSnap.kind === "AI_CREDIT"
                ? "Kredit per akun"
                : createdSnap.kind === "AGENCY_QUOTA"
                  ? "Kuota Mitra (per akun)"
                  : invitationTitle,
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
        const orderKind = data.order.kind ?? (checkoutKind === "ADDON" ? "GUEST_ADDON" : checkoutKind);
        const newItem: TransactionHistoryItem = {
          id: data.order.id,
          kind: orderKind,
          addonUnits: data.order.addonUnits ?? 0,
          plan: data.order.plan ?? null,
          amount: data.order.amount,
          status: "PENDING",
          paymentMethod: "MANUAL_TRANSFER",
          paymentProof: data.order.paymentProof ?? null,
          notes: data.order.notes ?? null,
          invitationTitle:
            orderKind === "AI_CREDIT"
              ? "Kredit per akun"
              : orderKind === "AGENCY_QUOTA"
                ? "Kuota Mitra (per akun)"
                : invitationTitle,
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

  const handleCancelOrder = () => {
    setConfirmCancelMode("manual");
  };

  const executeCancelOrder = async () => {
    setConfirmCancelMode(null);
    setBusy(true);
    try {
      await fetch("/api/payment/manual", { method: "DELETE" });
      if (order) {
        setTransactions((prev) => prev.map((t) => (t.id === order.id ? { ...t, status: "FAILED", notes: "Dibatalkan oleh user" } : t)));
      }
      setOrder(null);
      setDraftProof("");
      setSenderName("");
      toast.success("Pengajuan pembayaran dibatalkan");
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

  const handleCancelSnapOrder = () => {
    if (!snapOrder) return;
    setConfirmCancelMode("snap");
  };

  const executeCancelSnapOrder = async () => {
    if (!snapOrder) return;
    setConfirmCancelMode(null);
    setBusy(true);
    try {
      await fetch(`/api/payment/token?orderId=${encodeURIComponent(snapOrder.id)}`, { method: "DELETE" });
      setTransactions((prev) => prev.map((t) => (t.id === snapOrder.id ? { ...t, status: "FAILED", notes: "Dibatalkan oleh user" } : t)));
      setSnapOrder(null);
      toast.success("Tagihan pembayaran dibatalkan");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const formatOrderTitle = (item: { kind?: string; addonUnits?: number; plan?: PlanType | null }) => {
    if (item.kind === "MARKETPLACE") return "Pembelian Template Marketplace";
    if (item.kind === "AGENCY_QUOTA") return `Kuota Mitra (${item.addonUnits ?? 0} undangan)`;
    if (item.kind === "AI_CREDIT") return `Top-up ${item.addonUnits ?? 0} Kredit AI`;
    if (item.kind === "RENEWAL") return "Perpanjangan 1 tahun";
    if (item.kind === "GUEST_ADDON") return `Add-on +${(item.addonUnits ?? 1) * GUEST_ADDON_SIZE} Tamu`;
    if (item.plan && PLAN_LIMITS[item.plan]) return `Paket ${PLAN_LIMITS[item.plan].name}`;
    return "Pesanan";
  };

  const activeOrder = order ?? snapOrder;
  const orderTitle = activeOrder ? formatOrderTitle(activeOrder) : "";
  const orderTargetLabel =
    activeOrder?.kind === "AI_CREDIT"
      ? "Kredit per akun"
      : activeOrder?.kind === "AGENCY_QUOTA"
        ? "Kuota Mitra (per akun)"
        : invitationTitle;

  const selectedSummaryTitle =
    checkoutKind === "MARKETPLACE" && marketplaceTemplate
      ? `Template "${marketplaceTemplate.name}"`
      : checkoutKind === "RENEWAL"
        ? "Perpanjangan 1 tahun"
        : checkoutKind === "ADDON"
          ? `Add-on +${addonUnits * GUEST_ADDON_SIZE} Tamu`
          : checkoutKind === "AI_CREDIT"
            ? `Top-up ${selectedCreditPack.credits} Kredit AI`
            : checkoutKind === "AGENCY_QUOTA"
              ? `${selectedAgencyPack.label} (${selectedAgencyPack.quota} kuota)`
              : currentPlan !== "FREE" && isUpgradeDiscount
                ? `Upgrade ke ${selectedPlanSpec.name}`
                : `Paket ${selectedPlanSpec.name}`;

  const tabs: { id: UpgradeTab; label: string; badge?: string }[] = [
    ...(marketplaceTemplate ? [{ id: "MARKETPLACE" as const, label: "Template Kreator" }] : []),
    ...(isMitra ? [{ id: "AGENCY_QUOTA" as const, label: "Kuota Mitra", badge: `${agencyQuota}` }] : []),
    { id: "PLAN", label: "Paket Undangan" },
    { id: "AI_CREDIT", label: "Kredit AI", badge: `${aiQuota.remaining}` },
    ...(hasExtras ? [{ id: "EXTRAS" as const, label: "Tambahan" }] : []),
    ...(transactions.length > 0 ? [{ id: "HISTORY" as const, label: "Riwayat", badge: `${transactions.length}` }] : []),
  ];

  const renderTransactionsSection = () =>
    transactions.length > 0 ? (
      <section className="rounded-2xl border border-[#EDE3CF] bg-white p-5 shadow-xs sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-[#F3EBDB] pb-4">
          <div className="flex items-center gap-2.5">
            <IconReceipt size={18} className="shrink-0 text-[#8A6424]" />
            <div>
              <h2 className="font-serif text-xl font-medium text-[#1A1510]">Riwayat Pengajuan &amp; Pembayaran</h2>
              <p className="text-xs text-[#6B5F50]">Pantau status dan riwayat transaksi aktivasi maupun upgrade undanganmu</p>
            </div>
          </div>
        </div>

        <div className="mt-4 divide-y divide-[#F3EBDB]">
          {transactions.map((t) => {
            const title = formatOrderTitle(t);

            const successText =
              t.kind === "MARKETPLACE"
                ? "Berhasil · Template Terpasang"
                : t.kind === "AGENCY_QUOTA"
                  ? "Berhasil · Kuota Mitra Aktif"
                  : t.kind === "AI_CREDIT"
                    ? "Berhasil · Kredit AI Aktif"
                    : t.kind === "GUEST_ADDON"
                      ? "Berhasil · Add-on Aktif"
                      : "Berhasil · Paket Aktif";

            const progressLabel =
              t.status === "SUCCESS"
                ? { text: successText, cls: "bg-[#F7F0E1] text-[#5C431A] border-[#E6D5B2]" }
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
                    <p className="text-sm font-semibold text-[#1A1510]">{title}</p>
                    <span className="rounded-full bg-[#FCF8F1] px-2 py-0.5 text-[11px] text-[#6B5F50]">
                      {t.paymentMethod === "MIDTRANS" ? "Bayar otomatis" : "Transfer manual"}
                    </span>
                  </div>
                  <p className="truncate text-xs text-[#6B5F50]">
                    {t.invitationTitle} ·{" "}
                    {new Date(t.createdAt).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Jakarta",
                    })}
                  </p>
                  {t.notes && <p className="text-xs text-[#5E5446]">{t.notes}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  {t.paymentProof && (
                    <a
                      href={t.paymentProof}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-[#8A6424] underline-offset-2 hover:underline"
                    >
                      Lihat bukti
                    </a>
                  )}
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${progressLabel.cls}`}>
                    {progressLabel.text}
                  </span>
                  <span className="min-w-24 text-right font-serif text-base font-semibold tabular-nums lining-nums text-[#1A1510]">
                    {rupiah(t.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    ) : null;

  return (
    <div className="flex-1 bg-[#FCF8F1] px-4 pb-24 pt-6 lg:px-8 lg:pb-16">
      <div className="w-full space-y-5">
        {/* Compact header */}
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A6424]">
              Paket &amp; Pembayaran{invitationTitle ? ` · ${invitationTitle}` : ""}
            </p>
            <h1 className="font-serif text-3xl font-medium leading-tight tracking-tight text-[#1A1510] sm:text-[2.1rem]">
              {order || snapOrder ? "Selesaikan pembayaran kamu" : "Pilih paket atau top-up"}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentPlan === "FREE" ? (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E7D4A6] bg-[#FBF5E6] px-3.5 py-1.5 text-xs font-medium text-[#6D5221]">
                <IconClock size={13} className="shrink-0" />
                Mode Pratinjau · belum aktif
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E9DDC6] bg-white px-3.5 py-1.5 text-xs font-medium text-[#40372B]">
                <IconCheck size={13} className="shrink-0 text-[#8A6424]" />
                <span>
                  Paket <strong className="text-[#1A1510]">{PLAN_LIMITS[currentPlan].name}</strong> ·{" "}
                  {countLabel(totalGuestsAllowed)} tamu
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Active Automatic Midtrans Snap Payment View */}
        {snapOrder ? (
          <section className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start">
            <div className="space-y-6 rounded-2xl border border-[#EDE3CF] bg-white p-6 shadow-xs sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F3EBDB] pb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D5B2] bg-[#F7F0E1] px-3 py-1 text-[11px] font-semibold text-[#5C431A]">
                    <IconClock size={13} className="text-[#8A6424]" /> Menunggu Pembayaran · Midtrans Snap
                  </span>
                  <p className="mt-2 text-sm text-[#5E5446]">
                    {orderTitle} · {orderTargetLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-[#8C8272]">Order ID: {snapOrder.id}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelSnapOrder}
                  disabled={busy}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E9DDC6] px-3.5 text-xs font-medium text-[#5E5446] transition hover:bg-[#FCF8F1] hover:text-[#1A1510]"
                >
                  <IconArrowLeft size={14} /> Ganti metode
                </button>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[#8A6424]">Total Pembayaran</p>
                <p className="mt-1 font-serif text-4xl font-medium lining-nums text-[#1A1510] sm:text-5xl">
                  {rupiah(snapOrder.amount)}
                </p>
              </div>

              <div className="rounded-2xl border border-[#EDE3CF] bg-[#FCF8F1] p-5 text-sm leading-relaxed text-[#5E5446]">
                Popup pembayaran resmi Midtrans Snap menyediakan semua metode yang aktif pada akun merchant (Virtual Account, QRIS, e-wallet, atau kartu). Klik tombol di bawah jika popup belum terbuka atau tertutup.
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F3EBDB] pt-4">
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleReopenSnap}
                    disabled={busy}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1A1510] px-5 text-sm font-semibold text-[#FCF8F1] transition hover:bg-[#2B241B] disabled:opacity-50"
                  >
                    {busy ? <IconLoader2 size={16} className="animate-spin" /> : <IconQrcode size={16} />}
                    Buka Pembayaran Midtrans
                  </button>
                  <button
                    type="button"
                    onClick={() => void checkSnapStatus(snapOrder.id, false)}
                    disabled={checkingStatus}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-[#E9DDC6] bg-white px-5 text-sm font-medium text-[#1A1510] transition hover:bg-[#FCF8F1] disabled:opacity-50"
                  >
                    <IconRefresh size={16} className={checkingStatus ? "animate-spin" : ""} />
                    {checkingStatus ? "Mengecek..." : "Cek Status"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCancelSnapOrder}
                  disabled={busy}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm text-[#6E675C] hover:bg-[#FCF8F1] hover:text-[#1A1510]"
                >
                  <IconX size={16} /> Batalkan tagihan
                </button>
              </div>
            </div>

            <aside className="space-y-4 rounded-2xl border border-[#EDE3CF] bg-white p-6 shadow-xs lg:sticky lg:top-20">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6424]">Status Otomatis</p>
                <h2 className="mt-1 font-serif text-2xl font-medium text-[#1A1510]">Aktivasi Seketika</h2>
              </div>
              <p className="text-xs leading-relaxed text-[#5E5446]">
                Halaman ini memantau status transaksi Midtrans secara otomatis setiap beberapa detik. Setelah pembayaran selesai, paket undangan langsung aktif tanpa perlu unggah bukti.
              </p>
            </aside>
          </div>
          {renderTransactionsSection()}
          </section>
        ) : order ? (
          <section className="space-y-6">
            {/* Progress Stepper */}
            <div className="rounded-2xl border border-[#EDE3CF] bg-white p-5 shadow-xs sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6424]">Progress Pengajuan Pembayaran</p>
                  <p className="mt-0.5 text-sm font-medium text-[#1A1510]">
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
                        ? "border-[#8A6424] bg-[#FBF7EE]"
                        : s.done
                          ? "border-[#E6D5B2] bg-[#F7F0E1]"
                          : "border-[#F3EBDB] bg-[#FCF8F1]/60 opacity-70"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        s.done
                          ? "bg-[#8A6424] text-white"
                          : s.active
                            ? "bg-[#1A1510] text-[#FCF8F1]"
                            : "bg-[#EDE3CF] text-[#5E5446]"
                      }`}
                    >
                      {s.done ? <IconCheck size={13} /> : s.step}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1A1510]">{s.label}</p>
                      <p className="text-[11px] text-[#6B5F50]">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_370px] lg:items-start">
              <div className="space-y-6 rounded-2xl border border-[#EDE3CF] bg-white p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F3EBDB] pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8A6424]">Rincian Pengajuan</p>
                    <p className="mt-1 text-sm font-medium text-[#1A1510]">
                      {orderTitle} · {orderTargetLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={busy}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E9DDC6] px-3.5 text-xs font-medium text-[#5E5446] transition hover:bg-[#FCF8F1] hover:text-[#1A1510]"
                  >
                    <IconArrowLeft size={14} /> Ganti paket / batalkan
                  </button>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[#8A6424]">Total Transfer</p>
                    <p className="mt-1 font-serif text-4xl font-medium lining-nums text-[#1A1510] sm:text-5xl">{rupiah(order.amount)}</p>
                    <p className="mt-2 text-sm text-[#5E5446]">
                      Transfer <strong className="font-semibold text-[#1A1510]">tepat sampai 3 digit terakhir</strong> ({String(order.amount).slice(-3)}) agar pengajuan cepat dicocokkan.
                    </p>
                  </div>
                  <CopyButton text={String(order.amount)} label="Salin nominal transfer" />
                </div>

                <div className="space-y-3 border-t border-[#F3EBDB] pt-5">
                  {qris && (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-[#EDE3CF] bg-white p-5 text-center sm:flex-row sm:text-left">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qris} alt="Kode QRIS pembayaran" className="h-48 w-48 shrink-0 rounded-lg object-contain" />
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-[#1A1510]">Scan QRIS</p>
                        <p className="text-sm text-[#5E5446]">Buka e-wallet atau m-banking, pindai kode ini, lalu bayar <strong className="font-semibold text-[#1A1510]">{rupiah(order.amount)}</strong> tepat sampai 3 digit terakhir.</p>
                      </div>
                    </div>
                  )}
                  {(banks.length > 0 || !qris) && <p className="text-sm font-semibold text-[#1A1510]">{qris ? "Atau transfer ke rekening" : "Rekening Tujuan Transfer"}</p>}
                  {banks.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {banks.map((b) => (
                        <div key={b.number} className="flex items-center justify-between gap-3 rounded-xl border border-[#EDE3CF] bg-[#FCF8F1]/70 p-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A6424]">{b.bank}</p>
                            <p className="mt-1 break-all font-serif text-lg font-medium tabular-nums lining-nums text-[#1A1510]">{b.number}</p>
                            <p className="truncate text-xs text-[#5E5446]">a.n. {b.holder}</p>
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

                <div className="flex flex-wrap gap-3 border-t border-[#F3EBDB] pt-5">
                  {whatsapp && (
                    <a
                      href={waLink(whatsapp, `Halo, saya sudah mengajukan konfirmasi transfer ${rupiah(order.amount)} untuk ${orderTitle} (pesanan ${order.id.slice(-6)}).`) ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-[#D8CFC0] bg-white px-4 text-sm font-medium text-[#1A1510] transition hover:bg-[#FCF8F1]"
                    >
                      <IconBrandWhatsapp size={17} className="text-[#8A6424]" /> Konfirmasi via WhatsApp
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={busy}
                    className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm text-[#6E675C] transition hover:bg-[#FCF8F1] hover:text-[#1A1510]"
                  >
                    <IconX size={16} /> Batalkan pengajuan
                  </button>
                </div>
              </div>

              <aside className="rounded-2xl border border-[#EDE3CF] bg-white p-6 shadow-xs lg:sticky lg:top-20">
                <form onSubmit={handleSubmitProof} className="space-y-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6424]">Form Pengajuan</p>
                    <h2 className="mt-1 font-serif text-2xl font-medium text-[#1A1510]">Konfirmasi Transfer</h2>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="sender-name" className="block text-xs font-medium text-[#40372B]">
                      Nama Pengirim / Bank Asal (opsional)
                    </label>
                    <input
                      id="sender-name"
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Contoh: Budi Santoso - BCA"
                      className="h-10 w-full rounded-xl border border-[#DDD5C7] bg-[#FCF8F1] px-3 text-sm text-[#1A1510] placeholder:text-[#9A9183] focus:border-[#8A6424] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-[#40372B]">Bukti Transfer / Screenshot</p>
                    <ImageUploadField
                      value={draftProof}
                      onChange={(url) => setDraftProof(url)}
                      aspect="aspect-[4/3]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingProof || !draftProof}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1A1510] px-4 text-sm font-semibold text-[#FCF8F1] transition hover:bg-[#2B241B] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {submittingProof && <IconLoader2 size={16} className="animate-spin" />}
                    {order.paymentProof ? "Perbarui Pengajuan Pembayaran" : "Kirim Pengajuan Pembayaran"}
                  </button>

                  {order.paymentProof ? (
                    <p className="flex gap-2 rounded-xl bg-[#F5E8CA] p-3 text-xs leading-relaxed text-[#6E4F1C]">
                      <IconClock size={16} className="mt-0.5 shrink-0" />
                      Pengajuan sudah masuk. Paket aktif otomatis setelah diverifikasi admin, atau kamu bisa perbarui bukti bila salah unggah.
                    </p>
                  ) : (
                    <p className="text-xs leading-relaxed text-[#5E5446]">
                      Unggah foto/screenshot bukti transfer lalu klik <strong>Kirim Pengajuan Pembayaran</strong> agar masuk antrean verifikasi admin.
                    </p>
                  )}
                </form>
              </aside>
            </div>
            {renderTransactionsSection()}
          </section>
        ) : (
          /* Clean Tabbed Two-Column Checkout: 1 category at a time + always-reachable sticky payment summary */
          <section className="space-y-5">
            {/* Category Tabs */}
            <nav aria-label="Kategori pembayaran" className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => switchTab(tab.id)}
                    className={`inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-xs font-medium transition ${
                      isActive
                        ? "border-[#1A1510] bg-[#1A1510] text-[#FCF8F1] shadow-xs"
                        : "border-[#E9DDC6] bg-white text-[#5E5446] hover:border-[#8A6424] hover:text-[#1A1510]"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                          isActive ? "bg-white/15 text-[#F6EEDD]" : "bg-[#F6EEDF] text-[#8A6424]"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {activeTab === "HISTORY" ? (
              renderTransactionsSection()
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start">
                {/* LEFT COLUMN: Focused view of ONLY the selected category */}
                <div className="min-w-0 space-y-5">
                  {activeTab === "MARKETPLACE" && marketplaceTemplate && (
                    <div className="rounded-2xl border border-[#8A6424] bg-white p-5 shadow-xs ring-2 ring-[#D9B56A]/30 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6424]">
                            Template Marketplace Kreator
                          </p>
                          <h2 className="font-serif text-2xl font-medium text-[#1A1510]">
                            {marketplaceTemplate.name}
                          </h2>
                          <p className="text-xs leading-relaxed text-[#6B5F50]">
                            {marketplaceTemplate.category}
                            {marketplaceTemplate.creatorName ? ` · Karya ${marketplaceTemplate.creatorName}` : ""} · Sekali beli untuk undangan{" "}
                            <strong className="text-[#1A1510]">{invitationTitle}</strong>.
                          </p>
                        </div>
                        <span className="font-serif text-2xl font-semibold tabular-nums text-[#1A1510]">
                          {rupiah(marketplaceTemplate.price)}
                        </span>
                      </div>
                    </div>
                  )}

                  {activeTab === "PLAN" && (
                    <>
                      {/* 3 Plan Cards */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[#6B5F50]">
                            Sekali bayar per undangan. Data, foto, dan desain tetap bebas diedit setelah aktif.
                          </p>
                          <div className="flex items-center gap-1.5 sm:hidden">
                            <button
                              type="button"
                              onClick={() => scrollPlans(-1)}
                              aria-label="Geser paket ke kiri"
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E9DDC6] bg-white text-[#1A1510]"
                            >
                              <IconChevronLeft size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => scrollPlans(1)}
                              aria-label="Geser paket ke kanan"
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E9DDC6] bg-white text-[#1A1510]"
                            >
                              <IconChevronRight size={16} />
                            </button>
                          </div>
                        </div>

                        <div
                          ref={sliderRef}
                          className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-2 pt-3 [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 sm:pt-2"
                        >
                          {PAID_PLANS.map((k) => {
                            const spec = { ...PLAN_LIMITS[k], price: planPrices[k as PaidPlan] };
                            const diff = getUpgradePrice(currentPlan, k, planPrices);
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
                                      ? "border-[#D9B56A] bg-[#1A1510] text-[#FCF8F1] ring-2 ring-[#D9B56A]/40 shadow-md"
                                      : "border-[#2D2820] bg-[#1D1A15] text-[#FCF8F1] hover:border-[#8A6424]"
                                    : isSelected
                                      ? isPopular
                                        ? "border-[#8A6424] bg-gradient-to-b from-[#FBF4E4] to-white text-[#1A1510] ring-2 ring-[#D9B56A]/35 shadow-sm"
                                        : "border-[#1A1510] bg-white text-[#1A1510] ring-2 ring-[#1A1510]/15 shadow-sm"
                                      : isPopular
                                        ? "border-[#E6D5B2] bg-[#FDF9F0] text-[#1A1510] hover:border-[#D9B56A]"
                                        : "border-[#EDE3CF] bg-white text-[#1A1510] hover:border-[#C5BBA8]"
                                } ${isDowngrade ? "opacity-65" : ""}`}
                              >
                                {isPopular && (
                                  <span className="absolute -top-2.5 left-4 rounded-full bg-[#8A6424] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                                    Paling Laris
                                  </span>
                                )}

                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      {isDark && <IconCrown size={14} className="shrink-0 text-[#D9B56A]" />}
                                      <p className="font-serif text-xl font-medium leading-tight">{spec.name}</p>
                                    </div>
                                    <p className={`text-xs leading-snug ${isDark ? "text-zinc-400" : "text-[#6B5F50]"}`}>
                                      {PLAN_TAGLINES[k]}
                                    </p>
                                  </div>

                                  <span className="mt-0.5 shrink-0">
                                    {isSelected ? (
                                      <IconCircleCheckFilled size={20} className={isDark ? "text-[#D9B56A]" : "text-[#1A1510]"} />
                                    ) : (
                                      <span
                                        className={`block h-4.5 w-4.5 rounded-full border ${
                                          isDark ? "border-white/30" : "border-[#CFC6B8]"
                                        }`}
                                      />
                                    )}
                                  </span>
                                </div>

                                <div className="mt-4 pt-1">
                                  <div className="flex items-baseline gap-1">
                                    <span className={`text-xs ${isDark ? "text-zinc-400" : "text-[#6B5F50]"}`}>Rp</span>
                                    <span className="font-serif text-2xl font-semibold tracking-tight lining-nums">
                                      {displayPrice.toLocaleString("id-ID")}
                                    </span>
                                    <span className={`text-xs ${isDark ? "text-zinc-400" : "text-[#6B5F50]"}`}>/ {durationLabel(spec.activeDays)}</span>
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                    {showStrikethrough && (
                                      <span className={`text-[11px] line-through ${isDark ? "text-zinc-500" : "text-[#9A9183]"}`}>
                                        {rupiah(spec.price)}
                                      </span>
                                    )}
                                    {isCurrent ? (
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDark ? "bg-[#D9B56A]/25 text-[#F5E8CA]" : "border border-[#E6D5B2] bg-[#F7F0E1] text-[#5C431A]"}`}>
                                        Paket aktif
                                      </span>
                                    ) : isDowngrade ? (
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isDark ? "bg-white/10 text-zinc-300" : "bg-[#F1ECE2] text-[#6B5F50]"}`}>
                                        Sudah tercakup
                                      </span>
                                    ) : showStrikethrough ? (
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isDark ? "bg-[#D9B56A]/20 text-[#E6CB8A]" : "bg-[#F5E8CA] text-[#6E4F1C]"}`}>
                                        Bayar selisih
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Compact Benefits + Collapsible Template Showcase */}
                      <div className="rounded-2xl border border-[#EDE3CF] bg-white p-5 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6424]">
                            Termasuk di paket {selectedPlanSpec.name}
                          </p>
                          <span className="rounded-full border border-[#EDE3CF] bg-[#FCF8F1] px-2.5 py-0.5 text-[11px] font-medium text-[#5E5446]">
                            {planBenefits.length} fitur
                          </span>
                        </div>

                        <ul className="mt-3.5 grid gap-x-5 gap-y-2 text-[13px] text-[#40372B] sm:grid-cols-2">
                          {planBenefits.map((benefit) => (
                            <li key={benefit} className="flex items-start gap-2">
                              <IconCheck size={15} className="mt-0.5 shrink-0 text-[#8A6424]" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>

                        {includedTemplates.preview.length > 0 && (
                          <div className="mt-4 border-t border-[#F3EBDB] pt-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => setShowTemplates((v) => !v)}
                                aria-expanded={showTemplates}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A1510] transition hover:text-[#8A6424]"
                              >
                                <IconChevronDown
                                  size={15}
                                  className={`text-[#8A6424] transition-transform ${showTemplates ? "rotate-180" : ""}`}
                                />
                                {showTemplates
                                  ? `Sembunyikan pilihan desain (${includedTemplates.total})`
                                  : `Lihat pilihan desain di paket ${selectedPlanSpec.name} (${includedTemplates.total} desain)`}
                              </button>
                              <Link
                                href="/pilih-template"
                                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#8A6424] hover:underline"
                              >
                                Buka katalog <IconArrowUpRight size={13} />
                              </Link>
                            </div>

                            {showTemplates && (
                              <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
                                {includedTemplates.preview.map((item) => (
                                  <Link
                                    key={item.id}
                                    href={`/preview/t/${item.slug}`}
                                    target="_blank"
                                    className="group flex flex-col gap-2"
                                  >
                                    <div className="relative overflow-hidden rounded-xl border border-[#E6D7BC] bg-white transition group-hover:-translate-y-0.5 group-hover:border-[#C9A24E]">
                                      {item.kind === "ENGINE" && item.theme ? (
                                        <CoverThumb theme={item.theme} className="aspect-[9/15.5] w-full" />
                                      ) : (
                                        <div className="relative aspect-[9/15.5] w-full bg-[#F6EEDF]">
                                          <SafeImg src={item.thumbnail} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
                                        </div>
                                      )}
                                    </div>
                                    <p className="truncate text-xs font-medium text-[#1A1510]">{item.name}</p>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {activeTab === "AGENCY_QUOTA" && isMitra && (
                    <div id="kuota-mitra" className="space-y-4 rounded-2xl border border-[#EDE3CF] bg-white p-5 shadow-xs sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6424]">
                            Paket Kuota Mitra B2B
                          </p>
                          <h2 className="font-serif text-2xl font-medium text-[#1A1510]">
                            Kuota Undangan Grosir
                          </h2>
                          <p className="text-xs text-[#6B5F50]">
                            1 kuota = 1 undangan setara Premium. Berlaku 12 bulan, termasuk link isi data klien &amp; branding usaha.
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D5B2] bg-[#F7F0E1] px-3 py-1 text-xs font-medium tabular-nums text-[#5C431A]">
                          <IconBuildingStore size={14} className="text-[#8A6424]" /> Sisa kuota: {agencyQuota}
                        </span>
                      </div>

                      <div className="grid gap-3 pt-1 sm:grid-cols-3">
                        {AGENCY_PACKS.map((pack) => {
                          const isPackSelected = checkoutKind === "AGENCY_QUOTA" && selectedAgencyPackId === pack.id;
                          return (
                            <button
                              key={pack.id}
                              type="button"
                              onClick={() => {
                                setSelectedAgencyPackId(pack.id);
                                setCheckoutKind("AGENCY_QUOTA");
                              }}
                              className={`relative flex flex-col justify-between rounded-xl border p-4 text-left transition ${
                                isPackSelected
                                  ? "border-[#8A6424] bg-[#FCF5E6] ring-2 ring-[#D9B56A]/40"
                                  : "border-[#EDE3CF] bg-[#FFFDF9] hover:border-[#C5BBA8]"
                              }`}
                            >
                              {pack.popular && (
                                <span className="absolute -top-2.5 left-3 rounded-full bg-[#8A6424] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                                  Populer
                                </span>
                              )}
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-serif text-lg font-medium leading-tight text-[#1A1510]">{pack.label}</p>
                                  <p className="mt-1 text-[11px] leading-snug text-[#6B5F50]">{pack.tagline}</p>
                                </div>
                                <span className="mt-0.5 shrink-0">
                                  {isPackSelected ? (
                                    <IconCircleCheckFilled size={18} className="text-[#1A1510]" />
                                  ) : (
                                    <span className="block h-4 w-4 rounded-full border border-[#CFC6B8]" />
                                  )}
                                </span>
                              </div>
                              <div className="mt-4">
                                <p className="font-serif text-xl font-semibold tabular-nums lining-nums text-[#1A1510]">
                                  {rupiah(pack.price)}
                                </p>
                                <p className="text-[11px] tabular-nums text-[#8A6424]">
                                  {pack.quota} kuota{pack.bonusAiCredits > 0 ? ` + ${pack.bonusAiCredits} AI` : ""}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === "AI_CREDIT" && (
                    <div id="kredit-ai" className="space-y-4 rounded-2xl border border-[#EDE3CF] bg-white p-5 shadow-xs sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6424]">
                            Top-up Kredit AI
                          </p>
                          <h2 className="font-serif text-2xl font-medium text-[#1A1510]">
                            Tambah Kredit Desain AI
                          </h2>
                          <p className="text-xs text-[#6B5F50]">
                            {AI_CREDIT_COST_STANDARD} kredit per desain · {AI_CREDIT_COST_REFERENCE} kredit dengan screenshot referensi. Berlaku per akun dan tidak hangus.
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D5B2] bg-[#F7F0E1] px-3 py-1 text-xs font-medium tabular-nums text-[#5C431A]">
                          <IconPalette size={14} className="text-[#8A6424]" /> Sisa: {aiQuota.remaining} kredit
                        </span>
                      </div>

                      <div className="grid gap-3 pt-1 sm:grid-cols-3">
                        {AI_CREDIT_PACKS.map((pack) => {
                          const isPackSelected = checkoutKind === "AI_CREDIT" && selectedPackId === pack.id;
                          const perCredit = Math.round(pack.price / pack.credits);
                          return (
                            <button
                              key={pack.id}
                              type="button"
                              onClick={() => {
                                setSelectedPackId(pack.id);
                                setCheckoutKind("AI_CREDIT");
                              }}
                              className={`relative flex flex-col justify-between rounded-xl border p-4 text-left transition ${
                                isPackSelected
                                  ? "border-[#8A6424] bg-[#FCF5E6] ring-2 ring-[#D9B56A]/40"
                                  : "border-[#EDE3CF] bg-[#FFFDF9] hover:border-[#C5BBA8]"
                              }`}
                            >
                              {pack.popular && (
                                <span className="absolute -top-2.5 left-3 rounded-full bg-[#8A6424] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                                  Favorit
                                </span>
                              )}
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="whitespace-nowrap font-serif text-lg font-medium leading-tight text-[#1A1510]">{pack.label}</p>
                                  <p className="mt-1 text-[11px] leading-snug text-[#6B5F50]">{pack.tagline}</p>
                                </div>
                                <span className="mt-0.5 shrink-0">
                                  {isPackSelected ? (
                                    <IconCircleCheckFilled size={18} className="text-[#1A1510]" />
                                  ) : (
                                    <span className="block h-4 w-4 rounded-full border border-[#CFC6B8]" />
                                  )}
                                </span>
                              </div>
                              <div className="mt-4">
                                <p className="font-serif text-xl font-semibold tabular-nums lining-nums text-[#1A1510]">
                                  {rupiah(pack.price)}
                                </p>
                                <p className="text-[11px] tabular-nums text-[#8A6424]">
                                  {rupiah(perCredit)} / kredit
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === "EXTRAS" && hasExtras && (
                    <div className="space-y-3.5">
                      {currentPlan !== "EKSKLUSIF" && (
                        <div
                          className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 transition sm:flex-row sm:items-center ${
                            checkoutKind === "ADDON"
                              ? "border-[#8A6424] bg-white ring-2 ring-[#D9B56A]/35"
                              : "border-[#EDE3CF] bg-white hover:border-[#C5BBA8]"
                          }`}
                        >
                          <div className="space-y-1">
                            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A6424]">
                              <IconUsers size={13} /> Add-on Kuota Tamu
                            </p>
                            <h3 className="font-serif text-xl font-medium text-[#1A1510]">
                              Tambah +{GUEST_ADDON_SIZE} Tamu Bernama
                            </h3>
                            <p className="text-xs text-[#6B5F50]">
                              {rupiah(GUEST_ADDON_PRICE)} per +{GUEST_ADDON_SIZE} tamu · Kuota saat ini: {countLabel(totalGuestsAllowed)} tamu.
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2.5">
                            <div className="flex h-10 items-center rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setAddonUnits((u) => Math.max(1, u - 1));
                                  setCheckoutKind("ADDON");
                                }}
                                disabled={addonUnits <= 1}
                                aria-label="Kurangi unit add-on"
                                className="flex h-8 w-8 items-center justify-center rounded-full text-[#1A1510] hover:bg-white disabled:opacity-40"
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
                                  setCheckoutKind("ADDON");
                                }}
                                aria-label="Tambah unit add-on"
                                className="flex h-8 w-8 items-center justify-center rounded-full text-[#1A1510] hover:bg-white"
                              >
                                <IconPlus size={14} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => setCheckoutKind("ADDON")}
                              className={`h-10 rounded-full px-4 text-xs font-medium transition ${
                                checkoutKind === "ADDON"
                                  ? "bg-[#1A1510] text-[#FCF8F1]"
                                  : "border border-[#1A1510] text-[#1A1510] hover:bg-[#FCF8F1]"
                              }`}
                            >
                              {checkoutKind === "ADDON" ? "Dipilih" : `Pilih (${rupiah(addonPayAmount)})`}
                            </button>
                          </div>
                        </div>
                      )}

                      <div
                        className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 transition sm:flex-row sm:items-center ${
                          checkoutKind === "RENEWAL"
                            ? "border-[#8A6424] bg-white ring-2 ring-[#D9B56A]/35"
                            : "border-[#EDE3CF] bg-white hover:border-[#C5BBA8]"
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A6424]">
                            <IconCalendarPlus size={13} /> Perpanjangan
                          </p>
                          <h3 className="font-serif text-xl font-medium text-[#1A1510]">Perpanjang masa aktif 1 tahun</h3>
                          <p className="text-xs text-[#6B5F50]">
                            {rupiah(RENEWAL_PRICE)} per tahun ·{" "}
                            {planExpiresAt
                              ? `Aktif sampai ${new Date(planExpiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" })}.`
                              : "Undangan ini tidak punya batas masa aktif."}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={!planExpiresAt}
                          onClick={() => setCheckoutKind("RENEWAL")}
                          className={`h-10 shrink-0 rounded-full px-4 text-xs font-medium transition disabled:opacity-45 ${
                            checkoutKind === "RENEWAL"
                              ? "bg-[#1A1510] text-[#FCF8F1]"
                              : "border border-[#1A1510] text-[#1A1510] hover:bg-[#FCF8F1]"
                          }`}
                        >
                          {checkoutKind === "RENEWAL" ? "Dipilih" : `Pilih (${rupiah(RENEWAL_PRICE)})`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Compact, always-above-the-fold Sticky Checkout Summary */}
                <aside
                  id="ringkasan-bayar"
                  ref={summaryRef}
                  className="scroll-mt-20 rounded-2xl border border-[#EDE3CF] bg-white p-5 shadow-sm lg:sticky lg:top-20"
                >
                  <div className="space-y-4">
                    {/* Selected Item + Price */}
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6424]">Ringkasan</p>
                      <div className="mt-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1A1510]">{selectedSummaryTitle}</p>
                          <p className="truncate text-xs text-[#6B5F50]">
                            {checkoutKind === "AI_CREDIT" || checkoutKind === "AGENCY_QUOTA"
                              ? "Berlaku untuk seluruh undangan di akun"
                              : invitationTitle || "Undangan Anda"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          {checkoutKind === "PLAN" && isUpgradeDiscount && (
                            <p className="text-[11px] text-[#9A9183] line-through">{rupiah(selectedPlanSpec.price)}</p>
                          )}
                          {codeDiscount > 0 && (
                            <p className="text-[11px] text-[#9A9183] line-through">{rupiah(rawSummaryAmount)}</p>
                          )}
                          <p className="text-sm font-semibold tabular-nums text-[#1A1510]">{rupiah(summaryAmount)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Compact Cara Bayar 2-column segmented picker */}
                    <div className="space-y-2 border-t border-[#F3EBDB] pt-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B5F50]">Cara Bayar</p>
                      <div className={`grid gap-2 ${manualEnabled ? "grid-cols-2" : "grid-cols-1"}`}>
                        <button
                          type="button"
                          disabled={!midtrans.enabled}
                          onClick={() => setPaymentMethod("MIDTRANS")}
                          className={`rounded-xl border p-2.5 text-left transition ${
                            paymentMethod === "MIDTRANS"
                              ? "border-[#8A6424] bg-[#FCF9F2] ring-1 ring-[#8A6424]/40"
                              : "border-[#EDE3CF] bg-white hover:border-[#CFC6B8]"
                          } ${!midtrans.enabled ? "cursor-not-allowed opacity-55" : ""}`}
                        >
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1A1510]">
                            <IconQrcode size={14} className="shrink-0 text-[#8A6424]" /> Otomatis
                          </span>
                          <span className="mt-0.5 block text-[11px] text-[#6B5F50]">
                            {midtrans.enabled ? "VA, QRIS, E-Wallet" : "Belum aktif"}
                          </span>
                        </button>

                        {manualEnabled && (
                          <button
                            type="button"
                            onClick={() => setPaymentMethod("MANUAL_TRANSFER")}
                            className={`rounded-xl border p-2.5 text-left transition ${
                              paymentMethod === "MANUAL_TRANSFER"
                                ? "border-[#8A6424] bg-[#FCF9F2] ring-1 ring-[#8A6424]/40"
                                : "border-[#EDE3CF] bg-white hover:border-[#CFC6B8]"
                            }`}
                          >
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1A1510]">
                              <IconBuildingBank size={14} className="shrink-0 text-[#8A6424]" /> Manual
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] text-[#6B5F50]">
                              {banks.length > 0 && qris ? "Transfer / QRIS" : qris ? "QRIS manual" : "Transfer bank"}
                            </span>
                          </button>
                        )}
                      </div>
                      {!manualEnabled && !midtrans.enabled && (
                        <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                          Metode pembayaran sedang tidak tersedia. Hubungi admin.
                        </p>
                      )}
                    </div>

                    {/* Compact Kode Promo */}
                    {codeFieldAllowed && (
                      <div className="space-y-1.5 border-t border-[#F3EBDB] pt-3.5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B5F50]">
                            <IconTag size={12} className="text-[#8A6424]" /> Kode promo
                          </span>
                          {appliedCode && (
                            <button
                              type="button"
                              onClick={() => {
                                setAppliedCode(null);
                                setCodeInput("");
                              }}
                              className="text-xs text-[#8A6424] hover:underline"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                        {appliedCode ? (
                          <div
                            className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
                              codeNotApplicable ? "border-[#EDE3CF] bg-[#FCF8F1] text-[#6B5F50]" : "border-[#E6D5B2] bg-[#F7F0E1] text-[#5C431A]"
                            }`}
                          >
                            <span className="min-w-0">
                              <strong className="font-mono tracking-wider">{appliedCode.code}</strong>
                              <span className="block truncate text-[11px]">{codeNotApplicable ? "Tidak berlaku untuk pilihan ini" : appliedCode.label}</span>
                            </span>
                            {!codeNotApplicable && <span className="shrink-0 font-semibold tabular-nums">-{rupiah(codeDiscount)}</span>}
                          </div>
                        ) : (
                          <form
                            className="flex gap-1.5"
                            onSubmit={(e) => {
                              e.preventDefault();
                              void applyCode();
                            }}
                          >
                            <input
                              type="text"
                              value={codeInput}
                              onChange={(e) => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 24))}
                              placeholder="Masukkan kode promo"
                              aria-label="Kode promo"
                              className="h-9 min-w-0 flex-1 rounded-xl border border-[#DDD5C7] bg-[#FCF8F1] px-3 font-mono text-xs uppercase tracking-wider text-[#1A1510] outline-none placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-[#A59B8C] focus:border-[#8A6424]"
                            />
                            <button
                              type="submit"
                              disabled={checkingCode || !codeInput.trim()}
                              className="h-9 shrink-0 rounded-xl border border-[#1A1510] px-3 text-xs font-medium text-[#1A1510] hover:bg-[#FCF8F1] disabled:opacity-40"
                            >
                              {checkingCode ? "..." : "Pakai"}
                            </button>
                          </form>
                        )}
                      </div>
                    )}

                    {/* Total & Primary CTA */}
                    <div className="space-y-3 border-t border-[#F3EBDB] pt-3.5">
                      <div className="space-y-1">
                        {codeDiscount > 0 && appliedCode && (
                          <div className="flex items-center justify-between text-xs text-[#5C431A]">
                            <span>Diskon ({appliedCode.code})</span>
                            <span className="font-medium tabular-nums">-{rupiah(codeDiscount)}</span>
                          </div>
                        )}
                        {paymentMethod === "MANUAL_TRANSFER" && !isFreeOrder && (
                          <div className="flex items-center justify-between text-[11px] text-[#6B5F50]">
                            <span>Kode unik verifikasi</span>
                            <span>+Rp100–Rp999 saat order</span>
                          </div>
                        )}
                        <div className="flex items-baseline justify-between pt-0.5">
                          <span className="text-sm font-medium text-[#40372B]">Total Bayar</span>
                          <span className="font-serif text-2xl font-semibold tabular-nums lining-nums text-[#1A1510]">
                            {rupiah(summaryAmount)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!canCheckout || busy}
                        onClick={handleCreatePayment}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1A1510] px-5 text-sm font-semibold text-[#FCF8F1] transition hover:bg-[#2B241B] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {busy ? (
                          <>
                            <IconLoader2 size={16} className="animate-spin" /> Memproses...
                          </>
                        ) : !canCheckout && checkoutKind === "PLAN" ? (
                          currentPlan === selectedPlan ? "Paket ini sudah aktif" : "Sudah termasuk di paketmu"
                        ) : isFreeOrder ? (
                          <>
                            Aktifkan gratis <IconArrowRight size={16} />
                          </>
                        ) : (
                          <>
                            Buat pembayaran <IconArrowRight size={16} />
                          </>
                        )}
                      </button>

                      <p className="text-center text-[11px] leading-relaxed text-[#6B5F50]">
                        {isFreeOrder
                          ? "Kode promo menanggung seluruh harga, langsung aktif tanpa bayar."
                          : paymentMethod === "MIDTRANS"
                            ? "Langsung aktif setelah pembayaran via Midtrans Snap."
                            : "Dapat nominal kode unik & nomor rekening untuk transfer manual."}
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            )}

            {/* Mobile Sticky Checkout Bar when summary is scrolled out of view */}
            {activeTab !== "HISTORY" && !summaryVisible && (
              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E6D5B2] bg-[#FFFDF9]/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(26,21,16,0.2)] backdrop-blur-md lg:hidden">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-[#6B5F50]">{selectedSummaryTitle}</p>
                    <p className="font-serif text-lg font-semibold tabular-nums leading-tight text-[#1A1510]">
                      {rupiah(summaryAmount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#1A1510] px-5 text-xs font-semibold text-[#FCF8F1]"
                  >
                    Lanjut Bayar <IconArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <AlertDialog open={confirmCancelMode !== null} onOpenChange={(open) => !open && setConfirmCancelMode(null)}>
        <AlertDialogContent className="border-[#EDE3CF] bg-[#FFFDF9] text-[#1A1510] sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-medium text-[#1A1510]">
              {confirmCancelMode === "snap" ? "Batalkan tagihan pembayaran?" : "Batalkan pengajuan pembayaran?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-[#5E5446]">
              {confirmCancelMode === "snap"
                ? "Tagihan Midtrans saat ini akan dibatalkan sehingga Anda dapat memilih ulang paket atau metode pembayaran lain."
                : "Pengajuan transfer manual saat ini akan dibatalkan dan Anda dapat memilih ulang paket atau metode pembayaran lain."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-full border-[#E9DDC6] bg-white text-[#40372B] hover:bg-[#FCF8F1]">
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmCancelMode === "snap") void executeCancelSnapOrder();
                else if (confirmCancelMode === "manual") void executeCancelOrder();
              }}
              className="rounded-full bg-[#1A1510] text-[#FCF8F1] hover:bg-[#2B241B]"
            >
              Ya, batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
