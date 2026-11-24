"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SafeImg } from "@/components/common/safe-img";
import { toast } from "sonner";
import { IconCheck, IconExternalLink, IconPencil, IconPlus, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
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
import { normalizeTheme } from "@/lib/ai-design/color";

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
}

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

export function CatalogList({ initial }: { initial: AdminCatalogRow[] }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "inactive" | "featured">("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminCatalogRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<AdminCatalogRow | null>(null);
  const [rejectNote, setRejectNote] = useState("Komposisi warna atau teks kurang rapi");

  const pendingCount = useMemo(() => rows.filter((r) => r.reviewStatus === "PENDING_REVIEW").length, [rows]);

  const shown = useMemo(
    () =>
      rows.filter((r) => {
        if (q && !`${r.name} ${r.category} ${r.slug} ${r.creatorName ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
        if (filter === "pending") return r.reviewStatus === "PENDING_REVIEW";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", `Semua (${rows.length})`],
              ["pending", `Pengajuan Kreator (${pendingCount})`],
              ["active", `Aktif (${rows.filter((r) => r.isActive).length})`],
              ["inactive", "Nonaktif"],
              ["featured", "Unggulan"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`h-9 rounded-full border px-4 text-sm transition-colors ${filter === k ? "border-zinc-900 bg-zinc-900 text-zinc-50" : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"}`}>
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

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((r) => (
          <article key={r.id} className={`overflow-hidden rounded-2xl border bg-white transition-opacity ${r.isActive ? "border-zinc-200" : "border-dashed border-zinc-300 opacity-70"}`}>
            <div className="relative h-56 bg-zinc-100">
              {r.kind === "ENGINE" && r.theme ? (
                <CoverThumb theme={normalizeTheme(r.theme)} zoom={0.5} className="h-full w-full" />
              ) : r.thumbnail ? (
                <SafeImg src={r.thumbnail} alt={r.name} className="absolute inset-0 h-full w-full" />
              ) : null}
              <div className="absolute left-3 top-3 flex gap-1.5">
                {r.isFeatured && <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-50">Unggulan</span>}
                {r.isNew && <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-zinc-800">Baru</span>}
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="space-y-0.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-serif text-2xl">{r.name}</h3>
                    <p className="text-sm text-zinc-500">
                      {r.category} · {r.tier} · {r.kind === "ENGINE" ? "Mesin tema" : "Komponen"} · dipakai {r.usageCount}×
                    </p>
                  </div>
                  <input
                    type="number"
                    aria-label="Urutan"
                    title="Urutan tampil"
                    defaultValue={r.sortOrder}
                    onBlur={(e) => Number(e.target.value) !== r.sortOrder && patch(r.id, { sortOrder: Number(e.target.value) })}
                    className="h-9 w-16 shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-center text-sm"
                  />
                </div>
                {(r.creatorId || (r.price ?? 0) > 0) && (
                  <div className="mt-2 rounded-xl border border-[#E6DFD3] bg-[#FAF8F4] p-2.5 text-xs text-zinc-700">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        Kreator: <strong>{r.creatorName || r.creatorEmail || "User"}</strong>
                      </span>
                      <span className="font-semibold text-[#8A6A2F]">
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
                      <div className="mt-2 flex gap-2 border-t border-[#E6DFD3] pt-2">
                        <button
                          type="button"
                          onClick={() => patch(r.id, { reviewStatus: "APPROVED", isActive: true, reviewNote: null })}
                          className="flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-zinc-900 px-3 text-xs font-medium text-white hover:opacity-90"
                        >
                          <IconCheck size={13} /> Setujui &amp; Tayangkan
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectTarget(r);
                            setRejectNote("Komposisi warna atau teks kurang rapi");
                          }}
                          className="flex h-8 items-center justify-center gap-1 rounded-full border border-red-200 bg-white px-3 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          <IconX size={13} /> Tolak
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <Toggle checked={r.isActive} onChange={(v) => patch(r.id, { isActive: v })} label="Aktif" />
                <Toggle checked={r.isFeatured} onChange={(v) => patch(r.id, { isFeatured: v })} label="Unggulan" />
                <Toggle checked={r.isNew} onChange={(v) => patch(r.id, { isNew: v })} label="Baru" />
              </div>
              <div className="flex items-center gap-2 border-t border-zinc-100 pt-4">
                <Link href={`/admin/templates/${r.id}`} className="flex h-9 items-center gap-1.5 rounded-full border border-zinc-300 px-4 text-sm hover:bg-zinc-100">
                  <IconPencil size={15} /> Edit
                </Link>
                <Link href={`/preview/t/${r.slug}`} target="_blank" className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-zinc-600 hover:bg-zinc-100">
                  <IconExternalLink size={15} /> Pratinjau
                </Link>
                <button type="button" onClick={() => setDeleteTarget(r)} aria-label={`Hapus ${r.name}`} className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-red-50 hover:text-red-700">
                  <IconTrash size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!shown.length && <p className="py-16 text-center text-zinc-500">Tidak ada template yang cocok.</p>}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent className="border-[#E6DFD3] bg-[#FFFDF9] text-[#15130F] sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-medium text-[#15130F]">
              Hapus template &ldquo;{deleteTarget?.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-[#5E574D]">
              Template akan dihapus dari katalog. Undangan yang sudah memakai desainnya tidak akan terpengaruh.
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
        <DialogContent className="border-[#E6DFD3] bg-[#FFFDF9] text-[#15130F] sm:max-w-md sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-medium text-[#15130F]">
              Tolak pengajuan template
            </DialogTitle>
            <DialogDescription className="text-sm text-[#5E574D]">
              Berikan catatan untuk kreator &ldquo;{rejectTarget?.name}&rdquo; agar desain dapat diperbaiki dan diajukan kembali.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <label htmlFor="reject-note-input" className="text-xs font-medium text-[#3F3A33]">
              Catatan penolakan (opsional)
            </label>
            <textarea
              id="reject-note-input"
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Mis. Komposisi warna atau teks kurang rapi"
              className="w-full rounded-xl border border-[#DFD7C8] bg-white px-3 py-2 text-sm text-[#15130F] outline-none focus:border-[#8A6A2F]"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setRejectTarget(null)}
              className="h-10 rounded-full border border-[#DFD7C8] bg-white px-4 text-sm font-medium text-[#3F3A33] hover:bg-[#FAF8F4]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                if (!rejectTarget) return;
                void patch(rejectTarget.id, {
                  reviewStatus: "REJECTED",
                  isActive: false,
                  reviewNote: rejectNote.trim() || null,
                });
                toast.success("Pengajuan template ditolak");
                setRejectTarget(null);
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
