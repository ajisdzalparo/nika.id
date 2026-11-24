"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SafeImg } from "@/components/common/safe-img";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowRight, IconBrush, IconCheck, IconExternalLink, IconLoader2, IconLock, IconPalette } from "@tabler/icons-react";
import type { CatalogItem } from "@/lib/catalog-shared";
import { CoverThumb } from "@/components/templates/ai-design/cover-thumb";
import { Button, buttonVariants } from "@/components/ui/button";

export function TemplatePicker({
  items,
  allowedTiers,
  highlight,
  aiEnabled = true,
  purchasedTemplateIds = [],
  currentUserId,
}: {
  items: CatalogItem[];
  allowedTiers: string[];
  highlight?: string;
  aiEnabled?: boolean;
  purchasedTemplateIds?: string[];
  currentUserId?: string;
}) {
  const router = useRouter();
  const [cat, setCat] = useState("Semua");
  const [busy, setBusy] = useState<string | null>(null);
  const categories = useMemo(() => ["Semua", ...Array.from(new Set(items.map((i) => i.category)))], [items]);
  const shown = cat === "Semua" ? items : items.filter((i) => i.category === cat);
  const highlightRef = useRef<HTMLElement | null>(null);
  const purchasedSet = useMemo(() => new Set(purchasedTemplateIds), [purchasedTemplateIds]);
  const rupiah = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const applyTemplate = async (item: CatalogItem) => {
    setBusy(item.slug);
    try {
      const res = await fetch(`/api/user/catalog/${item.slug}/use`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (res.status === 402 && j.checkoutUrl) {
        router.push(j.checkoutUrl);
        return;
      }
      if (!res.ok) return toast.error(j.message || "Gagal memakai template");
      toast.success(`“${item.name}” dipakai untuk undangan kalian`);
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Studio banners: AI Design + Blank Canvas */}
      <div className={`grid gap-4 ${aiEnabled ? "lg:grid-cols-2" : ""}`}>
        {aiEnabled && (
          <Link
            href="/desain-ai"
            className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-[#1A1510] p-5 text-[#F6EEDD] shadow-[0_18px_40px_-28px_rgba(26,21,16,0.7)] transition-transform duration-300 hover:-translate-y-0.5 sm:p-6"
          >
            <span aria-hidden className="uy-lattice-light pointer-events-none absolute inset-0 opacity-60" />
            <div className="relative flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D9B56A]/35 bg-white/5 text-[#D9B56A]">
                <IconPalette size={20} />
              </span>
              <div>
                <p className="font-(family-name:--font-landing-display) text-2xl">Ingin desain yang unik?</p>
                <p className="text-sm text-[#CDBF9F]">Rancang dengan AI sesuai konsep kalian.</p>
              </div>
            </div>
            <IconArrowRight className="relative shrink-0 text-[#D9B56A] transition-transform group-hover:translate-x-1" />
          </Link>
        )}
        <Link
          href="/kanvas/editor?blank=1"
          className="group flex items-center justify-between gap-4 rounded-2xl border border-[#E6D5B2] bg-white p-5 text-[#1A1510] shadow-[0_1px_2px_rgba(26,21,16,.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C9A24E] sm:p-6"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F6EEDF] text-[#8A6424]">
              <IconBrush size={20} />
            </span>
            <div>
              <p className="font-(family-name:--font-landing-display) text-2xl">Kanvas Kosong &amp; Jual</p>
              <p className="text-sm text-[#6B5F50]">Desain sebebas Canva dari nol, beri animasi, lalu jual di Marketplace.</p>
            </div>
          </div>
          <IconArrowRight className="shrink-0 text-[#8A6424] transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors ${
              c === cat
                ? "border-[#1F1A14] bg-[#1F1A14] text-[#F6EEDD]"
                : "border-[#E9DDC6] bg-white text-[#40372B] hover:border-[#8A6424]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {shown.map((item) => {
          const isPaidMarketplace = item.price > 0;
          const ownsMarketplace =
            !isPaidMarketplace ||
            (currentUserId != null && item.creatorId === currentUserId) ||
            purchasedSet.has(item.id);
          const locked = !isPaidMarketplace && !allowedTiers.includes(item.tier);
          const needsPurchase = isPaidMarketplace && !ownsMarketplace;
          const isHighlight = item.slug === highlight;

          return (
            <article
              key={item.id}
              ref={isHighlight ? (el) => void (highlightRef.current = el) : undefined}
              className="group flex flex-col"
            >
              {/* Full-bleed luxury stationery preview card */}
              <div
                className={`relative overflow-hidden rounded-[22px] border bg-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_48px_-22px_rgba(26,21,16,0.38)] ${
                  isHighlight
                    ? "border-[#8A6424] ring-4 ring-[#8A6424]/20 shadow-[0_18px_36px_-18px_rgba(138,100,36,0.45)]"
                    : "border-[#E6D7BC] shadow-[0_12px_28px_-18px_rgba(26,21,16,0.28)] group-hover:border-[#C9A24E]"
                }`}
              >
                <Link href={`/preview/t/${item.slug}`} target="_blank" className="block">
                  {item.kind === "ENGINE" && item.theme ? (
                    <CoverThumb theme={item.theme} className="aspect-[9/15.5] w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]" />
                  ) : (
                    <div className="relative aspect-[9/15.5] w-full bg-[#F6EEDF]">
                      <SafeImg src={item.thumbnail} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
                    </div>
                  )}
                </Link>

                {/* Top badges */}
                <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-1.5">
                  <div className="flex flex-wrap gap-1">
                    {item.isNew && (
                      <span className="rounded-full bg-[#8A6424] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-xs">
                        Baru
                      </span>
                    )}
                  </div>
                  {isPaidMarketplace ? (
                    <span className="rounded-full bg-[linear-gradient(120deg,#B8903F,#E6CB86)] px-2.5 py-0.5 text-[11px] font-semibold text-[#1F1A14] shadow-xs">
                      {ownsMarketplace ? "Dimiliki" : rupiah(item.price)}
                    </span>
                  ) : locked ? (
                    <span className="flex items-center gap-1 rounded-full bg-[#1A1510]/85 px-2.5 py-0.5 text-[10px] font-medium text-[#F6EEDD] backdrop-blur-xs">
                      <IconLock size={11} /> {item.tier}
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/60 bg-white/85 px-2.5 py-0.5 text-[10px] font-medium text-[#40372B] backdrop-blur-xs">
                      {item.tier}
                    </span>
                  )}
                </div>

                {/* Hover preview hint */}
                <span className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-center gap-1.5 rounded-full bg-[#1A1510]/85 py-2 text-xs font-medium text-[#F6EEDD] opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <IconExternalLink size={13} /> Lihat pratinjau
                </span>
              </div>

              {/* Card meta & actions */}
              <div className="mt-3 flex flex-1 flex-col justify-between gap-2.5 px-0.5">
                <div className="space-y-0.5">
                  <p className="truncate font-(family-name:--font-landing-display) text-xl text-[#1F1A14]">{item.name}</p>
                  <p className="truncate text-xs text-[#6B5F50]">
                    {item.category} · {isPaidMarketplace ? (item.creatorName ? `oleh ${item.creatorName}` : "Marketplace") : item.tier}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {needsPurchase ? (
                    <Link
                      href={`/upgrade?pilih=template&templateId=${item.id}`}
                      className={buttonVariants({ variant: "gold", size: "sm", className: "h-9 flex-1 text-xs" })}
                    >
                      Beli &amp; Pakai
                    </Link>
                  ) : locked ? (
                    <Link
                      href="/upgrade"
                      className={buttonVariants({ variant: "outline", size: "sm", className: "h-9 flex-1 rounded-full border-[#E9DDC6] text-xs text-[#1F1A14]" })}
                    >
                      Upgrade
                    </Link>
                  ) : (
                    <Button
                      type="button"
                      variant="ink"
                      size="sm"
                      onClick={() => applyTemplate(item)}
                      disabled={busy !== null}
                      className="h-9 flex-1 text-xs"
                    >
                      {busy === item.slug ? <IconLoader2 size={14} className="animate-spin" /> : <IconCheck size={14} />} Pakai
                    </Button>
                  )}
                  <Link
                    href={`/preview/t/${item.slug}`}
                    target="_blank"
                    aria-label={`Pratinjau ${item.name}`}
                    title="Buka pratinjau"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E9DDC6] bg-white text-[#6B5F50] transition-colors hover:border-[#8A6424] hover:text-[#1F1A14]"
                  >
                    <IconExternalLink size={15} />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
