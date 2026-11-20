"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SafeImg } from "@/components/common/safe-img";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowRight, IconCheck, IconExternalLink, IconLoader2, IconLock, IconPalette } from "@tabler/icons-react";
import type { CatalogItem } from "@/lib/catalog-shared";
import { CoverThumb } from "@/components/templates/ai-design/cover-thumb";

export function TemplatePicker({ items, allowedTiers, highlight }: { items: CatalogItem[]; allowedTiers: string[]; highlight?: string }) {
  const router = useRouter();
  const [cat, setCat] = useState("Semua");
  const [busy, setBusy] = useState<string | null>(null);
  const categories = useMemo(() => ["Semua", ...Array.from(new Set(items.map((i) => i.category)))], [items]);
  const shown = cat === "Semua" ? items : items.filter((i) => i.category === cat);
  const highlightRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const use = async (item: CatalogItem) => {
    setBusy(item.slug);
    try {
      const res = await fetch(`/api/user/catalog/${item.slug}/use`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
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
      <Link href="/desain-ai" className="group flex items-center justify-between gap-4 rounded-2xl bg-zinc-950 p-5 text-zinc-50 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15">
            <IconPalette size={20} className="text-[#C9A45C]" />
          </span>
          <div>
            <p className="font-serif text-2xl">Ingin desain yang unik?</p>
            <p className="text-sm text-zinc-400">Rancang dengan AI sesuai konsep kalian.</p>
          </div>
        </div>
        <IconArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" />
      </Link>

      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {categories.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`h-10 shrink-0 rounded-full border px-4 text-sm transition-colors ${c === cat ? "border-zinc-900 bg-zinc-900 text-zinc-50" : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
        {shown.map((item) => {
          const locked = !allowedTiers.includes(item.tier);
          const isHighlight = item.slug === highlight;
          return (
            <article key={item.id} ref={isHighlight ? (el) => void (highlightRef.current = el) : undefined} className="space-y-3">
              <div className={`relative overflow-hidden rounded-[22px] border-[5px] bg-white ${isHighlight ? "border-[#8A6A2F] ring-4 ring-[#8A6A2F]/20" : "border-zinc-900"}`}>
                {item.kind === "ENGINE" && item.theme ? (
                  <CoverThumb theme={item.theme} zoom={0.6} className="aspect-[9/16] w-full" />
                ) : (
                  <div className="relative aspect-[9/16] w-full bg-zinc-100">
                    <SafeImg src={item.thumbnail} alt={item.name} className="absolute inset-0 h-full w-full" />
                  </div>
                )}
                {locked && (
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-zinc-950/85 px-2.5 py-1 text-[11px] text-zinc-50">
                    <IconLock size={12} /> {item.tier}
                  </span>
                )}
              </div>
              <div className="space-y-0.5 px-1">
                <p className="truncate font-serif text-xl">{item.name}</p>
                <p className="text-sm text-zinc-500">
                  {item.category} · {item.tier}
                </p>
              </div>
              <div className="flex gap-2 px-1">
                {locked ? (
                  <Link href="/upgrade" className="flex h-10 flex-1 items-center justify-center rounded-full border border-zinc-300 text-sm font-medium">
                    Upgrade
                  </Link>
                ) : (
                  <button onClick={() => use(item)} disabled={busy !== null} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-zinc-900 text-sm font-medium text-zinc-50 disabled:opacity-50">
                    {busy === item.slug ? <IconLoader2 size={15} className="animate-spin" /> : <IconCheck size={15} />} Pakai
                  </button>
                )}
                <Link href={`/preview/t/${item.slug}`} target="_blank" aria-label={`Pratinjau ${item.name}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 hover:bg-zinc-100">
                  <IconExternalLink size={16} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
