"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SafeImg } from "@/components/common/safe-img";
import { IconArrowRight, IconChevronLeft, IconChevronRight, IconSearch } from "@tabler/icons-react";
import type { CatalogItem } from "@/lib/catalog-shared";
import { CoverThumb } from "@/components/templates/ai-design/cover-thumb";
import { Display, Eyebrow, L, Phone } from "./primitives";

function Cover({ item, className = "" }: { item: CatalogItem; className?: string }) {
  if (item.kind === "ENGINE" && item.theme) return <CoverThumb theme={item.theme} zoom={0.56} className={className} />;
  return (
    <div className={`relative overflow-hidden bg-[#EFE8DC] ${className}`}>
      <SafeImg src={item.thumbnail} alt={item.name} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

function Badges({ item }: { item: CatalogItem }) {
  return (
    <div className="flex gap-1.5">
      {item.isNew && <span className="rounded-full bg-[#1E1B17] px-2 py-0.5 text-[10px] font-medium text-[#F7F3EC]">Baru</span>}
      <span className="rounded-full border px-2 py-0.5 text-[10px]" style={{ borderColor: L.line, color: item.tier === "Premium" ? L.accent : L.muted }}>
        {item.tier}
      </span>
    </div>
  );
}

function Card({ item, rank }: { item: CatalogItem; rank?: number }) {
  return (
    <Link href={`/preview/t/${item.slug}`} className="group relative w-[190px] shrink-0 snap-start sm:w-[220px]">
      {rank !== undefined && (
        <span className="pointer-events-none absolute -left-3 bottom-16 z-10 font-(family-name:--font-landing-display) text-[88px] font-semibold italic leading-none lining-nums text-[#1E1B17] [-webkit-text-stroke:3px_#F7F3EC] [paint-order:stroke]">
          {rank}
        </span>
      )}
      <div className="overflow-hidden rounded-[22px] border-[5px] border-[#1E1B17] bg-white transition-transform duration-500 group-hover:-translate-y-1">
        <Cover item={item} className="aspect-[9/17] w-full" />
      </div>
      <div className="mt-3 space-y-1.5 px-1">
        <p className="truncate font-(family-name:--font-landing-display) text-xl" style={{ color: L.ink }}>
          {item.name}
        </p>
        <Badges item={item} />
      </div>
    </Link>
  );
}

function Row({ title, items, ranked = false, onSeeAll }: { title: string; items: CatalogItem[]; ranked?: boolean; onSeeAll?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!items.length) return null;
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="space-y-5">
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 md:px-6">
        <h2 className="font-(family-name:--font-landing-display) text-3xl sm:text-4xl" style={{ color: L.ink }}>
          {title}
        </h2>
        <div className="flex items-center gap-1">
          {onSeeAll && (
            <button onClick={onSeeAll} className="mr-2 flex min-h-11 items-center gap-1 text-sm" style={{ color: L.accent }}>
              Lihat semua <IconArrowRight size={15} />
            </button>
          )}
          {[
            [-1, IconChevronLeft, "Sebelumnya"],
            [1, IconChevronRight, "Berikutnya"],
          ].map(([d, Icon, label]) => {
            const I = Icon as typeof IconChevronLeft;
            return (
              <button key={label as string} onClick={() => scroll(d as number)} aria-label={label as string} className="hidden h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-white md:flex" style={{ borderColor: L.line, color: L.ink }}>
                <I size={18} />
              </button>
            );
          })}
        </div>
      </div>
      <div ref={ref} className={`mx-auto flex max-w-6xl snap-x snap-mandatory overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:px-6 ${ranked ? "gap-8 pl-8 md:pl-10" : "gap-5"}`}>
        {items.map((it, i) => (
          <Card key={it.id} item={it} rank={ranked ? i + 1 : undefined} />
        ))}
      </div>
    </section>
  );
}

function FeaturedCarousel({ items }: { items: CatalogItem[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = setTimeout(() => setI((x) => (x + 1) % items.length), 7000);
    return () => clearTimeout(t);
  }, [i, paused, items.length]);
  if (!items.length) return null;
  const it = items[i];

  return (
    <section className="relative overflow-hidden pt-24 md:pt-28" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div key={it.id} className="mx-auto grid max-w-6xl items-center gap-10 px-4 animate-in fade-in duration-700 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Eyebrow>
            Desain unggulan · {it.category}
          </Eyebrow>
          <Display as="h1" className="text-[3.2rem] sm:text-7xl">
            {it.name}
          </Display>
          <p className="max-w-md text-[17px] leading-relaxed" style={{ color: L.muted }}>
            {it.description}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={`/preview/t/${it.slug}`} className="flex h-13 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium" style={{ background: L.ink, color: L.bg }}>
              Coba langsung <IconArrowRight size={18} />
            </Link>
            <Link href={`/pilih-template?pakai=${it.slug}`} className="flex h-13 items-center justify-center rounded-full border px-7 text-[15px] font-medium hover:bg-white" style={{ borderColor: L.line, color: L.ink }}>
              Pakai desain ini
            </Link>
          </div>
          <div className="flex items-center gap-2 pt-2">
            {items.map((x, k) => (
              <button key={x.id} onClick={() => setI(k)} aria-label={`Tampilkan ${x.name}`} className="flex h-11 items-center">
                <span className={`block h-1 rounded-full transition-all duration-300 ${k === i ? "w-10 bg-[#1E1B17]" : "w-5 bg-[#CFC5B4]"}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          {it.kind === "ENGINE" && it.theme ? (
            <Phone theme={it.theme} zoom={0.72} />
          ) : (
            <div className="overflow-hidden rounded-[38px] border-[7px] border-[#111]">
              <Cover item={it} className="h-[520px] w-[270px]" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function DesignCatalog({ items }: { items: CatalogItem[] }) {
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);
  const [cat, setCat] = useState("Semua");
  const [tier, setTier] = useState<"Semua" | "Gratis" | "Premium">("Semua");
  const [q, setQ] = useState("");

  const browsing = cat === "Semua" && tier === "Semua" && !q;
  const filtered = items.filter(
    (i) => (cat === "Semua" || i.category === cat) && (tier === "Semua" || i.tier === tier) && (!q || `${i.name} ${i.category} ${i.description}`.toLowerCase().includes(q.toLowerCase())),
  );
  const top = [...items].sort((a, b) => b.usageCount - a.usageCount || a.sortOrder - b.sortOrder).slice(0, 10);
  const fresh = items.filter((i) => i.isNew);
  const featured = items.filter((i) => i.isFeatured);

  return (
    <div className="space-y-16 pb-24">
      <FeaturedCarousel items={featured.length ? featured : items.slice(0, 3)} />

      <div className="sticky top-16 z-30 border-y py-3 backdrop-blur" style={{ borderColor: L.line, background: "rgba(247,243,236,.92)" }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 md:flex-row md:items-center md:px-6">
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
            {["Semua", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className="h-10 shrink-0 rounded-full border px-4 text-sm transition-colors"
                style={c === cat ? { background: L.ink, color: L.bg, borderColor: L.ink } : { borderColor: L.line, color: L.muted }}
              >
                {c}
              </button>
            ))}
            <span className="mx-1 w-px shrink-0" style={{ background: L.line }} />
            {(["Gratis", "Premium"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTier((x) => (x === t ? "Semua" : t))}
                className="h-10 shrink-0 rounded-full border px-4 text-sm transition-colors"
                style={t === tier ? { background: L.ink, color: L.bg, borderColor: L.ink } : { borderColor: L.line, color: L.muted }}
              >
                {t}
              </button>
            ))}
          </div>
          <label className="flex h-10 items-center gap-2 rounded-full border bg-white px-4 md:ml-auto md:w-64" style={{ borderColor: L.line }}>
            <IconSearch size={16} style={{ color: L.muted }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari: jawa, hijau, minimalis" className="w-full bg-transparent text-sm outline-none" />
          </label>
        </div>
      </div>

      {browsing ? (
        <div className="space-y-16">
          <Row title="Paling banyak dipakai" items={top} ranked />
          <Row title="Baru rilis" items={fresh} />
          {categories.map((c) => (
            <Row key={c} title={c} items={items.filter((i) => i.category === c)} onSeeAll={() => setCat(c)} />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="mb-6 text-sm" style={{ color: L.muted }}>
            {filtered.length} desain
          </p>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {filtered.map((it) => (
              <Card key={it.id} item={it} />
            ))}
          </div>
          {!filtered.length && <p className="py-16 text-center" style={{ color: L.muted }}>Belum ada desain yang cocok. Coba kata lain, atau rancang sendiri dengan Desain AI.</p>}
        </div>
      )}

      <section className="px-4 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-[28px] p-8 md:flex-row md:items-center md:p-12" style={{ background: L.night, color: "#F3EBDD" }}>
          <div className="space-y-2">
            <Eyebrow light>Desain AI</Eyebrow>
            <p className="font-(family-name:--font-landing-display) text-3xl sm:text-4xl">Belum menemukan yang pas? Rancang sendiri.</p>
          </div>
          <Link href="/desain-ai" className="flex h-12 shrink-0 items-center gap-2 rounded-full px-6 text-sm font-medium" style={{ background: "#F3EBDD", color: L.night }}>
            Coba Desain AI <IconArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
