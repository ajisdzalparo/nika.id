"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  IconCrown,
  IconTrash,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DatePickerField } from "@/components/common/date-time-picker";
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
  planExpiresAt?: string | null;
  /** How a paid plan was obtained; null while still a free preview. */
  activatedVia?: "PAYMENT" | "QUOTA" | null;
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
  agencyQuota?: number;
  isAgency?: boolean;
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
    return emptyHint ? <p className="text-xs text-[#6B5F50]">{emptyHint}</p> : null;
  }
  if (status === "too_short") {
    return <p className="text-xs text-red-600">Slug minimal 2 karakter (huruf, angka, atau tanda hubung).</p>;
  }
  if (status === "same") {
    return <p className="text-xs text-[#6B5F50]">Slug tautan tidak berubah (/{clean}).</p>;
  }
  if (status === "checking") {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs text-[#6B5F50]">
        <IconLoader2 size={13} className="animate-spin" /> Mengecek ketersediaan /{clean}...
      </p>
    );
  }
  if (status === "available") {
    return (
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5C431A]">
        <IconCheck size={14} className="text-[#8A6424]" /> Tautan /{clean} tersedia dan bisa dipakai.
      </p>
    );
  }
  return (
    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
      <IconX size={14} /> Slug /{clean} sudah dipakai atau tidak tersedia. Pilih nama lain.
    </p>
  );
}

const expiryFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

