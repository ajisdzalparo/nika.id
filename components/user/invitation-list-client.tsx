"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconExternalLink,
  IconEye,
  IconLoader2,
  IconPalette,
  IconPencil,
  IconPlus,
  IconShare,
  IconTrash,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPlanLimits, type PlanType } from "@/lib/limits";

export interface UserInvitationSummary {
  id: string;
  slug: string | null;
  title: string;
  weddingDate: string | null;
  templateSlug: string | null;
  plan: PlanType;
  isPublic: boolean;
  views: number;
  updatedAt: string;
  _count: {
    guests: number;
    rsvps: number;
    messages: number;
  };
}

interface InvitationListClientProps {
  initialInvitations: UserInvitationSummary[];
  initialActiveId: string;
  baseUrl: string;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const sanitizeTypingSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .slice(0, 60);

type SlugCheckStatus = "idle" | "too_short" | "same" | "checking" | "available" | "taken" | "reserved";

function useSlugAvailability(rawSlug: string, excludeId?: string, sameAs?: string | null) {
  const clean = slugify(rawSlug);
  const [result, setResult] = useState<{ slug: string; excludeId?: string; available: boolean; reason?: string } | null>(null);

  const shouldCheck = clean.length >= 2 && clean !== (sameAs ?? "");

  useEffect(() => {
    if (!shouldCheck) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const qs = new URLSearchParams({ slug: clean, ...(excludeId ? { excludeId } : {}) });
      fetch(`/api/user/invitations/check-slug?${qs.toString()}`, { signal: controller.signal, cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && !controller.signal.aborted) {
            setResult({ slug: clean, excludeId, available: Boolean(d.available), reason: d.reason });
          }
        })
        .catch(() => {});
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [clean, excludeId, shouldCheck]);

  let status: SlugCheckStatus = "idle";
  if (clean.length > 0 && clean.length < 2) {
    status = "too_short";
  } else if (clean && clean === (sameAs ?? "")) {
    status = "same";
  } else if (shouldCheck) {
    if (!result || result.slug !== clean || result.excludeId !== excludeId) {
      status = "checking";
    } else if (result.available) {
      status = "available";
    } else {
      status = result.reason === "RESERVED" ? "reserved" : "taken";
    }
  }

  return { clean, status };
}

function SlugStatusMessage({ clean, status, emptyHint }: { clean: string; status: SlugCheckStatus; emptyHint?: string }) {
  if (status === "idle") {
    return emptyHint ? <p className="text-xs text-[#6B6358]">{emptyHint}</p> : null;
  }
  if (status === "too_short") {
    return <p className="text-xs text-red-600">Slug minimal 2 karakter (huruf, angka, atau tanda hubung).</p>;
  }
  if (status === "same") {
    return <p className="text-xs text-[#6B6358]">Slug tautan tidak berubah (/{clean}).</p>;
  }
  if (status === "checking") {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-[#6B6358]">
        <IconLoader2 size={13} className="animate-spin" /> Mengecek ketersediaan /{clean}...
      </p>
    );
  }
  if (status === "available") {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C4620]">
        <IconCheck size={14} className="text-[#8A6A2F]" /> Tautan /{clean} tersedia dan bisa dipakai.
      </p>
    );
  }
  return (
    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
      <IconX size={14} /> Slug /{clean} sudah dipakai atau tidak tersedia. Pilih nama lain.
    </p>
  );
}

