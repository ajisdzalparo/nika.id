"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SafeImg } from "@/components/common/safe-img";
import { IconArrowRight, IconArrowsSort, IconSearch, IconX } from "@tabler/icons-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CatalogItem } from "@/lib/catalog-shared";
import { CoverThumb } from "@/components/templates/ai-design/cover-thumb";
import { Display, Eyebrow, L } from "./primitives";

function Cover({ item, className = "" }: { item: CatalogItem; className?: string }) {
  if (item.kind === "ENGINE" && item.theme) return <CoverThumb theme={item.theme} zoom={0.56} className={className} />;
  return (
    <div className={`relative overflow-hidden bg-[#F5EDDD] ${className}`}>
      <SafeImg src={item.thumbnail} alt={item.name} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

function Badges({ item, popular }: { item: CatalogItem; popular: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {popular && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-[#1F1A14]" style={{ background: L.foil }}>Populer</span>}
      {item.isNew && <span className="rounded-full bg-[#8A6424] px-2 py-0.5 text-[10px] font-semibold text-white">Baru</span>}
      <span className="rounded-full border px-2 py-0.5 text-[10px]" style={{ borderColor: L.line, color: item.tier === "Premium" ? L.accent : L.muted }}>
        {item.tier}
      </span>
    </div>
  );
}

function Card({ item, popular, index }: { item: CatalogItem; popular: boolean; index: number }) {
  return (
    <Link
      href={`/preview/t/${item.slug}`}
      className="group block animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:backwards]"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="relative overflow-hidden rounded-[22px] border border-[#E6D7BC] bg-white shadow-[0_12px_28px_-18px_rgba(26,21,16,0.28)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5 group-hover:border-[#C9A24E] group-hover:shadow-[0_24px_48px_-22px_rgba(26,21,16,0.38)]">
        <Cover item={item} className="aspect-[9/15.5] w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]" />
        <span className="pointer-events-none absolute inset-x-2.5 bottom-2.5 flex translate-y-2 items-center justify-center gap-1 rounded-full bg-[#1F1A14]/90 py-2 text-xs font-medium text-[#F6EEDD] opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Lihat pratinjau <IconArrowRight size={13} />
        </span>
      </div>
      <div className="mt-3 space-y-1.5 px-0.5">
        <p className="truncate font-(family-name:--font-landing-display) text-lg sm:text-xl" style={{ color: L.ink }}>
          {item.name}
        </p>
        <Badges item={item} popular={popular} />
      </div>
    </Link>
  );
}

const SORTS = { populer: "Paling populer", baru: "Terbaru", nama: "Nama A–Z" } as const;
type Sort = keyof typeof SORTS;

/** Every template on one page: filter, search and sort narrow the grid; no carousels to scroll sideways. */
export function DesignCatalog({ items }: { items: CatalogItem[] }) {
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);
  const popularIds = useMemo(
    () => new Set([...items].filter((i) => i.usageCount > 0).sort((a, b) => b.usageCount - a.usageCount).slice(0, 3).map((i) => i.id)),
    [items],
  );
  const [cat, setCat] = useState("Semua");
  const [tier, setTier] = useState<"Semua" | "Gratis" | "Premium">("Semua");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("populer");

  const query = q.trim().toLowerCase();
  const shown = items
    .filter((i) => (cat === "Semua" || i.category === cat) && (tier === "Semua" || i.tier === tier) && (!query || `${i.name} ${i.category} ${i.description}`.toLowerCase().includes(query)))
    .sort((a, b) => {
      if (sort === "nama") return a.name.localeCompare(b.name, "id");
      if (sort === "baru") return Number(b.isNew) - Number(a.isNew) || a.sortOrder - b.sortOrder;
      return b.usageCount - a.usageCount || a.sortOrder - b.sortOrder;
    });
  const filtering = cat !== "Semua" || tier !== "Semua" || Boolean(query);
  const reset = () => {
    setCat("Semua");
    setTier("Semua");
    setQ("");
  };

  const chip = (active: boolean) => (active ? { background: L.accent, color: "#fff", borderColor: L.accent } : { borderColor: L.line, color: L.muted, background: L.surface });

  return (
    <div className="pb-24">
      {/* Compact header: the templates are the hero */}
      <section className="relative overflow-hidden pb-10 pt-28 md:pt-32">
        <div aria-hidden className="uy-lattice pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl space-y-4 px-4 md:px-6">
          <Eyebrow>Template undangan</Eyebrow>
          <Display as="h1" className="max-w-3xl text-[2.4rem] sm:text-[3.4rem]">
            {items.length} template siap pakai, <em className="italic" style={{ color: L.accent }}>coba langsung</em> di HP.
          </Display>
          <p className="max-w-xl text-[17px] leading-relaxed" style={{ color: L.muted }}>
            Ketuk template untuk melihat pratinjau lengkapnya. Data kalian tetap aman saat berganti desain kapan saja.
          </p>
        </div>
      </section>

      {/* Filters stay on screen while browsing */}
      <div className="sticky top-16 z-30 border-y py-3 backdrop-blur" style={{ borderColor: L.line, background: "rgba(252,248,241,.92)" }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 lg:flex-row lg:items-center md:px-6">
          {/* Phones: swipe sideways (the fade hints there is more). From tablet up the chips wrap, so a mouse never has to scroll sideways. */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,#000_85%,transparent)] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:[mask-image:none] lg:min-w-0 lg:flex-1">
            {["Semua", ...categories].map((c) => (
              <button key={c} onClick={() => setCat(c)} aria-pressed={c === cat} className="h-10 shrink-0 rounded-full border px-4 text-sm transition-colors" style={chip(c === cat)}>
                {c}
              </button>
            ))}
            <span className="mx-1 w-px shrink-0" style={{ background: L.line }} />
            {(["Gratis", "Premium"] as const).map((t) => (
              <button key={t} onClick={() => setTier((x) => (x === t ? "Semua" : t))} aria-pressed={t === tier} className="h-10 shrink-0 rounded-full border px-4 text-sm transition-colors" style={chip(t === tier)}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2 lg:ml-auto">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border bg-white px-4 lg:w-60 lg:flex-none" style={{ borderColor: L.line }}>
              <IconSearch size={16} className="shrink-0" style={{ color: L.muted }} />
              <input value={q} onChange={(e) => setQ(e.target.value)} type="search" aria-label="Cari template" placeholder="Cari: jawa, hijau, minimalis" className="w-full min-w-0 bg-transparent text-sm outline-none" />
            </label>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger aria-label="Urutkan template" className="shrink-0 font-medium">
                <IconArrowsSort size={15} className="text-ring" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" className="min-w-48">
                {Object.entries(SORTS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 pt-8 md:px-6">
        <div className="mb-6 flex min-h-8 items-center justify-between gap-3 text-sm" style={{ color: L.muted }}>
          <p>
            Menampilkan <span className="font-semibold" style={{ color: L.ink }}>{shown.length}</span> dari {items.length} template
          </p>
          {filtering && (
            <button onClick={reset} className="inline-flex min-h-9 items-center gap-1 rounded-full px-2 font-medium hover:bg-white" style={{ color: L.accent }}>
              <IconX size={14} /> Hapus filter
            </button>
          )}
        </div>

        {shown.length ? (
          <div key={`${cat}-${tier}-${sort}`} className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
            {shown.map((it, i) => (
              <Card key={it.id} item={it} index={i} popular={popularIds.has(it.id)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed px-6 py-16 text-center" style={{ borderColor: L.line, color: L.muted }}>
            Belum ada template yang cocok. Coba kata lain, atau rancang sendiri dengan Desain AI.
          </div>
        )}
      </section>

      <section className="mt-20 px-4 md:px-6">
        <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 overflow-hidden rounded-[28px] p-8 md:flex-row md:items-center md:p-12" style={{ background: L.night, color: L.nightText }}>
          <div aria-hidden className="uy-lattice-light pointer-events-none absolute inset-0" />
          <div className="relative space-y-2">
            <Eyebrow light>Desain AI</Eyebrow>
            <p className="font-(family-name:--font-landing-display) text-3xl sm:text-4xl">Belum menemukan yang pas? Rancang sendiri.</p>
          </div>
          <Link href="/#desain-ai" className="uy-sheen relative flex h-12 shrink-0 items-center gap-2 rounded-full px-6 text-sm font-semibold" style={{ background: L.foil, color: L.ink }}>
            Coba Desain AI <IconArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
