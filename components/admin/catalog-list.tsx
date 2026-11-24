"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SafeImg } from "@/components/common/safe-img";
import { toast } from "sonner";
import {
  IconAlertTriangle,
  IconCheck,
  IconExternalLink,
  IconGripVertical,
  IconLoader2,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconShieldCheck,
  IconShieldSearch,
  IconShieldX,
  IconSparkles,
  IconTrash,
  IconX,
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { resolveArtKit } from "@/lib/ai-design/art-kits";
import { normalizeTheme } from "@/lib/ai-design/color";
import {
  artKitDisplayLabel,
  customVisualLayerSources,
  type OriginalityVerdict,
  type PlagiarismReport,
} from "@/lib/ai-design/originality";
import type { AiTheme } from "@/lib/ai-design/schema";

export interface AdminSimilaritySummary {
  score: number;
  verdict: OriginalityVerdict;
  matchedId: string;
  matchedSlug: string;
  matchedName: string;
}

export interface AdminCatalogRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  tier: string;
  kind: string;
  theme: unknown;
  thumbnail: string | null;
  referenceUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  sortOrder: number;
  usageCount: number;
  price?: number;
  platformFeePct?: number;
  reviewStatus?: string;
  reviewNote?: string | null;
  creatorId?: string | null;
  creatorName?: string | null;
  creatorEmail?: string | null;
  similaritySummary?: AdminSimilaritySummary | null;
}

const COVER_LABELS: Record<AiTheme["layout"]["cover"], string> = {
  "photo-fullbleed": "Foto Penuh Layar",
  "centered-frame": "Bingkai Tengah",
  "arch-window": "Jendela Lengkung",
  "split-photo": "Foto Terbelah",
  typographic: "Tipografi",
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-zinc-600">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-zinc-900" : "bg-zinc-300"}`}
      >
        <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-[#FFFDF9] shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </button>
      {label}
    </label>
  );
}

/** One draggable catalog card; `children` receives the props for its drag handle. */
function SortableCard({ id, disabled, children }: { id: string; disabled: boolean; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const handle = disabled ? null : (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label="Seret untuk mengubah urutan"
      title="Seret untuk mengubah urutan"
      className="flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 active:cursor-grabbing"
    >
      <IconGripVertical size={18} />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex ${isDragging ? "relative z-10 opacity-80 shadow-2xl" : ""}`}
    >
      {children(handle)}
    </div>
  );
}

