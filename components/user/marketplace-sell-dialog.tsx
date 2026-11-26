"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  IconAlertTriangle,
  IconCheck,
  IconLoader2,
  IconRefresh,
  IconShieldCheck,
  IconShieldX,
} from "@tabler/icons-react";
import { CoverThumb } from "@/components/templates/ai-design/cover-thumb";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/common/number-input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { normalizeTheme } from "@/lib/ai-design/color";
import type { PlagiarismReport } from "@/lib/ai-design/originality";
import type { AiTheme } from "@/lib/ai-design/schema";
import { CATALOG_CATEGORIES } from "@/lib/catalog-shared";
import { DEFAULT_MARKETPLACE_FEE_PCT, MARKETPLACE_MAX_PRICE, MARKETPLACE_MIN_PRICE } from "@/lib/limits";
import type { WeddingData } from "@/types/wedding";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export interface SubmittedMarketplaceTemplate {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  platformFeePct: number;
  reviewStatus: string;
  reviewNote: string | null;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export function MarketplaceSellDialog({
  open,
  onOpenChange,
  theme,
  initialName,
  initialDescription,
  previewData,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: AiTheme | null;
  initialName: string;
  initialDescription: string;
  previewData?: WeddingData;
  onSubmitted: (created: SubmittedMarketplaceTemplate) => void;
}) {
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<(typeof CATALOG_CATEGORIES)[number]>("Elegan");
  const [description, setDescription] = useState(initialDescription);
  // Digits as typed, so the field can be cleared and retyped; the range is checked on submit
  const [priceText, setPriceText] = useState("29000");
  const price = Number(priceText) || 0;
  const [checking, setChecking] = useState(false);
  const [report, setReport] = useState<PlagiarismReport | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setDescription(initialDescription);
    }
  }, [open, initialName, initialDescription]);

  const runCheck = useCallback(async () => {
    if (!theme) return;
    setChecking(true);
    setCheckError(null);
    try {
      const res = await fetch("/api/user/marketplace/check-originality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || theme.name, theme }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCheckError(d.message || "Gagal memeriksa orisinalitas template");
        setReport(null);
        return;
      }
      setReport(d.report as PlagiarismReport);
    } catch {
      setCheckError("Koneksi terputus saat memeriksa orisinalitas");
    } finally {
      setChecking(false);
    }
  }, [theme, name]);

  useEffect(() => {
    if (open && theme) {
      setReport(null);
      void runCheck();
    }
    // Run automatically whenever the dialog opens for a theme
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme) return;
    if (report?.verdict === "PLAGIAT") {
      toast.error("Template terindikasi plagiasi. Ubah desain terlebih dahulu agar orisinal.");
      return;
    }
    if (price < MARKETPLACE_MIN_PRICE || price > MARKETPLACE_MAX_PRICE) {
      toast.error(`Harga harus antara ${rupiah(MARKETPLACE_MIN_PRICE)} dan ${rupiah(MARKETPLACE_MAX_PRICE)}.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/user/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          description,
          price,
          theme,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (d.report) setReport(d.report as PlagiarismReport);
        toast.error(d.message || "Gagal mengajukan template");
        return;
      }
      onSubmitted(d.template as SubmittedMarketplaceTemplate);
      onOpenChange(false);
      toast.success("Template diajukan! Admin akan mereview orisinalitas & kualitas sebelum tayang di Marketplace.");
    } finally {
      setSubmitting(false);
    }
  };

  const feeEstimate = Math.round(price * (DEFAULT_MARKETPLACE_FEE_PCT / 100));
  const creatorEstimate = Math.max(0, price - feeEstimate);
  const isBlocked = report?.verdict === "PLAGIAT";
  const showSideBySide = Boolean(report && (report.verdict === "PLAGIAT" || report.verdict === "MIRIP") && report.topMatch && theme);

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#EDE3CF] bg-[#FFFDF9] text-[#1A1510] sm:max-w-2xl sm:rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium">Jual Template di Marketplace</DialogTitle>
            <DialogDescription className="text-sm text-[#5E5446]">
              Setiap template wajib orisinal. Sebelum diajukan, sistem AI memeriksa kemiripan desain Anda terhadap seluruh katalog SatuMoment, lalu admin melakukan kurasi manual.
            </DialogDescription>
          </DialogHeader>

          {/* Pre-sell AI Originality Check Banner */}
          <div
            className={`rounded-2xl border p-4 ${
              checking
                ? "border-[#E9DDC6] bg-[#FCF8F1]"
                : checkError
                  ? "border-red-200 bg-red-50/70"
                  : report?.verdict === "PLAGIAT"
                    ? "border-red-300 bg-red-50/80"
                    : report?.verdict === "MIRIP"
                      ? "border-amber-300 bg-amber-50/80"
                      : "border-emerald-200 bg-emerald-50/70"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                {checking ? (
                  <IconLoader2 size={18} className="mt-0.5 shrink-0 animate-spin text-[#8A6424]" />
                ) : report?.verdict === "PLAGIAT" ? (
                  <IconShieldX size={19} className="mt-0.5 shrink-0 text-red-600" />
                ) : report?.verdict === "MIRIP" ? (
                  <IconAlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-600" />
                ) : report?.verdict === "AMAN" ? (
                  <IconShieldCheck size={19} className="mt-0.5 shrink-0 text-emerald-700" />
                ) : (
                  <IconShieldCheck size={18} className="mt-0.5 shrink-0 text-[#8A6424]" />
                )}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#1A1510]">
                      {checking
                        ? "Memeriksa orisinalitas template..."
                        : checkError
                          ? "Pengecekan gagal"
                          : report?.verdict === "PLAGIAT"
                            ? `Terindikasi Plagiasi (${report.score}% mirip "${report.topMatch?.name}")`
                            : report?.verdict === "MIRIP"
                              ? `Kemiripan Cukup Tinggi (${report.score}% mirip "${report.topMatch?.name}")`
                              : report
                                ? `Lolos Cek Orisinalitas (${report.score}% kemiripan tertinggi)`
                                : "Cek Orisinalitas AI"}
                    </p>
                    {report && !checking && (
                      <span className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#5C431A]">
                        {report.source === "AI" ? "Analisis AI" : "Analisis Visual"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed text-[#4E4438]">
                    {checking
                      ? "Membandingkan paket ilustrasi, layout sampul, palet warna, ornamen, dan layer kustom Anda dengan seluruh template yang ada."
                      : checkError
                        ? checkError
                        : report?.summary}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={checking}
                onClick={() => void runCheck()}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-[#E6D5B2] bg-white px-3 text-xs font-medium text-[#40372B] hover:bg-[#FCF8F1] disabled:opacity-50"
              >
                <IconRefresh size={13} className={checking ? "animate-spin" : ""} /> Cek Ulang
              </button>
            </div>

            {/* Side-by-side comparison when MIRIP or PLAGIAT */}
            {showSideBySide && report?.topMatch && theme && (
              <div className="mt-3.5 space-y-3 border-t border-black/10 pt-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 rounded-xl border border-[#EDE3CF] bg-white p-2.5 text-center">
                    <span className="inline-block rounded-full bg-[#1A1510] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#FCF8F1]">
                      Desain Anda
                    </span>
                    <div className="mx-auto aspect-[9/16] w-full max-w-[140px] overflow-hidden rounded-xl border-2 border-[#1F1A14] bg-white shadow-sm">
                      <CoverThumb theme={normalizeTheme(theme)} data={previewData} className="h-full w-full" />
                    </div>
                    <p className="truncate text-xs font-medium text-[#1A1510]">{name || theme.name}</p>
                  </div>
                  <div className="space-y-1.5 rounded-xl border border-red-200 bg-white p-2.5 text-center">
                    <span className="inline-block rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                      Template Serupa ({report.score}%)
                    </span>
                    <div className="mx-auto aspect-[9/16] w-full max-w-[140px] overflow-hidden rounded-xl border-2 border-red-400 bg-white shadow-sm">
                      <CoverThumb theme={normalizeTheme(report.topMatch.theme)} data={previewData} className="h-full w-full" />
                    </div>
                    <p className="truncate text-xs font-semibold text-red-700">{report.topMatch.name}</p>
                  </div>
                </div>

                {report.reasons.length > 0 && (
                  <ul className="space-y-1 rounded-xl bg-white/80 p-3 text-xs text-[#40372B]">
                    {report.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {report.recommendation && (
                  <p className="text-xs font-medium text-[#3B2E1E]">
                    Saran perbaikan: <span className="font-normal text-[#5E5446]">{report.recommendation}</span>
                  </p>
                )}
              </div>
            )}

            {report?.verdict === "AMAN" && !checking && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-800">
                <IconCheck size={14} /> Siap diajukan — admin akan tetap meninjau kualitas &amp; orisinalitas secara manual sebelum tayang.
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mkt-sell-name">Nama Template</Label>
            <Input
              id="mkt-sell-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
              maxLength={60}
              disabled={isBlocked}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mkt-sell-cat">Kategori</Label>
              <SelectField
                id="mkt-sell-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as (typeof CATALOG_CATEGORIES)[number])}
                className="w-full"
                disabled={isBlocked}
              >
                {CATALOG_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mkt-sell-price">Harga Jual</Label>
              <NumberInput
                id="mkt-sell-price"
                format="thousands"
                prefix="Rp"
                max={MARKETPLACE_MAX_PRICE}
                value={priceText}
                onValueChange={setPriceText}
                required
                disabled={isBlocked}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mkt-sell-desc">Deskripsi Singkat</Label>
            <Textarea
              id="mkt-sell-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan konsep desain orisinal Anda, nuansa warna, dan kecocokan acara..."
              required
              minLength={10}
              disabled={isBlocked}
            />
          </div>

          <div className="space-y-1.5 rounded-xl border border-[#E6D5B2] bg-[#F7F0E1] p-3.5 text-xs text-[#5C431A]">
            <div className="flex justify-between">
              <span>Harga jual ke pembeli</span>
              <span className="font-semibold">{rupiah(price)}</span>
            </div>
            <div className="flex justify-between">
              <span>Komisi platform SatuMoment ({DEFAULT_MARKETPLACE_FEE_PCT}%)</span>
              <span>−{rupiah(feeEstimate)}</span>
            </div>
            <div className="flex justify-between border-t border-[#E6D5B2] pt-1.5 text-sm font-semibold text-[#1A1510]">
              <span>Pendapatan bersih Anda ({100 - DEFAULT_MARKETPLACE_FEE_PCT}%)</span>
              <span>{rupiah(creatorEstimate)} / penjualan</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="rounded-full">
              {isBlocked ? "Kembali & Ubah Desain" : "Batal"}
            </Button>
            <Button
              type="submit"
              disabled={submitting || checking || isBlocked || Boolean(checkError)}
              className="rounded-full bg-[#1A1510] text-[#FCF8F1] hover:bg-[#2B241B] disabled:opacity-50"
            >
              {submitting && <IconLoader2 size={15} className="mr-2 animate-spin" />}
              {isBlocked ? "Tidak Dapat Diajukan (Plagiasi)" : "Ajukan untuk Review Admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