export function InvitationListClient({ initialInvitations, initialActiveId, baseUrl }: InvitationListClientProps) {
  const router = useRouter();
  const [invitations, setInvitations] = useState<UserInvitationSummary[]>(initialInvitations);
  const [activeId, setActiveId] = useState<string>(initialActiveId);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [creating, setCreating] = useState(false);

  // Rename/Slug edit modal state
  const [editing, setEditing] = useState<UserInvitationSummary | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  const createSlugCheck = useSlugAvailability(newSlug);
  const editSlugCheck = useSlugAvailability(editSlug, editing?.id, editing?.slug);

  const createBlocked =
    creating ||
    createSlugCheck.status === "checking" ||
    createSlugCheck.status === "taken" ||
    createSlugCheck.status === "reserved" ||
    createSlugCheck.status === "too_short";

  const editBlocked =
    savingMeta ||
    editSlugCheck.clean.length < 2 ||
    editSlugCheck.status === "checking" ||
    editSlugCheck.status === "taken" ||
    editSlugCheck.status === "reserved" ||
    editSlugCheck.status === "too_short";

  const selectAndGo = async (id: string, href?: string) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/user/invitations/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: id }),
      });
      if (!res.ok) throw new Error("Gagal memilih undangan");
      setActiveId(id);
      if (href) {
        router.push(href);
        router.refresh();
      } else {
        toast.success("Undangan aktif diganti");
        router.refresh();
      }
    } catch {
      toast.error("Gagal memilih undangan");
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return toast.error("Judul undangan wajib diisi");
    setCreating(true);
    try {
      const res = await fetch("/api/user/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug: newSlug.trim() || undefined,
          weddingDate: newDate || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j.message || "Gagal membuat undangan");
      setInvitations((prev) => [j.invitation, ...prev]);
      setActiveId(j.invitation.id);
      setCreateOpen(false);
      setNewTitle("");
      setNewSlug("");
      setSlugEdited(false);
      setNewDate("");
      toast.success("Undangan baru berhasil dibuat dan dipilih");
      router.refresh();
    } finally {
      setCreating(false);
    }
  };

  const toggleShare = async (inv: UserInvitationSummary) => {
    const next = !inv.isPublic;
    setInvitations((prev) => prev.map((x) => (x.id === inv.id ? { ...x, isPublic: next } : x)));
    const res = await fetch(`/api/user/invitations/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: next }),
    });
    if (!res.ok) {
      setInvitations((prev) => prev.map((x) => (x.id === inv.id ? { ...x, isPublic: inv.isPublic } : x)));
      return toast.error("Gagal mengubah status share");
    }
    toast.success(next ? `“${inv.title}” siap dibagikan ke publik` : `“${inv.title}” disembunyikan dari publik`);
    router.refresh();
  };

  const saveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/user/invitations/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), slug: editSlug.trim() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j.message || "Gagal memperbarui info undangan");
      setInvitations((prev) => prev.map((x) => (x.id === editing.id ? j.invitation : x)));
      setEditing(null);
      toast.success("Info undangan diperbarui");
      router.refresh();
    } finally {
      setSavingMeta(false);
    }
  };

  const handleDelete = async (inv: UserInvitationSummary) => {
    if (!confirm(`Hapus undangan “${inv.title}”? Semua data tamu, RSVP, dan ucapannya akan ikut terhapus.`)) return;
    setBusyId(inv.id);
    try {
      const res = await fetch(`/api/user/invitations/${inv.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j.message || "Gagal menghapus undangan");
      setInvitations((prev) => prev.filter((x) => x.id !== inv.id));
      if (j.nextActiveId) setActiveId(j.nextActiveId);
      toast.success("Undangan dihapus");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const copyLink = (inv: UserInvitationSummary) => {
    if (!inv.slug) return;
    const url = `${baseUrl.replace(/\/+$/, "")}/${inv.slug}`;
    navigator.clipboard?.writeText(url);
    toast.success("Link undangan disalin");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">Multi Undangan</p>
          <h2 className="font-serif text-4xl font-medium text-[#1E1B17]">Daftar Undangan</h2>
          <p className="text-sm text-[#6B6358]">Buat lebih dari 1 undangan, pilih yang sedang diedit, dan tentukan mana saja yang dibagikan ke tamu.</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 shrink-0 rounded-full bg-[#1E1B17] px-6 text-sm font-medium text-[#F7F3EC] hover:bg-[#2E2A24]">
              <IconPlus size={17} className="mr-1.5" /> Buat Undangan Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Buat Undangan Baru</DialogTitle>
                <DialogDescription>Tentukan nama acara dan alamat tautan unik untuk undangan ini.</DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="new-inv-title">Judul Undangan</Label>
                <Input
                  id="new-inv-title"
                  value={newTitle}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNewTitle(v);
                    if (!slugEdited) setNewSlug(slugify(v));
                  }}
                  placeholder="Mis. Resepsi Adit & Sarah"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-inv-slug">Slug Tautan</Label>
                <div
                  className={`flex items-center rounded-xl border bg-[#FFFDF9] px-3 ${
                    createSlugCheck.status === "taken" || createSlugCheck.status === "reserved" || createSlugCheck.status === "too_short"
                      ? "border-red-400"
                      : createSlugCheck.status === "available"
                        ? "border-[#8A6A2F]"
                        : "border-[#E1D8C9]"
                  }`}
                >
                  <span className="text-xs text-[#6B6358]">/</span>
                  <input
                    id="new-inv-slug"
                    value={newSlug}
                    onChange={(e) => {
                      setSlugEdited(true);
                      setNewSlug(sanitizeTypingSlug(e.target.value));
                    }}
                    placeholder="adit-sarah"
                    className="h-10 w-full bg-transparent pl-1 text-sm outline-none"
                  />
                </div>
                <SlugStatusMessage
                  clean={createSlugCheck.clean}
                  status={createSlugCheck.status}
                  emptyHint="Kosongkan jika ingin dibuat otomatis dari judul."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-inv-date">Tanggal Acara (Opsional)</Label>
                <Input id="new-inv-date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={createBlocked} className="rounded-full bg-[#1E1B17] text-[#F7F3EC] hover:bg-[#2E2A24] disabled:opacity-50">
                  {creating && <IconLoader2 size={16} className="mr-2 animate-spin" />}
                  Buat Undangan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Title & Slug Modal */}
      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <form onSubmit={saveMeta} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Ubah Judul & Tautan</DialogTitle>
              <DialogDescription>Perbarui nama tampilan di daftar dan slug tautan undangan.</DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="edit-inv-title">Judul Undangan</Label>
              <Input id="edit-inv-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-inv-slug">Slug Tautan</Label>
              <div
                className={`flex items-center rounded-xl border bg-[#FFFDF9] px-3 ${
                  editSlugCheck.status === "taken" || editSlugCheck.status === "reserved" || editSlugCheck.status === "too_short"
                    ? "border-red-400"
                    : editSlugCheck.status === "available"
                      ? "border-[#8A6A2F]"
                      : "border-[#E1D8C9]"
                }`}
              >
                <span className="text-xs text-[#6B6358]">/</span>
                <input
                  id="edit-inv-slug"
                  value={editSlug}
                  onChange={(e) => setEditSlug(sanitizeTypingSlug(e.target.value))}
                  className="h-10 w-full bg-transparent pl-1 text-sm outline-none"
                  required
                />
              </div>
              <SlugStatusMessage clean={editSlugCheck.clean} status={editSlugCheck.status} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={editBlocked} className="rounded-full bg-[#1E1B17] text-[#F7F3EC] hover:bg-[#2E2A24] disabled:opacity-50">
                {savingMeta && <IconLoader2 size={16} className="mr-2 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-5 md:grid-cols-2">
        {invitations.map((inv) => {
          const isActive = inv.id === activeId;
          const limits = getPlanLimits(inv.plan);
          const isPaid = inv.plan !== "FREE";
          const shareReady = inv.isPublic && isPaid;
          const previewHref = inv.slug ? `/${inv.slug}${!shareReady ? "?preview=1" : ""}` : "";

          return (
            <article
              key={inv.id}
              className={`flex flex-col justify-between gap-5 rounded-2xl border p-5 transition-colors sm:p-6 ${
                isActive ? "border-[#8A6A2F] bg-[#FFFDF9] ring-1 ring-[#8A6A2F]/30" : "border-[#E1D8C9] bg-[#FFFDF9]"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1E1B17] px-2.5 py-0.5 text-[11px] font-medium text-[#F7F3EC]">
                          <IconCheck size={12} /> Aktif di Editor
                        </span>
                      )}
                      <span className="rounded-full border border-[#E1D8C9] bg-[#F7F3EC] px-2.5 py-0.5 text-[11px] font-medium text-[#8A6A2F]">
                        {inv.plan === "FREE" ? "Pratinjau" : `Paket ${limits.name}`}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          inv.isPublic ? "border border-[#DFD2BC] bg-[#EFE8DC] text-[#5C4620]" : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {inv.isPublic ? "Siap Dishare" : "Privat"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <h3 className="truncate font-serif text-2xl font-medium text-[#1E1B17]">{inv.title}</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(inv);
                          setEditTitle(inv.title);
                          setEditSlug(inv.slug || "");
                        }}
                        aria-label={`Ubah judul ${inv.title}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B6358] hover:bg-[#EFE8DC] hover:text-[#1E1B17]"
                      >
                        <IconPencil size={14} />
                      </button>
                    </div>
                    <p className="truncate text-sm text-[#6B6358]">/{inv.slug || "belum-ada-slug"}</p>
                  </div>

                  {/* Share Toggle Switch */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[11px] font-medium text-[#6B6358]">Bagikan</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={inv.isPublic}
                      aria-label={`Bagikan ${inv.title} ke publik`}
                      onClick={() => toggleShare(inv)}
                      className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors ${
                        inv.isPublic ? "bg-[#1E1B17]" : "bg-[#CFC5B4]"
                      }`}
                    >
                      <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-[#FFFDF9] transition-transform ${inv.isPublic ? "translate-x-5.5" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#E1D8C9] bg-[#F7F3EC]/60 px-3 py-2.5 text-center">
                  <div>
                    <p className="text-[11px] text-[#6B6358]">Dilihat</p>
                    <p className="font-serif text-xl tabular-nums text-[#1E1B17]">{inv.views}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6B6358]">Tamu</p>
                    <p className="font-serif text-xl tabular-nums text-[#1E1B17]">{inv._count.guests}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6B6358]">RSVP</p>
                    <p className="font-serif text-xl tabular-nums text-[#1E1B17]">{inv._count.rsvps}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 border-t border-[#E1D8C9] pt-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === inv.id}
                    onClick={() => selectAndGo(inv.id, "/editor")}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#1E1B17] px-4 text-xs font-medium text-[#F7F3EC] transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    <IconEdit size={15} /> Edit Isi
                  </button>
                  <button
                    type="button"
                    disabled={busyId === inv.id}
                    onClick={() => selectAndGo(inv.id, "/desain-ai")}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#E1D8C9] bg-[#FFFDF9] px-3.5 text-xs font-medium text-[#1E1B17] hover:bg-[#EFE8DC]"
                  >
                    <IconPalette size={15} /> Desain
                  </button>
                  <button
                    type="button"
                    disabled={busyId === inv.id}
                    onClick={() => selectAndGo(inv.id, "/manajemen-tamu")}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#E1D8C9] bg-[#FFFDF9] px-3.5 text-xs font-medium text-[#1E1B17] hover:bg-[#EFE8DC]"
                  >
                    <IconUsers size={15} /> Tamu
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {!isActive && (
                      <button
                        type="button"
                        disabled={busyId === inv.id}
                        onClick={() => selectAndGo(inv.id)}
                        className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-medium text-[#8A6A2F] hover:bg-[#EFE8DC]"
                      >
                        <IconCheck size={14} /> Jadikan Aktif
                      </button>
                    )}
                    {previewHref && (
                      <a
                        href={previewHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-medium text-[#1E1B17] hover:bg-[#EFE8DC]"
                      >
                        {shareReady ? <IconExternalLink size={14} /> : <IconEye size={14} />}
                        {shareReady ? "Buka Link" : "Pratinjau"}
                      </a>
                    )}
                    {inv.slug && shareReady && (
                      <button
                        type="button"
                        onClick={() => copyLink(inv)}
                        className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-medium text-[#6B6358] hover:bg-[#EFE8DC] hover:text-[#1E1B17]"
                      >
                        <IconCopy size={14} /> Salin
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {inv.plan !== "EKSKLUSIF" && (
                      <button
                        type="button"
                        disabled={busyId === inv.id}
                        onClick={() => selectAndGo(inv.id, "/upgrade")}
                        className="inline-flex h-9 items-center gap-1 rounded-full border border-[#C9A45C]/50 bg-[#FBF6EC] px-3 text-xs font-medium text-[#8A6A2F] hover:bg-[#F4EAD6]"
                      >
                        <IconShare size={13} /> {inv.plan === "FREE" ? "Aktifkan Paket" : "Upgrade"}
                      </button>
                    )}
                    {invitations.length > 1 && (
                      <button
                        type="button"
                        disabled={busyId === inv.id}
                        onClick={() => handleDelete(inv)}
                        aria-label={`Hapus ${inv.title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[#6B6358] hover:bg-[#EFE8DC] hover:text-red-600"
                      >
                        <IconTrash size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
