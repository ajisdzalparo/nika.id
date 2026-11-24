"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconBrush,
  IconCheck,
  IconCopy,
  IconEdit,
  IconFilePlus,
  IconLoader2,
  IconPalette,
  IconPlus,
  IconShoppingBag,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";
import { CoverThumb } from "@/components/templates/ai-design/cover-thumb";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AI_THEME_PRESETS } from "@/lib/ai-design/presets";
import type { AiTheme } from "@/lib/ai-design/schema";
import { CATALOG_CATEGORIES } from "@/lib/catalog-shared";
import { DEFAULT_MARKETPLACE_FEE_PCT, MARKETPLACE_MAX_PRICE, MARKETPLACE_MIN_PRICE } from "@/lib/limits";
import type { WeddingData } from "@/types/wedding";

export interface HubDesignItem {
  id: string;
  source: string;
  prompt: string;
  createdAt: string;
  theme: AiTheme;
}

export interface HubTemplateItem {
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

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export function KanvasProjectsHub({
  previewData,
  invitationTitle,
  activeDesignId,
  initialDesigns,
  initialMyTemplates,
  aiEnabled = true,
}: {
  previewData: WeddingData;
  invitationTitle: string;
  activeDesignId: string | null;
  initialDesigns: HubDesignItem[];
  initialMyTemplates: HubTemplateItem[];
  aiEnabled?: boolean;
}) {
  const router = useRouter();
  const [designs, setDesigns] = useState<HubDesignItem[]>(initialDesigns);
  const [myTemplates, setMyTemplates] = useState<HubTemplateItem[]>(initialMyTemplates);
  const [activeId, setActiveId] = useState<string | null>(activeDesignId);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<HubDesignItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [sellDesign, setSellDesign] = useState<HubDesignItem | null>(null);
  const [sellName, setSellName] = useState("");
  const [sellCategory, setSellCategory] = useState<(typeof CATALOG_CATEGORIES)[number]>("Elegan");
  const [sellDesc, setSellDesc] = useState("");
  const [sellPrice, setSellPrice] = useState(29000);
  const [submittingSell, setSubmittingSell] = useState(false);

  const duplicateDesign = async (item: HubDesignItem) => {
    setBusyId(item.id);
    try {
      const copyName = `${item.theme.name} (Salinan)`;
      const res = await fetch("/api/user/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designId: null,
          name: copyName,
          theme: { ...item.theme, name: copyName },
          apply: false,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.message || "Gagal menduplikat desain");
        return;
      }
      setDesigns((prev) => [d.design, ...prev]);
      toast.success(`"${copyName}" ditambahkan ke daftar proyek.`);
    } finally {
      setBusyId(null);
    }
  };