export function InvitationListClient({
  initialInvitations,
  initialActiveId,
  baseUrl,
  agencyQuota: initialAgencyQuota = 0,
  isAgency = false,
}: InvitationListClientProps) {
  const router = useRouter();
  const [invitations, setInvitations] = useState<UserInvitationSummary[]>(initialInvitations);
  const [activeId, setActiveId] = useState<string>(initialActiveId);
  const [agencyQuota, setAgencyQuota] = useState<number>(initialAgencyQuota);
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

  const [deleteTarget, setDeleteTarget] = useState<UserInvitationSummary | null>(null);

  const handleDelete = async (inv: UserInvitationSummary) => {
    setBusyId(inv.id);
    try {
      const res = await fetch(`/api/user/invitations/${inv.id}`, { method: "DELETE" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j.message || "Gagal menghapus undangan");
      setInvitations((prev) => prev.filter((x) => x.id !== inv.id));
      if (j.nextActiveId) setActiveId(j.nextActiveId);
      toast.success("Undangan dihapus");
      setDeleteTarget(null);
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

  const activateWithAgencyQuota = async (inv: UserInvitationSummary) => {
    setBusyId(inv.id);
    try {
      const res = await fetch(`/api/user/invitations/${inv.id}/activate-quota`, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j.message || "Gagal mengaktifkan undangan");
      setInvitations((prev) => prev.map((x) => (x.id === inv.id ? { ...x, plan: "PREMIUM", isPublic: true } : x)));
      setAgencyQuota(j.remainingQuota ?? Math.max(0, agencyQuota - 1));
      toast.success(`“${inv.title}” aktif setara Premium menggunakan 1 kuota Mitra!`);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6424]">Multi Undangan</p>
          <h2 className="font-serif text-4xl font-medium text-[#1F1A14]">Daftar Undangan</h2>
          <p className="text-sm text-[#6B5F50]">
            Satu acara, satu undangan — misalnya akad, resepsi, dan unduh mantu. Undangan baru mulai sebagai pratinjau gratis; aktifkan paket per undangan agar bisa dibagikan ke tamu.
            {(isAgency || agencyQuota > 0) && (
              <>
                {" "}
                <Link href="/mitra" className="font-medium text-[#8A6424] underline-offset-4 hover:underline">
                  Kelola klien &amp; link isi data di Mitra B2B ({agencyQuota} kuota) →
                </Link>
              </>
            )}
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 shrink-0 rounded-full bg-[#1F1A14] px-6 text-sm font-medium text-[#FCF8F1] hover:bg-[#2E2A24]">
              <IconPlus size={17} className="mr-1.5" /> Buat Undangan Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Buat Undangan Baru</DialogTitle>
                <DialogDescription>Tentukan nama acara dan alamat tautannya. Undangan baru dimulai sebagai pratinjau gratis, dan perlu paket sendiri agar bisa dibagikan.</DialogDescription>
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
                        ? "border-[#8A6424]"
                        : "border-[#E9DDC6]"
                  }`}
                >
                  <span className="text-xs text-[#6B5F50]">/</span>
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
                <DatePickerField id="new-inv-date" value={newDate} onChange={setNewDate} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={createBlocked} className="rounded-full bg-[#1F1A14] text-[#FCF8F1] hover:bg-[#2E2A24] disabled:opacity-50">
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
                      ? "border-[#8A6424]"
                      : "border-[#E9DDC6]"
                }`}
              >
                <span className="text-xs text-[#6B5F50]">/</span>
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
              <Button type="submit" disabled={editBlocked} className="rounded-full bg-[#1F1A14] text-[#FCF8F1] hover:bg-[#2E2A24] disabled:opacity-50">
                {savingMeta && <IconLoader2 size={16} className="mr-2 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))] gap-5">
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
                isActive ? "border-[#8A6424] bg-[#FFFDF9] ring-1 ring-[#8A6424]/30" : "border-[#E9DDC6] bg-[#FFFDF9]"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1F1A14] px-2.5 py-0.5 text-[11px] font-medium text-[#FCF8F1]">
                          <IconCheck size={12} /> Sedang diedit
                        </span>
                      )}
                      <span className="rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-2.5 py-0.5 text-[11px] font-medium text-[#8A6424]">
                        {inv.plan === "FREE" ? "Pratinjau" : inv.activatedVia === "QUOTA" ? `${limits.name} · kuota Mitra` : `Paket ${limits.name}`}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          shareReady ? "bg-[#E3EEE4] text-[#2F5A37]" : "bg-[#EFE9DF] text-[#6B5F50]"
                        }`}
                      >
                        {shareReady ? "Tayang" : !isPaid ? "Belum terbit" : "Disembunyikan"}
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5 pt-1">
                      <h3 className="line-clamp-2 break-words font-serif text-2xl font-medium leading-tight text-[#1F1A14]">{inv.title}</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(inv);
                          setEditTitle(inv.title);
                          setEditSlug(inv.slug || "");
                        }}
                        aria-label={`Ubah judul ${inv.title}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B5F50] hover:bg-[#F5EDDD] hover:text-[#1F1A14]"
                      >
                        <IconPencil size={14} />
                      </button>
                    </div>
                    <p className="truncate text-sm text-[#6B5F50]">
                      /{inv.slug || "belum-ada-slug"}
                      {isPaid && (
                        <span className="text-[#7D7468]">
                          {" · "}
                          {inv.planExpiresAt ? `aktif s/d ${expiryFmt.format(new Date(inv.planExpiresAt))}` : "aktif tanpa batas"}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Share Toggle Switch */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[11px] font-medium text-[#6B5F50]">Bagikan</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={inv.isPublic}
                      aria-label={`Bagikan ${inv.title} ke publik`}
                      onClick={() => toggleShare(inv)}
                      className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors ${
                        inv.isPublic ? "bg-[#1F1A14]" : "bg-[#D9CBAE]"
                      }`}
                    >
                      <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-[#FFFDF9] transition-transform ${inv.isPublic ? "translate-x-5.5" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#E9DDC6] bg-[#FCF8F1]/60 px-3 py-2.5 text-center">
                  <div>
                    <p className="text-[11px] text-[#6B5F50]">Dilihat</p>
                    <p className="font-serif text-xl tabular-nums text-[#1F1A14]">{inv.views}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6B5F50]">Tamu</p>
                    <p className="font-serif text-xl tabular-nums text-[#1F1A14]">{inv._count.guests}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6B5F50]">RSVP</p>
                    <p className="font-serif text-xl tabular-nums text-[#1F1A14]">{inv._count.rsvps}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 border-t border-[#E9DDC6] pt-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === inv.id}
                    onClick={() => selectAndGo(inv.id, "/editor")}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#1F1A14] px-4 text-xs font-medium text-[#FCF8F1] transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    <IconEdit size={15} /> Edit Isi
                  </button>
                  <button
                    type="button"
                    disabled={busyId === inv.id}
                    onClick={() => selectAndGo(inv.id, "/desain-ai")}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#E9DDC6] bg-[#FFFDF9] px-3.5 text-xs font-medium text-[#1F1A14] hover:bg-[#F5EDDD]"
                  >
                    <IconPalette size={15} /> Desain
                  </button>
                  <button
                    type="button"
                    disabled={busyId === inv.id}
                    onClick={() => selectAndGo(inv.id, "/manajemen-tamu")}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#E9DDC6] bg-[#FFFDF9] px-3.5 text-xs font-medium text-[#1F1A14] hover:bg-[#F5EDDD]"
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
                        className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-medium text-[#8A6424] hover:bg-[#F5EDDD]"
                      >
                        <IconCheck size={14} /> Jadikan Aktif
                      </button>
                    )}
                    {previewHref && (
                      <a
                        href={previewHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-medium text-[#1F1A14] hover:bg-[#F5EDDD]"
                      >
                        {shareReady ? <IconExternalLink size={14} /> : <IconEye size={14} />}
                        {shareReady ? "Buka Link" : "Pratinjau"}
                      </a>
                    )}
                    {inv.slug && shareReady && (
                      <button
                        type="button"
                        onClick={() => copyLink(inv)}
                        className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-medium text-[#6B5F50] hover:bg-[#F5EDDD] hover:text-[#1F1A14]"
                      >
                        <IconCopy size={14} /> Salin
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {inv.plan === "FREE" && agencyQuota > 0 && (
                      <button
                        type="button"
                        disabled={busyId === inv.id}
                        onClick={() => activateWithAgencyQuota(inv)}
                        className="inline-flex h-9 items-center gap-1 rounded-full bg-[#8A6424] px-3 text-xs font-medium text-white hover:bg-[#755925] disabled:opacity-50"
                      >
                        Aktifkan (1 Kuota)
                      </button>
                    )}
                    {inv.plan !== "EKSKLUSIF" && (
                      <button
                        type="button"
                        disabled={busyId === inv.id}
                        onClick={() => selectAndGo(inv.id, "/upgrade")}
                        className="inline-flex h-9 items-center gap-1 rounded-full border border-[#D9B56A]/50 bg-[#FCF5E6] px-3 text-xs font-medium text-[#8A6424] hover:bg-[#F5E8CA]"
                      >
                        <IconCrown size={13} /> {inv.plan === "FREE" ? "Aktifkan Paket" : "Upgrade"}
                      </button>
                    )}
                    {invitations.length > 1 && (
                      <button
                        type="button"
                        disabled={busyId === inv.id}
                        onClick={() => setDeleteTarget(inv)}
                        aria-label={`Hapus ${inv.title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[#6B5F50] hover:bg-[#F5EDDD] hover:text-red-600"
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

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && busyId === null && setDeleteTarget(null)}>
        <AlertDialogContent className="border-[#EDE3CF] bg-[#FFFDF9] text-[#1A1510] sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-medium text-[#1A1510]">
              Hapus undangan &ldquo;{deleteTarget?.title}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-[#5E5446]">
              Semua data tamu, RSVP, ucapan, dan pengaturan undangan ini akan ikut terhapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={busyId !== null} className="rounded-full border-[#E9DDC6] bg-white text-[#40372B] hover:bg-[#FCF8F1]">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busyId !== null}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) void handleDelete(deleteTarget);
              }}
              className="rounded-full bg-red-600 text-white hover:bg-red-700"
            >
              {busyId ? "Menghapus..." : "Ya, hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