function ThemeSpecCard({
  title,
  badge,
  badgeClass,
  subtitle,
  slug,
  theme,
  compareWith,
}: {
  title: string;
  badge: string;
  badgeClass: string;
  subtitle: string;
  slug: string;
  theme: AiTheme;
  compareWith?: AiTheme;
}) {
  const kit = resolveArtKit(theme);
  const otherKit = compareWith ? resolveArtKit(compareWith) : null;
  const sameKit = otherKit !== null && kit === otherKit;
  const sameCover = compareWith ? theme.layout.cover === compareWith.layout.cover : false;
  const sameOrnament = compareWith ? theme.ornament === compareWith.ornament && theme.ornament !== "none" : false;
  const sameFonts = compareWith
    ? theme.typography.display === compareWith.typography.display && theme.typography.names === compareWith.typography.names
    : false;
  const customCount = customVisualLayerSources(theme).size;

  return (
    <div className="flex flex-col rounded-2xl border border-[#EDE3CF] bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeClass}`}>
            {badge}
          </span>
          <h4 className="mt-1.5 truncate font-serif text-xl font-medium text-[#1A1510]">{title}</h4>
          <p className="truncate text-xs text-[#6B5F50]">{subtitle}</p>
        </div>
        <Link
          href={`/preview/t/${slug}`}
          target="_blank"
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-[#E6D5B2] bg-[#FCF8F1] px-3 text-[11px] font-medium text-[#40372B] hover:bg-[#F3EBDB]"
        >
          Pratinjau <IconExternalLink size={12} />
        </Link>
      </div>

      <div className="flex justify-center rounded-xl bg-[radial-gradient(circle_at_50%_20%,#FFFDF9_0%,#F6EEDF_75%,#EDE2CC_100%)] p-3">
        <div className="relative aspect-[9/16] w-[176px] overflow-hidden rounded-[18px] border-[3px] border-[#1F1A14] bg-white shadow-[0_14px_30px_-14px_rgba(26,21,16,0.45)]">
          <CoverThumb theme={theme} className="h-full w-full" />
        </div>
      </div>

      <dl className="mt-3.5 space-y-1.5 text-xs">
        <div className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 ${sameKit ? "bg-red-50 text-red-900" : "bg-[#FCF8F1] text-[#40372B]"}`}>
          <dt className="text-[#6B5F50]">Paket Ilustrasi</dt>
          <dd className="font-semibold">{artKitDisplayLabel(kit)}</dd>
        </div>
        <div className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 ${sameCover ? "bg-red-50 text-red-900" : "bg-[#FCF8F1] text-[#40372B]"}`}>
          <dt className="text-[#6B5F50]">Layout Sampul</dt>
          <dd className="font-semibold">{COVER_LABELS[theme.layout.cover]}</dd>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-[#FCF8F1] px-2.5 py-1.5 text-[#40372B]">
          <dt className="text-[#6B5F50]">Palet Warna</dt>
          <dd className="flex items-center gap-1.5">
            {[
              { label: "Latar", hex: theme.palette.background },
              { label: "Permukaan", hex: theme.palette.surface },
              { label: "Aksen", hex: theme.palette.accent },
              { label: "Teks", hex: theme.palette.ink },
            ].map((sw) => (
              <span
                key={sw.label}
                title={`${sw.label}: ${sw.hex}`}
                className="h-4 w-4 rounded-full border border-black/15 shadow-2xs"
                style={{ backgroundColor: sw.hex }}
              />
            ))}
            <span className="ml-1 font-mono text-[10px] text-[#6B5F50]">{theme.palette.background}</span>
          </dd>
        </div>
        <div className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 ${sameFonts ? "bg-amber-50 text-amber-900" : "bg-[#FCF8F1] text-[#40372B]"}`}>
          <dt className="text-[#6B5F50]">Font</dt>
          <dd className="truncate font-medium">
            {theme.typography.display} · {theme.typography.names}
          </dd>
        </div>
        <div className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 ${sameOrnament ? "bg-amber-50 text-amber-900" : "bg-[#FCF8F1] text-[#40372B]"}`}>
          <dt className="text-[#6B5F50]">Ornamen &amp; Bingkai</dt>
          <dd className="font-medium">
            {theme.ornament} · {theme.frame}/{theme.corners}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-[#FCF8F1] px-2.5 py-1.5 text-[#40372B]">
          <dt className="text-[#6B5F50]">Layer Kustom</dt>
          <dd className="font-medium">{customCount > 0 ? `${customCount} aset kustom` : "Tidak ada (bawaan kit)"}</dd>
        </div>
      </dl>
    </div>
  );
}

export function CatalogList({ initial }: { initial: AdminCatalogRow[] }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "flagged" | "active" | "inactive" | "featured">("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminCatalogRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<AdminCatalogRow | null>(null);
  const [rejectNote, setRejectNote] = useState("Komposisi warna atau teks kurang rapi");

  // Plagiarism inspection dialog state
  const [inspectRow, setInspectRow] = useState<AdminCatalogRow | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectReport, setInspectReport] = useState<PlagiarismReport | null>(null);
  const [inspectTargetTheme, setInspectTargetTheme] = useState<AiTheme | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);

  const pendingCount = useMemo(() => rows.filter((r) => r.reviewStatus === "PENDING_REVIEW").length, [rows]);
  const flaggedCount = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.reviewStatus !== "REJECTED" &&
          r.similaritySummary &&
          (r.similaritySummary.verdict === "PLAGIAT" || r.similaritySummary.verdict === "MIRIP"),
      ).length,
    [rows],
  );

  const shown = useMemo(
    () =>
      rows.filter((r) => {
        if (q && !`${r.name} ${r.category} ${r.slug} ${r.creatorName ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
        if (filter === "pending") return r.reviewStatus === "PENDING_REVIEW";
        if (filter === "flagged") {
          return (
            r.reviewStatus !== "REJECTED" &&
            Boolean(r.similaritySummary && (r.similaritySummary.verdict === "PLAGIAT" || r.similaritySummary.verdict === "MIRIP"))
          );
        }
        if (filter === "active") return r.isActive;
        if (filter === "inactive") return !r.isActive;
        if (filter === "featured") return r.isFeatured;
        return true;
      }),
    [rows, q, filter],
  );

  const patch = async (id: string, data: Partial<AdminCatalogRow>) => {
    const prev = rows;
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...data } : r)));
    const res = await fetch(`/api/admin/catalog/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) {
      setRows(prev);
      toast.error("Gagal menyimpan perubahan");
      return false;
    }
    return true;
  };

  // Drag & drop order: only on the full, unfiltered list, so the saved order is the whole catalog
  const canReorder = filter === "all" && !q;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const prev = rows;
    const next = arrayMove(rows, rows.findIndex((r) => r.id === active.id), rows.findIndex((r) => r.id === over.id)).map((r, i) => ({
      ...r,
      sortOrder: (i + 1) * 10,
    }));
    setRows(next);
    const res = await fetch("/api/admin/catalog/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((r) => r.id) }),
    }).catch(() => null);
    if (!res?.ok) {
      setRows(prev);
      toast.error("Urutan gagal disimpan");
    } else {
      toast.success("Urutan disimpan");
    }
  };

  const remove = async (row: AdminCatalogRow) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/catalog/${row.id}`, { method: "DELETE" });
      if (!res.ok) return toast.error("Gagal menghapus template");
      setRows((rs) => rs.filter((r) => r.id !== row.id));
      toast.success("Template dihapus");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const inspectPlagiarism = async (row: AdminCatalogRow) => {
    setInspectRow(row);
    setInspectLoading(true);
    setInspectError(null);
    setInspectReport(null);
    setSelectedMatchIndex(0);
    setInspectTargetTheme(row.theme ? normalizeTheme(row.theme) : null);

    try {
      const res = await fetch(`/api/admin/catalog/${row.id}/similarity`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInspectError(d.message || "Gagal memeriksa plagiasi template");
        return;
      }
      const rep = d.report as PlagiarismReport;
      setInspectReport(rep);
      if (d.target?.theme) {
        setInspectTargetTheme(normalizeTheme(d.target.theme));
      }
      // Refresh badge summary on card
      if (rep.topMatch) {
        setRows((prev) =>
          prev.map((item) =>
            item.id === row.id
              ? {
                  ...item,
                  similaritySummary: {
                    score: rep.score,
                    verdict: rep.verdict,
                    matchedId: rep.topMatch?.id ?? "",
                    matchedSlug: rep.topMatch?.slug ?? "",
                    matchedName: rep.topMatch?.name ?? "",
                  },
                }
              : item,
          ),
        );
      }
    } catch {
      setInspectError("Koneksi terputus saat menjalankan cek plagiasi");
    } finally {
      setInspectLoading(false);
    }
  };

  const activeMatch = inspectReport?.matches[selectedMatchIndex] ?? inspectReport?.topMatch ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", `Semua (${rows.length})`],
              ["pending", `Pengajuan Kreator (${pendingCount})`],
              ["flagged", `Indikasi Mirip (${flaggedCount})`],
              ["active", `Aktif (${rows.filter((r) => r.isActive).length})`],
              ["inactive", "Nonaktif"],
              ["featured", "Unggulan"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`h-9 rounded-full border px-4 text-sm transition-colors ${
                filter === k
                  ? "border-zinc-900 bg-zinc-900 text-zinc-50"
                  : k === "flagged" && flaggedCount > 0
                    ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 min-w-[200px] flex-1 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 xl:w-56 xl:flex-none">
            <IconSearch size={16} className="text-zinc-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari template" className="w-full bg-transparent text-sm outline-none" />
          </label>
          <Link href="/admin/templates/dari-user" className="flex h-10 shrink-0 items-center rounded-full border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-100">
            Dari desain user
          </Link>
          <Link href="/admin/templates/tambah" className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 hover:opacity-90">
            <IconPlus size={16} /> Tambah
          </Link>
        </div>
      </div>

      <p className="-mt-2 text-xs text-zinc-500">
        {canReorder ? "Seret ikon ⠿ untuk mengatur urutan tampil." : "Urutan bisa diatur di tab Semua tanpa pencarian."}
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void onDragEnd(e)}>
      <SortableContext items={shown.map((r) => r.id)} strategy={rectSortingStrategy} disabled={!canReorder}>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {shown.map((r) => {
          const sim = r.similaritySummary;
          const isWarn = r.reviewStatus !== "REJECTED" && sim && (sim.verdict === "PLAGIAT" || sim.verdict === "MIRIP");
          return (
            <SortableCard key={r.id} id={r.id} disabled={!canReorder}>
            {(handle) => (
            <article
              className={`flex w-full flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_1px_2px_rgba(26,21,16,.04)] transition-all hover:shadow-[0_16px_34px_-22px_rgba(26,21,16,0.3)] ${
                r.isActive ? "border-[#EDE3CF]" : "border-dashed border-[#D9CBAE] opacity-75"
              }`}
            >
              <div className="relative flex h-72 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#FFFDF9_0%,#F6EEDF_75%,#EDE2CC_100%)] p-4">
                <div className="relative aspect-[9/16] h-full overflow-hidden rounded-[18px] border-[3px] border-[#1F1A14] bg-white shadow-[0_18px_36px_-18px_rgba(26,21,16,0.5)]">
                  {r.kind === "ENGINE" && r.theme ? (
                    <CoverThumb theme={normalizeTheme(r.theme)} className="h-full w-full" />
                  ) : r.thumbnail ? (
                    <SafeImg src={r.thumbnail} alt={r.name} className="absolute inset-0 h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  {r.isFeatured && <span className="rounded-full bg-[#1F1A14] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#F6EEDD]">Unggulan</span>}
                  {r.isNew && <span className="rounded-full bg-[#8A6424] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">Baru</span>}
                </div>
                {isWarn && sim && (
                  <button
                    type="button"
                    onClick={() => void inspectPlagiarism(r)}
                    className={`absolute bottom-2.5 left-3 right-3 flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-md transition hover:scale-[1.01] ${
                      sim.verdict === "PLAGIAT"
                        ? "bg-red-600 text-white"
                        : "bg-amber-500 text-[#1A1510]"
                    }`}
                  >
                    <IconAlertTriangle size={13} className="shrink-0" />
                    <span className="truncate">
                      {sim.verdict === "PLAGIAT" ? "Plagiasi" : "Mirip"} {sim.score}% · {sim.matchedName}
                    </span>
                  </button>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between space-y-4 p-5">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-serif text-2xl">{r.name}</h3>
                      <p className="text-sm text-zinc-500">
                        {r.category} · {r.tier} · {r.kind === "ENGINE" ? "Mesin tema" : "Komponen"} · dipakai {r.usageCount}×
                      </p>
                    </div>
                    {handle}
                  </div>
                  {(r.creatorId || (r.price ?? 0) > 0) && (
                    <div className="mt-2 rounded-xl border border-[#EDE3CF] bg-[#FCF8F1] p-2.5 text-xs text-zinc-700">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          Kreator: <strong>{r.creatorName || r.creatorEmail || "User"}</strong>
                        </span>
                        <span className="font-semibold text-[#8A6424]">
                          {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(r.price ?? 0)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            r.reviewStatus === "PENDING_REVIEW"
                              ? "bg-amber-100 text-amber-800"
                              : r.reviewStatus === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {r.reviewStatus === "PENDING_REVIEW"
                            ? "Menunggu Review"
                            : r.reviewStatus === "REJECTED"
                              ? "Ditolak"
                              : "Disetujui"}
                        </span>
                        <label className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                          Fee Platform (%):
                          <input
                            type="number"
                            min={0}
                            max={70}
                            defaultValue={r.platformFeePct ?? 30}
                            onBlur={(e) => {
                              const val = Math.max(0, Math.min(70, Number(e.target.value) || 30));
                              if (val !== (r.platformFeePct ?? 30)) patch(r.id, { platformFeePct: val });
                            }}
                            className="h-7 w-14 rounded-md border border-zinc-300 bg-white px-1.5 text-center text-xs font-medium"
                          />
                        </label>
                      </div>
                      {r.reviewStatus === "PENDING_REVIEW" && (
                        <div className="mt-2 space-y-2 border-t border-[#EDE3CF] pt-2">
                          {r.kind === "ENGINE" && (
                            <button
                              type="button"
                              onClick={() => void inspectPlagiarism(r)}
                              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-full border border-[#D9B56A] bg-[#FFFDF9] px-3 text-xs font-semibold text-[#6F4E17] hover:bg-[#F7F0E1]"
                            >
                              <IconShieldSearch size={14} /> Cek Plagiasi AI &amp; Bandingkan
                            </button>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => patch(r.id, { reviewStatus: "APPROVED", isActive: true, reviewNote: null })}
                              className="flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-zinc-900 px-3 text-xs font-medium text-white hover:opacity-90"
                            >
                              <IconCheck size={13} /> Setujui
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectTarget(r);
                                setRejectNote(
                                  sim && (sim.verdict === "PLAGIAT" || sim.verdict === "MIRIP")
                                    ? `Desain terlalu mirip (${sim.score}%) dengan template "${sim.matchedName}". Buat palet, ilustrasi, dan layout sampul yang orisinal.`
                                    : "Komposisi warna atau teks kurang rapi",
                                );
                              }}
                              className="flex h-8 items-center justify-center gap-1 rounded-full border border-red-200 bg-white px-3 text-xs font-medium text-red-700 hover:bg-red-50"
                            >
                              <IconX size={13} /> Tolak
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    <Toggle checked={r.isActive} onChange={(v) => patch(r.id, { isActive: v })} label="Aktif" />
                    <Toggle checked={r.isFeatured} onChange={(v) => patch(r.id, { isFeatured: v })} label="Unggulan" />
                    <Toggle checked={r.isNew} onChange={(v) => patch(r.id, { isNew: v })} label="Baru" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-100 pt-4">
                    <Link href={`/admin/templates/${r.id}`} className="flex h-9 items-center gap-1.5 rounded-full border border-zinc-300 px-3.5 text-sm hover:bg-zinc-100">
                      <IconPencil size={15} /> Edit
                    </Link>
                    {r.kind === "ENGINE" && (
                      <button
                        type="button"
                        onClick={() => void inspectPlagiarism(r)}
                        title="Cek plagiasi AI & bandingkan dengan template terdekat"
                        className="flex h-9 items-center gap-1 rounded-full border border-[#E6D5B2] bg-[#FCF8F1] px-3 text-xs font-medium text-[#6F4E17] hover:bg-[#F3EBDB]"
                      >
                        <IconShieldSearch size={15} /> Cek AI
                      </button>
                    )}
                    <Link href={`/preview/t/${r.slug}`} target="_blank" className="flex h-9 items-center gap-1 rounded-full px-2.5 text-sm text-zinc-600 hover:bg-zinc-100">
                      <IconExternalLink size={15} />
                    </Link>
                    <button type="button" onClick={() => setDeleteTarget(r)} aria-label={`Hapus ${r.name}`} className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-red-50 hover:text-red-700">
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
            )}
            </SortableCard>
          );
        })}
      </div>
      </SortableContext>
      </DndContext>
      {!shown.length && <p className="py-16 text-center text-zinc-500">Tidak ada template yang cocok.</p>}

      {/* Side-by-Side AI Plagiarism Inspection Dialog */}
      <Dialog open={inspectRow !== null} onOpenChange={(open) => !open && setInspectRow(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-[#EDE3CF] bg-[#FFFDF9] text-[#1A1510] sm:max-w-4xl sm:rounded-2xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <div>
                <DialogTitle className="font-serif text-2xl font-medium text-[#1A1510]">
                  Audit Plagiasi AI &amp; Perbandingan Visual
                </DialogTitle>
                <DialogDescription className="text-sm text-[#5E5446]">
                  Bandingkan &ldquo;{inspectRow?.name}&rdquo; secara berdampingan dengan template terdekat di katalog sebelum memutuskan.
                </DialogDescription>
              </div>
              {inspectRow && (
                <button
                  type="button"
                  disabled={inspectLoading}
                  onClick={() => void inspectPlagiarism(inspectRow)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E6D5B2] bg-white px-3.5 text-xs font-medium text-[#40372B] hover:bg-[#FCF8F1] disabled:opacity-50"
                >
                  <IconRefresh size={14} className={inspectLoading ? "animate-spin" : ""} /> Cek Ulang AI
                </button>
              )}
            </div>
          </DialogHeader>

          {inspectLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <IconLoader2 size={28} className="animate-spin text-[#8A6424]" />
              <div className="space-y-1">
                <p className="font-serif text-xl text-[#1A1510]">AI sedang membandingkan katalog...</p>
                <p className="text-xs text-[#6B5F50]">
                  Menganalisis paket ilustrasi, layout sampul, palet warna, ornamen, dan layer kustom terhadap seluruh template aktif.
                </p>
              </div>
            </div>
          ) : inspectError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{inspectError}</div>
          ) : inspectReport && inspectRow ? (
            <div className="space-y-5">
              {/* Verdict Banner */}
              <div
                className={`rounded-2xl border p-4 ${
                  inspectReport.verdict === "PLAGIAT"
                    ? "border-red-300 bg-red-50/85"
                    : inspectReport.verdict === "MIRIP"
                      ? "border-amber-300 bg-amber-50/85"
                      : "border-emerald-200 bg-emerald-50/75"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {inspectReport.verdict === "PLAGIAT" ? (
                      <IconShieldX size={24} className="mt-0.5 shrink-0 text-red-600" />
                    ) : inspectReport.verdict === "MIRIP" ? (
                      <IconAlertTriangle size={24} className="mt-0.5 shrink-0 text-amber-600" />
                    ) : (
                      <IconShieldCheck size={24} className="mt-0.5 shrink-0 text-emerald-700" />
                    )}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                            inspectReport.verdict === "PLAGIAT"
                              ? "bg-red-600 text-white"
                              : inspectReport.verdict === "MIRIP"
                                ? "bg-amber-500 text-[#1A1510]"
                                : "bg-emerald-700 text-white"
                          }`}
                        >
                          {inspectReport.verdict === "PLAGIAT"
                            ? "Terindikasi Plagiasi"
                            : inspectReport.verdict === "MIRIP"
                              ? "Mirip — Tinjau Manual"
                              : "Aman — Orisinal"}
                        </span>
                        <span className="text-lg font-semibold text-[#1A1510]">{inspectReport.score}% kemiripan</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#5C431A]">
                          <IconSparkles size={11} /> {inspectReport.source === "AI" ? "Analisis AI" : "Analisis Visual"}
                        </span>
                      </div>
                      <p className="text-sm text-[#352C22]">{inspectReport.summary}</p>
                    </div>
                  </div>
                </div>

                {inspectReport.reasons.length > 0 && (
                  <ul className="mt-3 grid gap-1.5 rounded-xl bg-white/80 p-3 text-xs text-[#40372B] sm:grid-cols-2">
                    {inspectReport.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                            inspectReport.verdict === "PLAGIAT"
                              ? "bg-red-500"
                              : inspectReport.verdict === "MIRIP"
                                ? "bg-amber-500"
                                : "bg-emerald-600"
                          }`}
                        />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {inspectReport.recommendation && (
                  <p className="mt-2.5 text-xs text-[#4E4438]">
                    <strong>Catatan kurasi:</strong> {inspectReport.recommendation}
                  </p>
                )}
              </div>

              {/* Switch between Top-3 Matches */}
              {inspectReport.matches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#6B5F50]">
                      Pembanding terdekat:
                    </span>
                    {inspectReport.matches.map((m, idx) => (
                      <button
                        key={m.slug}
                        type="button"
                        onClick={() => setSelectedMatchIndex(idx)}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition ${
                          selectedMatchIndex === idx
                            ? "border-[#1A1510] bg-[#1A1510] text-[#FCF8F1]"
                            : "border-[#E6D5B2] bg-white text-[#40372B] hover:bg-[#FCF8F1]"
                        }`}
                      >
                        <span>
                          {idx + 1}. {m.name}
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                            selectedMatchIndex === idx
                              ? "bg-white/20 text-white"
                              : m.verdict === "PLAGIAT"
                                ? "bg-red-100 text-red-700"
                                : m.verdict === "MIRIP"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {m.scorePct}%
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Side-by-Side Comparison Grid */}
                  {inspectTargetTheme && activeMatch && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <ThemeSpecCard
                        title={inspectRow.name}
                        badge={inspectRow.reviewStatus === "PENDING_REVIEW" ? "Pengajuan Kreator" : "Template Diperiksa"}
                        badgeClass="bg-[#1A1510] text-[#FCF8F1]"
                        subtitle={`${inspectRow.category} · ${inspectRow.tier}${inspectRow.creatorName ? ` · oleh ${inspectRow.creatorName}` : ""}`}
                        slug={inspectRow.slug}
                        theme={inspectTargetTheme}
                        compareWith={normalizeTheme(activeMatch.theme)}
                      />
                      <ThemeSpecCard
                        title={activeMatch.name}
                        badge={`Template Pembanding (${activeMatch.scorePct}% mirip)`}
                        badgeClass={
                          activeMatch.verdict === "PLAGIAT"
                            ? "bg-red-600 text-white"
                            : activeMatch.verdict === "MIRIP"
                              ? "bg-amber-500 text-[#1A1510]"
                              : "bg-emerald-700 text-white"
                        }
                        subtitle={`${activeMatch.category ?? "Katalog"} · ${activeMatch.tier ?? "Eksisting"}`}
                        slug={activeMatch.slug}
                        theme={normalizeTheme(activeMatch.theme)}
                        compareWith={inspectTargetTheme}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Manual Admin Decision Footer */}
              <DialogFooter className="flex-wrap gap-2 border-t border-[#EDE3CF] pt-4 sm:justify-between">
                <button
                  type="button"
                  onClick={() => setInspectRow(null)}
                  className="h-10 rounded-full border border-[#E9DDC6] bg-white px-4 text-sm font-medium text-[#40372B] hover:bg-[#FCF8F1]"
                >
                  Tutup
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  {inspectRow.reviewStatus === "PENDING_REVIEW" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const target = inspectRow;
                          const matchedName = activeMatch?.name ?? inspectReport.topMatch?.name ?? "template yang sudah ada";
                          setRejectTarget(target);
                          setRejectNote(
                            `Desain terindikasi plagiasi (${inspectReport.score}% mirip dengan template "${matchedName}"). ${inspectReport.recommendation}`,
                          );
                          setInspectRow(null);
                        }}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-red-600 px-5 text-sm font-medium text-white hover:bg-red-700"
                      >
                        <IconX size={15} /> Tolak sebagai Plagiasi
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await patch(inspectRow.id, { reviewStatus: "APPROVED", isActive: true, reviewNote: null });
                          if (ok) {
                            toast.success(`"${inspectRow.name}" disetujui secara manual dan ditayangkan.`);
                            setInspectRow(null);
                          }
                        }}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#1A1510] px-5 text-sm font-medium text-[#FCF8F1] hover:bg-[#2B241B]"
                      >
                        <IconCheck size={15} /> Tetap Setujui &amp; Tayangkan
                      </button>
                    </>
                  ) : (
                    <>
                      {inspectRow.isActive && (
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await patch(inspectRow.id, { isActive: false });
                            if (ok) {
                              toast.success(`"${inspectRow.name}" dinonaktifkan dari katalog publik.`);
                              setInspectRow(null);
                            }
                          }}
                          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          Nonaktifkan Template
                        </button>
                      )}
                      <Link
                        href={`/admin/templates/${inspectRow.id}`}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#1A1510] px-5 text-sm font-medium text-[#FCF8F1] hover:bg-[#2B241B]"
                      >
                        <IconPencil size={15} /> Edit Template
                      </Link>
                    </>
                  )}
                </div>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent className="border-[#EDE3CF] bg-[#FFFDF9] text-[#1A1510] sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-medium text-[#1A1510]">
              Hapus template &ldquo;{deleteTarget?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-[#5E5446]">
              Template akan dihapus dari katalog. Undangan yang sudah memakai desainnya tidak akan terpengaruh.
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
                if (deleteTarget) void remove(deleteTarget);
              }}
              className="rounded-full bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Menghapus..." : "Ya, hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rejectTarget !== null} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="border-[#EDE3CF] bg-[#FFFDF9] text-[#1A1510] sm:max-w-md sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium text-[#1A1510]">
              Tolak pengajuan template
            </DialogTitle>
            <DialogDescription className="text-sm text-[#5E5446]">
              Berikan catatan untuk kreator &ldquo;{rejectTarget?.name}&rdquo; agar desain dapat diperbaiki dan diajukan kembali.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <label htmlFor="reject-note-input" className="text-xs font-medium text-[#40372B]">
              Catatan penolakan (opsional)
            </label>
            <textarea
              id="reject-note-input"
              rows={4}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Mis. Terlalu mirip dengan template yang sudah ada"
              className="w-full rounded-xl border border-[#E9DDC6] bg-white px-3 py-2 text-sm text-[#1A1510] outline-none focus:border-[#8A6424]"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setRejectTarget(null)}
              className="h-10 rounded-full border border-[#E9DDC6] bg-white px-4 text-sm font-medium text-[#40372B] hover:bg-[#FCF8F1]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!rejectTarget) return;
                const ok = await patch(rejectTarget.id, {
                  reviewStatus: "REJECTED",
                  isActive: false,
                  reviewNote: rejectNote.trim() || null,
                });
                if (ok) {
                  toast.success("Pengajuan template ditolak");
                  setRejectTarget(null);
                }
              }}
              className="h-10 rounded-full bg-red-600 px-5 text-sm font-medium text-white hover:bg-red-700"
            >
              Tolak Template
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
