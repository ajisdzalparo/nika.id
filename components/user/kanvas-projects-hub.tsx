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
  IconPalette,
  IconPlus,
  IconShoppingBag,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";
import { CoverThumb } from "@/components/templates/ai-design/cover-thumb";
import { MarketplaceSellDialog } from "@/components/user/marketplace-sell-dialog";
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
import { AI_THEME_PRESETS } from "@/lib/ai-design/presets";
import type { AiTheme } from "@/lib/ai-design/schema";
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

  return (
    <div className="flex-1 bg-[#FCF8F1] px-4 pb-20 pt-8 lg:px-8">
      <div className="w-full space-y-10">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A6424]">
              <IconBrush size={14} /> Studio Kanvas Kreatif
            </p>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-[#1A1510] sm:text-5xl">
              Proyek &amp; Desain Kanvas
            </h1>
            <p className="max-w-2xl text-sm text-[#5E5446]">
              Mulai dari kanvas kosong seperti Canva, ubah desain yang sudah tersimpan, atau ajukan karya terbaik Anda untuk dijual di Marketplace SatuMoment.
            </p>
          </div>
          <Button asChild className="h-11 shrink-0 rounded-full bg-[#1A1510] px-5 text-sm font-medium text-[#FCF8F1] hover:bg-[#2B241B]">
            <Link href="/kanvas/editor?blank=1">
              <IconPlus size={16} className="mr-1.5" /> Buat Kanvas Kosong
            </Link>
          </Button>
        </header>

        {/* Section 1: Create Project */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-2xl font-medium text-[#1A1510]">Mulai Proyek Baru</h2>
            {aiEnabled && (
              <Link href="/desain-ai" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8A6424] hover:underline">
                <IconSparkles size={14} /> Atau generate pakai AI →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {/* Blank Canvas Primary Card */}
            <Link
              href="/kanvas/editor?blank=1"
              className="group flex flex-col justify-between rounded-2xl border-2 border-dashed border-[#D9B56A] bg-[#FFFDF9] p-4 transition hover:-translate-y-0.5 hover:border-[#8A6424] hover:bg-[#FCF5E6] hover:shadow-sm"
            >
              <div className="flex aspect-[9/12] flex-col items-center justify-center rounded-xl border border-[#F3EBDB] bg-white p-3 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5E8CA] text-[#8A6424] transition-transform group-hover:scale-105">
                  <IconFilePlus size={22} />
                </span>
                <p className="mt-3 font-serif text-lg font-medium text-[#1A1510]">Kanvas Kosong</p>
                <p className="mt-1 text-[11px] leading-snug text-[#6B5F50]">Mulai 0% dari layar putih polos</p>
              </div>
              <span className="mt-3 inline-flex items-center justify-center rounded-full bg-[#8A6424] py-1.5 text-xs font-medium text-white">
                + Buat Baru
              </span>
            </Link>

            {/* Starter Presets */}
            {Object.entries(AI_THEME_PRESETS).map(([key, preset]) => (
              <Link
                key={key}
                href={`/kanvas/editor?preset=${encodeURIComponent(key)}`}
                className="group flex flex-col justify-between rounded-2xl border border-[#EDE3CF] bg-white p-3 transition hover:-translate-y-0.5 hover:border-[#D9B56A] hover:shadow-sm"
              >
                <div className="relative aspect-[9/12] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                  <CoverThumb theme={preset.theme} data={previewData} zoom={0.42} className="h-full w-full" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent px-2.5 pb-2 pt-6 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Kreasikan dari preset →
                  </span>
                </div>
                <div className="mt-2.5 px-0.5">
                  <p className="truncate font-serif text-base font-medium text-[#1A1510]">{preset.theme.name}</p>
                  <p className="truncate text-[11px] text-[#6B5F50]">Preset · {preset.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 2: Saved User Designs */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-2xl font-medium text-[#1A1510]">
                Desain Saya ({designs.length})
              </h2>
              <p className="text-xs text-[#6B5F50]">
                Pilih desain untuk diedit lagi di studio, duplikat menjadi varian baru, pasang ke undangan, atau jual.
              </p>
            </div>
          </div>

          {designs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E6D5B2] bg-white px-6 py-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F5E8CA] text-[#8A6424]">
                <IconPalette size={22} />
              </span>
              <h3 className="mt-3 font-serif text-2xl font-medium text-[#1A1510]">Belum ada proyek tersimpan</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-[#6B5F50]">
                Mulai buat desain pertamamu dari Kanvas Kosong atau salah satu preset di atas, lalu klik Simpan Draf.
              </p>
              <Button asChild className="mt-5 h-10 rounded-full bg-[#1A1510] px-5 text-xs font-medium text-[#FCF8F1]">
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
                      isActive ? "border-[#8A6424] ring-2 ring-[#D9B56A]/30" : "border-[#EDE3CF] hover:border-[#D9B56A]"
                    }`}
                  >
                    <div>
                      <Link
                        href={`/kanvas/editor?designId=${encodeURIComponent(d.id)}`}
                        className="group relative block aspect-[9/14] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
                      >
                        <CoverThumb theme={d.theme} data={previewData} zoom={0.48} className="h-full w-full" />
                        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                          <span className="rounded-full bg-[#1A1510]/80 px-2 py-0.5 text-[10px] font-medium text-[#FCF8F1] backdrop-blur-xs">
                            {d.source === "CANVAS" ? "Kanvas" : d.source === "AI" ? "AI" : "Katalog"}
                          </span>
                          {layerCount > 0 && (
                            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-[#1A1510]">
                              {layerCount} layer
                            </span>
                          )}
                        </div>
                        {isActive && (
                          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#8A6424] px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                            <IconCheck size={11} /> Dipakai
                          </span>
                        )}
                      </Link>

                      <div className="mt-3 space-y-0.5 px-0.5">
                        <h3 className="truncate font-serif text-xl font-medium text-[#1A1510]">{d.theme.name}</h3>
                        <p className="text-[11px] text-[#6B5F50]">
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

                    <div className="mt-3 space-y-2 border-t border-[#F3EBDB] pt-3">
                      <div className="flex gap-1.5">
                        <Link
                          href={`/kanvas/editor?designId=${encodeURIComponent(d.id)}`}
                          className="flex h-9 flex-1 items-center justify-center gap-1 rounded-full bg-[#1A1510] px-3 text-xs font-medium text-[#FCF8F1] hover:bg-[#2B241B]"
                        >
                          <IconEdit size={13} /> Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSellDesign(d)}
                          className="flex h-9 items-center justify-center gap-1 rounded-full bg-[#8A6424] px-3 text-xs font-medium text-white hover:bg-[#755925]"
                        >
                          <IconShoppingBag size={13} /> Jual
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void duplicateDesign(d)}
                          className="flex h-8 flex-1 items-center justify-center gap-1 rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-2.5 text-[11px] font-medium text-[#40372B] hover:bg-[#F3EBDB] disabled:opacity-50"
                        >
                          <IconCopy size={12} /> Duplikat
                        </button>
                        {!isActive && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void applyDesign(d)}
                            className="flex h-8 flex-1 items-center justify-center gap-1 rounded-full border border-[#E9DDC6] bg-white px-2.5 text-[11px] font-medium text-[#40372B] hover:bg-[#FCF8F1] disabled:opacity-50"
                          >
                            Pakai
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(d)}
                          aria-label={`Hapus ${d.theme.name}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6B5F50] hover:bg-red-50 hover:text-red-600"
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
          <section className="space-y-3 rounded-2xl border border-[#EDE3CF] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-2xl font-medium text-[#1A1510]">Template Saya di Marketplace</h2>
                <p className="text-xs text-[#6B5F50]">Pantau status kurasi dan jumlah penjualan template Anda.</p>
              </div>
              <Link href="/dompet" className="text-xs font-medium text-[#8A6424] hover:underline">
                Lihat penghasilan di Dompet →
              </Link>
            </div>
            <div className="divide-y divide-[#F3EBDB]">
              {myTemplates.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium text-[#1A1510]">
                      {t.name} <span className="text-xs font-normal text-[#6B5F50]">· {t.category}</span>
                    </p>
                    <p className="text-xs text-[#6B5F50]">
                      Harga {rupiah(t.price)} · Komisi platform {t.platformFeePct}% · Dipakai {t.usageCount}×
                    </p>
                    {t.reviewNote && t.reviewStatus === "REJECTED" && <p className="text-xs text-red-600">Catatan: {t.reviewNote}</p>}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      t.reviewStatus === "APPROVED" && t.isActive
                        ? "border border-[#E6D5B2] bg-[#F7F0E1] text-[#5C431A]"
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
        <AlertDialogContent className="border-[#EDE3CF] bg-[#FFFDF9] text-[#1A1510] sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-medium text-[#1A1510]">
              Hapus desain &ldquo;{deleteTarget?.theme.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#5E5446]">
              Draf desain ini akan dihapus dari daftar proyek Anda. Template yang sudah terbit di Marketplace tetap aman.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={deleting} className="rounded-full border-[#E9DDC6] bg-white text-[#40372B] hover:bg-[#FCF8F1]">
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

      {/* Sell on Marketplace dialog with pre-sell AI plagiarism check */}
      <MarketplaceSellDialog
        open={sellDesign !== null}
        onOpenChange={(open) => !open && setSellDesign(null)}
        theme={sellDesign?.theme ?? null}
        initialName={sellDesign?.theme.name ?? ""}
        initialDescription={sellDesign?.theme.mood ?? ""}
        previewData={previewData}
        onSubmitted={(created) => {
          setMyTemplates((prev) => [created, ...prev]);
          router.refresh();
        }}
      />
    </div>
  );
}