  const applyDesign = async (item: HubDesignItem) => {
    setBusyId(item.id);
    try {
      const res = await fetch("/api/user/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designId: item.source === "CANVAS" ? item.id : null,
          name: item.theme.name,
          theme: item.theme,
          apply: true,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.message || "Gagal memakai desain");
        return;
      }
      setActiveId(d.design.id);
      setDesigns((prev) => {
        const exists = prev.some((x) => x.id === d.design.id);
        return exists ? prev.map((x) => (x.id === d.design.id ? d.design : x)) : [d.design, ...prev];
      });
      toast.success(`"${item.theme.name}" dipasang ke ${invitationTitle}!`);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async (item: HubDesignItem) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/user/canvas?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.message || "Gagal menghapus proyek");
        return;
      }
      setDesigns((prev) => prev.filter((x) => x.id !== item.id));
      if (activeId === item.id) setActiveId(null);
      setDeleteTarget(null);
      toast.success(`Desain "${item.theme.name}" dihapus.`);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  const submitMarketplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellDesign) return;
    setSubmittingSell(true);
    try {
      const res = await fetch("/api/user/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sellName,
          category: sellCategory,
          description: sellDesc,
          price: sellPrice,
          theme: sellDesign.theme,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.message || "Gagal mengajukan template");
        return;
      }
      setMyTemplates((prev) => [d.template, ...prev]);
      setSellDesign(null);
      toast.success("Template diajukan! Admin akan mereview sebelum tayang di Marketplace.");
      router.refresh();
    } finally {
      setSubmittingSell(false);
    }
  };

  const feeEstimate = Math.round(sellPrice * (DEFAULT_MARKETPLACE_FEE_PCT / 100));
  const creatorEstimate = Math.max(0, sellPrice - feeEstimate);

  return (
    <div className="flex-1 bg-[#FAF8F4] px-4 pb-20 pt-8 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A6A2F]">
              <IconBrush size={14} /> Studio Kanvas Kreatif
            </p>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-[#15130F] sm:text-5xl">
              Proyek &amp; Desain Kanvas
            </h1>
            <p className="max-w-2xl text-sm text-[#5E574D]">
              Mulai dari kanvas kosong seperti Canva, ubah desain yang sudah tersimpan, atau ajukan karya terbaik Anda untuk dijual di Marketplace UNDANGIN YUK.
            </p>
          </div>
          <Button asChild className="h-11 shrink-0 rounded-full bg-[#15130F] px-5 text-sm font-medium text-[#FAF8F4] hover:bg-[#2A261F]">
            <Link href="/kanvas/editor?blank=1">
              <IconPlus size={16} className="mr-1.5" /> Buat Kanvas Kosong
            </Link>
          </Button>
        </header>

        {/* Section 1: Create Project */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-2xl font-medium text-[#15130F]">Mulai Proyek Baru</h2>
            {aiEnabled && (
              <Link href="/desain-ai" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8A6A2F] hover:underline">
                <IconSparkles size={14} /> Atau generate pakai AI →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {/* Blank Canvas Primary Card */}
            <Link
              href="/kanvas/editor?blank=1"
              className="group flex flex-col justify-between rounded-2xl border-2 border-dashed border-[#C9A45C] bg-[#FFFDF9] p-4 transition hover:-translate-y-0.5 hover:border-[#8A6A2F] hover:bg-[#FBF6EB] hover:shadow-sm"
            >
              <div className="flex aspect-[9/12] flex-col items-center justify-center rounded-xl border border-[#EFEAE0] bg-white p-3 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4EAD6] text-[#8A6A2F] transition-transform group-hover:scale-105">
                  <IconFilePlus size={22} />
                </span>
                <p className="mt-3 font-serif text-lg font-medium text-[#15130F]">Kanvas Kosong</p>
                <p className="mt-1 text-[11px] leading-snug text-[#6B6358]">Mulai 0% dari layar putih polos</p>
              </div>
              <span className="mt-3 inline-flex items-center justify-center rounded-full bg-[#8A6A2F] py-1.5 text-xs font-medium text-white">
                + Buat Baru
              </span>
            </Link>

            {/* Starter Presets */}
            {Object.entries(AI_THEME_PRESETS).map(([key, preset]) => (
              <Link
                key={key}
                href={`/kanvas/editor?preset=${encodeURIComponent(key)}`}
                className="group flex flex-col justify-between rounded-2xl border border-[#E6DFD3] bg-white p-3 transition hover:-translate-y-0.5 hover:border-[#C9A45C] hover:shadow-sm"
              >
                <div className="relative aspect-[9/12] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                  <CoverThumb theme={preset.theme} data={previewData} zoom={0.42} className="h-full w-full" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent px-2.5 pb-2 pt-6 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Kreasikan dari preset →
                  </span>
                </div>
                <div className="mt-2.5 px-0.5">
                  <p className="truncate font-serif text-base font-medium text-[#15130F]">{preset.theme.name}</p>
                  <p className="truncate text-[11px] text-[#6B6358]">Preset · {preset.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 2: Saved User Designs */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-2xl font-medium text-[#15130F]">
                Desain Saya ({designs.length})
              </h2>
              <p className="text-xs text-[#6B6358]">
                Pilih desain untuk diedit lagi di studio, duplikat menjadi varian baru, pasang ke undangan, atau jual.
              </p>
            </div>
          </div>

          {designs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DFD2BC] bg-white px-6 py-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4EAD6] text-[#8A6A2F]">
                <IconPalette size={22} />
              </span>
              <h3 className="mt-3 font-serif text-2xl font-medium text-[#15130F]">Belum ada proyek tersimpan</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-[#6B6358]">
                Mulai buat desain pertamamu dari Kanvas Kosong atau salah satu preset di atas, lalu klik Simpan Draf.
              </p>
              <Button asChild className="mt-5 h-10 rounded-full bg-[#15130F] px-5 text-xs font-medium text-[#FAF8F4]">
                <Link href="/kanvas/editor?blank=1">Mulai dari Kanvas Kosong</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {designs.map((d) => {
                const isActive = activeId === d.id;
                const layerCount = d.theme.layers?.length ?? 0;
                const isBusy = busyId === d.id;
                return (
                  <article
                    key={d.id}
                    className={`flex flex-col justify-between rounded-2xl border bg-white p-3.5 transition ${
                      isActive ? "border-[#8A6A2F] ring-2 ring-[#C9A45C]/30" : "border-[#E6DFD3] hover:border-[#C9A45C]"
                    }`}
                  >
                    <div>
                      <Link
                        href={`/kanvas/editor?designId=${encodeURIComponent(d.id)}`}
                        className="group relative block aspect-[9/14] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
                      >
                        <CoverThumb theme={d.theme} data={previewData} zoom={0.48} className="h-full w-full" />
                        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                          <span className="rounded-full bg-[#15130F]/80 px-2 py-0.5 text-[10px] font-medium text-[#FAF8F4] backdrop-blur-xs">
                            {d.source === "CANVAS" ? "Kanvas" : d.source === "AI" ? "AI" : "Katalog"}
                          </span>
                          {layerCount > 0 && (
                            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-[#15130F]">
                              {layerCount} layer
                            </span>
                          )}
                        </div>
                        {isActive && (
                          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#8A6A2F] px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                            <IconCheck size={11} /> Dipakai
                          </span>
                        )}
                      </Link>

                      <div className="mt-3 space-y-0.5 px-0.5">
                        <h3 className="truncate font-serif text-xl font-medium text-[#15130F]">{d.theme.name}</h3>
                        <p className="text-[11px] text-[#6B6358]">
                          Diubah{" "}
                          {new Date(d.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            timeZone: "Asia/Jakarta",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 border-t border-[#EFEAE0] pt-3">
                      <div className="flex gap-1.5">
                        <Link
                          href={`/kanvas/editor?designId=${encodeURIComponent(d.id)}`}
                          className="flex h-9 flex-1 items-center justify-center gap-1 rounded-full bg-[#15130F] px-3 text-xs font-medium text-[#FAF8F4] hover:bg-[#2A261F]"
                        >
                          <IconEdit size={13} /> Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setSellDesign(d);
                            setSellName(d.theme.name);
                            setSellDesc(d.theme.mood);
                          }}
                          className="flex h-9 items-center justify-center gap-1 rounded-full bg-[#8A6A2F] px-3 text-xs font-medium text-white hover:bg-[#755925]"
                        >
                          <IconShoppingBag size={13} /> Jual
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void duplicateDesign(d)}
                          className="flex h-8 flex-1 items-center justify-center gap-1 rounded-full border border-[#DFD7C8] bg-[#FAF8F4] px-2.5 text-[11px] font-medium text-[#3F3A33] hover:bg-[#EFEAE0] disabled:opacity-50"
                        >
                          <IconCopy size={12} /> Duplikat
                        </button>
                        {!isActive && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void applyDesign(d)}
                            className="flex h-8 flex-1 items-center justify-center gap-1 rounded-full border border-[#DFD7C8] bg-white px-2.5 text-[11px] font-medium text-[#3F3A33] hover:bg-[#FAF8F4] disabled:opacity-50"
                          >
                            Pakai
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(d)}
                          aria-label={`Hapus ${d.theme.name}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6B6358] hover:bg-red-50 hover:text-red-600"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 3: Submitted Marketplace Templates */}
        {myTemplates.length > 0 && (
          <section className="space-y-3 rounded-2xl border border-[#E6DFD3] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-2xl font-medium text-[#15130F]">Template Saya di Marketplace</h2>
                <p className="text-xs text-[#6B6358]">Pantau status kurasi dan jumlah penjualan template Anda.</p>
              </div>
              <Link href="/dompet" className="text-xs font-medium text-[#8A6A2F] hover:underline">
                Lihat penghasilan di Dompet →
              </Link>
            </div>
            <div className="divide-y divide-[#EFEAE0]">
              {myTemplates.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium text-[#15130F]">
                      {t.name} <span className="text-xs font-normal text-[#6B6358]">· {t.category}</span>
                    </p>
                    <p className="text-xs text-[#6B6358]">
                      Harga {rupiah(t.price)} · Komisi platform {t.platformFeePct}% · Dipakai {t.usageCount}×
                    </p>
                    {t.reviewNote && t.reviewStatus === "REJECTED" && <p className="text-xs text-red-600">Catatan: {t.reviewNote}</p>}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      t.reviewStatus === "APPROVED" && t.isActive
                        ? "border border-[#DFD2BC] bg-[#F5EFE3] text-[#5C4620]"
                        : t.reviewStatus === "REJECTED"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {t.reviewStatus === "APPROVED" && t.isActive ? "Tayang" : t.reviewStatus === "REJECTED" ? "Perlu Revisi" : "Menunggu Review"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent className="border-[#E6DFD3] bg-[#FFFDF9] text-[#15130F] sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-medium text-[#15130F]">
              Hapus desain &ldquo;{deleteTarget?.theme.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#5E574D]">
              Draf desain ini akan dihapus dari daftar proyek Anda. Template yang sudah terbit di Marketplace tetap aman.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={deleting} className="rounded-full border-[#DFD7C8] bg-white text-[#3F3A33] hover:bg-[#FAF8F4]">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) void confirmDelete(deleteTarget);
              }}
              className="rounded-full bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Menghapus..." : "Ya, hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sell on Marketplace dialog */}
      <Dialog open={sellDesign !== null} onOpenChange={(open) => !open && !submittingSell && setSellDesign(null)}>
        <DialogContent className="border-[#E6DFD3] bg-[#FFFDF9] text-[#15130F] sm:rounded-2xl">
          <form onSubmit={submitMarketplace} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl font-medium">Jual Template di Marketplace</DialogTitle>
              <DialogDescription>
                Ajukan desain &ldquo;{sellDesign?.theme.name}&rdquo; untuk dijual ke pengguna UNDANGIN YUK.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="hub-sell-name">Nama Template</Label>
              <Input id="hub-sell-name" value={sellName} onChange={(e) => setSellName(e.target.value)} required minLength={3} maxLength={60} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="hub-sell-cat">Kategori</Label>
                <select
                  id="hub-sell-cat"
                  value={sellCategory}
                  onChange={(e) => setSellCategory(e.target.value as (typeof CATALOG_CATEGORIES)[number])}
                  className="h-10 w-full rounded-xl border border-[#DFD7C8] bg-white px-3 text-sm"
                >
                  {CATALOG_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hub-sell-price">Harga Jual (Rp)</Label>
                <Input
                  id="hub-sell-price"
                  type="number"
                  min={MARKETPLACE_MIN_PRICE}
                  max={MARKETPLACE_MAX_PRICE}
                  step={1000}
                  value={sellPrice}
                  onChange={(e) => setSellPrice(Number(e.target.value) || MARKETPLACE_MIN_PRICE)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hub-sell-desc">Deskripsi Singkat</Label>
              <Textarea id="hub-sell-desc" value={sellDesc} onChange={(e) => setSellDesc(e.target.value)} required />
            </div>
            <div className="space-y-1.5 rounded-xl border border-[#DFD2BC] bg-[#F5EFE3] p-3.5 text-xs text-[#5C4620]">
              <div className="flex justify-between">
                <span>Harga jual ke pembeli</span>
                <span className="font-semibold">{rupiah(sellPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Komisi platform UNDANGIN YUK ({DEFAULT_MARKETPLACE_FEE_PCT}%)</span>
                <span>−{rupiah(feeEstimate)}</span>
              </div>
              <div className="flex justify-between border-t border-[#DFD2BC] pt-1.5 text-sm font-semibold text-[#15130F]">
                <span>Pendapatan bersih Anda ({100 - DEFAULT_MARKETPLACE_FEE_PCT}%)</span>
                <span>{rupiah(creatorEstimate)} / penjualan</span>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSellDesign(null)} disabled={submittingSell}>
                Batal
              </Button>
              <Button type="submit" disabled={submittingSell} className="rounded-full bg-[#15130F] text-[#FAF8F4]">
                {submittingSell && <IconLoader2 size={15} className="mr-2 animate-spin" />}
                Ajukan untuk Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
