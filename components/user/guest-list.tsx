"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconBrandWhatsapp,
  IconCheck,
  IconCopy,
  IconCrown,
  IconDownload,
  IconEyeCheck,
  IconPencil,
  IconPlus,
  IconQrcode,
  IconSearch,
  IconSend,
  IconShieldLock,
  IconTrash,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { GuestImportDialog } from "@/components/user/guest-import-dialog";
import { SelectField } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { PhoneInput } from "@/components/common/phone-input";
import { NumberInput } from "@/components/common/number-input";
import { Panel, StatTile } from "@/components/common/studio-ui";
import { TablePagination, useClientPagination, useClientSort } from "@/components/common/table-pagination";
import { SortableTableHead, TableHead } from "@/components/ui/table";
import { CheckInQr, downloadQrCard, downloadStandardQr, renderQrCard, renderStandardQr, shareQrOnWhatsapp } from "@/components/common/qr-code";
import { PlanType, getMaxGuests, getPlanLimits } from "@/lib/limits";
import { waLink } from "@/lib/phone";

export interface GuestItem {
  id: string;
  name: string;
  recipientType: "PERSONAL" | "GROUP";
  guestType: "REGULAR" | "VIP";
  greeting: string | null;
  phone: string | null;
  label: string | null;
  maxGuests: number;
  rsvpEnabled: boolean;
  eventName: string | null;
  note: string | null;
  sentAt: string | null;
  openedAt: string | null;
  lastOpenedAt: string | null;
  openCount: number;
  checkInToken?: string | null;
}

interface GuestListProps {
  initialGuests: GuestItem[];
  invitationSlug: string;
  coupleName: string;
  eventOptions: string[];
  userPlan: PlanType;
  extraGuestQuota?: number;
  monitoringOnly?: boolean;
  qrEnabled?: boolean;
  card?: { couple: string; date?: string | null; venue?: string | null };
}

interface GuestFormState {
  recipientType: "PERSONAL" | "GROUP";
  guestType: "REGULAR" | "VIP";
  greeting: string;
  name: string;
  phone: string;
  labelMode: string;
  customLabel: string;
  maxGuests: string;
  rsvpEnabled: "yes" | "no";
  eventName: string;
  note: string;
}

const DEFAULT_LABELS = ["Keluarga", "Teman Kantor", "Teman Kuliah", "Blast", "Manual"];
const GREETING_PRESETS = ["Bapak/Ibu", "Saudara/i", "Kak", "Dear"];
const CUSTOM_LABEL_VALUE = "__CUSTOM__";
const fmt = new Intl.NumberFormat("id-ID");
const shortDateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

/** Strips redundant leading "Kepada Yth." / "Kepada" / "Yth." for the `?to=` param since the cover prints "Kepada Yth." above it. */
function cleanGreetingForCover(greeting: string | null | undefined): string {
  return (greeting ?? "")
    .trim()
    .replace(/^kepada\s+yth\.?\s*/i, "")
    .replace(/^kepada\s+/i, "")
    .replace(/^yth\.?\s*/i, "")
    .trim();
}

/** Natural opening salutation line for WhatsApp messages (never doubles "Kepada Kepada Yth."). */
function formatWaSalutation(g: Pick<GuestItem, "greeting" | "name">): string {
  const greet = (g.greeting ?? "").trim();
  const name = g.name.trim();
  if (!greet) return `Kepada Yth. ${name}`;
  if (/^(kepada|dear|halo|hai|assalam)/i.test(greet)) return `${greet} ${name}`;
  if (/^yth\.?/i.test(greet)) return `Kepada ${greet} ${name}`;
  return `Kepada Yth. ${greet} ${name}`;
}

function formatCoverRecipient(g: Pick<GuestItem, "greeting" | "name">): string {
  const cleaned = cleanGreetingForCover(g.greeting);
  return cleaned ? `${cleaned} ${g.name.trim()}` : g.name.trim();
}

function emptyForm(defaultEvent: string): GuestFormState {
  return {
    recipientType: "PERSONAL",
    guestType: "REGULAR",
    greeting: "",
    name: "",
    phone: "",
    labelMode: "",
    customLabel: "",
    maxGuests: "1",
    rsvpEnabled: "yes",
    eventName: defaultEvent,
    note: "",
  };
}

function formFromGuest(g: GuestItem, knownLabels: string[], defaultEvent: string): GuestFormState {
  const hasLabel = Boolean(g.label);
  const inKnown = hasLabel && knownLabels.includes(g.label!);
  return {
    recipientType: g.recipientType,
    guestType: g.guestType,
    greeting: g.greeting ?? "",
    name: g.name,
    phone: g.phone ?? "",
    labelMode: !hasLabel ? "" : inKnown ? g.label! : CUSTOM_LABEL_VALUE,
    customLabel: !hasLabel || inKnown ? "" : g.label!,
    maxGuests: String(g.maxGuests || 1),
    rsvpEnabled: g.rsvpEnabled ? "yes" : "no",
    eventName: g.eventName || defaultEvent,
    note: g.note ?? "",
  };
}

function displayRecipient(g: Pick<GuestItem, "greeting" | "name">): string {
  return g.greeting ? `${g.greeting} ${g.name}` : g.name;
}

export function GuestList({
  initialGuests,
  invitationSlug,
  coupleName,
  eventOptions,
  userPlan,
  extraGuestQuota = 0,
  monitoringOnly = false,
  qrEnabled = false,
  card,
}: GuestListProps) {
  const defaultEvent = eventOptions[0] || "Umum";
  const [guests, setGuests] = useState<GuestItem[]>(initialGuests);
  const [search, setSearch] = useState("");
  const [filterChip, setFilterChip] = useState<string>("SEMUA");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GuestItem | null>(null);
  const [form, setForm] = useState<GuestFormState>(() => emptyForm(defaultEvent));
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GuestItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [qrTarget, setQrTarget] = useState<GuestItem | null>(null);
  const [qrKind, setQrKind] = useState<"card" | "standard">("card");
  const [qrLoadingId, setQrLoadingId] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const qrCardMeta = card ?? { couple: coupleName };

  const limits = getPlanLimits(userPlan);
  const maxGuestsLimit = getMaxGuests(userPlan, extraGuestQuota);
  const isLimitReached = guests.length >= maxGuestsLimit;

  const baseUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${invitationSlug}`;

  const knownLabels = useMemo(() => {
    const set = new Set<string>(DEFAULT_LABELS);
    for (const g of guests) {
      if (g.label) set.add(g.label);
    }
    return Array.from(set);
  }, [guests]);

  const usedLabels = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of guests) {
      if (g.label) counts.set(g.label, (counts.get(g.label) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [guests]);

  const stats = useMemo(() => {
    const vip = guests.filter((g) => g.guestType === "VIP").length;
    const withPhone = guests.filter((g) => Boolean(g.phone)).length;
    const opened = guests.filter((g) => Boolean(g.openedAt)).length;
    const sent = guests.filter((g) => Boolean(g.sentAt) || Boolean(g.openedAt)).length;
    const unsent = guests.filter((g) => !g.sentAt && !g.openedAt).length;
    return { total: guests.length, vip, withPhone, opened, sent, unsent, labels: usedLabels.length };
  }, [guests, usedLabels]);

  const filteredGuests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return guests.filter((g) => {
      if (filterChip === "OPENED" && !g.openedAt) return false;
      if (filterChip === "SENT" && (!g.sentAt || Boolean(g.openedAt))) return false;
      if (filterChip === "UNSENT" && (Boolean(g.sentAt) || Boolean(g.openedAt))) return false;
      if (filterChip === "VIP" && g.guestType !== "VIP") return false;
      if (filterChip === "WA" && !g.phone) return false;
      if (filterChip.startsWith("LABEL:") && g.label !== filterChip.slice(6)) return false;
      if (!term) return true;
      return `${g.greeting ?? ""} ${g.name} ${g.phone ?? ""} ${g.label ?? ""} ${g.eventName ?? ""} ${g.note ?? ""}`
        .toLowerCase()
        .includes(term);
    });
  }, [guests, search, filterChip]);
  // Status order for sorting: not sent yet → sent → opened
  const { sortedRows: sortedGuests, sort: guestSort, onSort: onGuestSort } = useClientSort(filteredGuests, {
    name: (g) => g.name,
    status: (g) => (g.openedAt ? 2 : g.sentAt ? 1 : 0),
    label: (g) => g.label || g.eventName,
    quota: (g) => g.maxGuests,
  });
  const { pageRows: pageGuests, pagination: guestPagination } = useClientPagination(sortedGuests, 20);

  const openAdd = () => {
    if (isLimitReached) {
      toast.error(`Batas tamu tercapai untuk paket ${limits.name}. Tingkatkan paket atau tambah kuota tamu.`);
      return;
    }
    setEditing(null);
    setForm(emptyForm(defaultEvent));
    setDialogOpen(true);
  };

  const openEdit = (g: GuestItem) => {
    setEditing(g);
    setForm(formFromGuest(g, knownLabels, defaultEvent));
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      toast.error("Nama tamu wajib diisi");
      return;
    }

    const finalLabel =
      form.labelMode === CUSTOM_LABEL_VALUE ? form.customLabel.trim() : form.labelMode.trim();

    const payload = {
      name: trimmedName,
      recipientType: form.recipientType,
      guestType: form.guestType,
      greeting: form.greeting.trim() || null,
      phone: form.phone.trim() || null,
      label: finalLabel || null,
      maxGuests: Math.min(Math.max(parseInt(form.maxGuests, 10) || 1, 1), 20),
      rsvpEnabled: form.rsvpEnabled === "yes",
      eventName: form.eventName.trim() || null,
      note: form.note.trim() || null,
    };

    setSaving(true);
    try {
      const url = editing ? `/api/user/guests/${editing.id}` : "/api/user/guests";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Gagal menyimpan data tamu");
        return;
      }

      const saved: GuestItem = {
        id: data.id,
        name: data.name,
        recipientType: data.recipientType === "GROUP" ? "GROUP" : "PERSONAL",
        guestType: data.guestType === "VIP" ? "VIP" : "REGULAR",
        greeting: data.greeting ?? null,
        phone: data.phone ?? null,
        label: data.label ?? null,
        maxGuests: data.maxGuests ?? 1,
        rsvpEnabled: data.rsvpEnabled ?? true,
        eventName: data.eventName ?? null,
        note: data.note ?? null,
        sentAt: data.sentAt ?? null,
        openedAt: data.openedAt ?? null,
        lastOpenedAt: data.lastOpenedAt ?? null,
        openCount: data.openCount ?? 0,
      };

      if (editing) {
        setGuests((prev) => prev.map((g) => (g.id === saved.id ? saved : g)));
        toast.success(`Data ${saved.name} diperbarui`);
      } else {
        setGuests((prev) => [saved, ...prev]);
        toast.success(`${saved.name} ditambahkan ke daftar tamu`);
      }
      setDialogOpen(false);
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const deleteGuest = async (id: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/user/guests/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Gagal menghapus tamu");
      setGuests((prev) => prev.filter((g) => g.id !== id));
      toast.success("Tamu berhasil dihapus");
      setDeleteTarget(null);
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setDeleting(false);
    }
  };

  const markGuestSent = (g: GuestItem) => {
    if (g.sentAt) return;
    const nowIso = new Date().toISOString();
    setGuests((prev) => prev.map((x) => (x.id === g.id ? { ...x, sentAt: nowIso } : x)));
    void fetch(`/api/user/guests/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markSent: true }),
    }).catch(() => {});
  };

  const guestInviteLink = (g: GuestItem) => {
    const params = new URLSearchParams({ to: formatCoverRecipient(g) });
    if (g.recipientType === "GROUP") params.set("grup", "1");
    return `${baseUrl}?${params.toString()}`;
  };

  const copyLink = (g: GuestItem) => {
    navigator.clipboard.writeText(guestInviteLink(g));
    markGuestSent(g);
    toast.success(`Link untuk ${g.name} disalin & ditandai terkirim`);
  };

  const shareWA = (g: GuestItem) => {
    const link = guestInviteLink(g);
    const salutation = formatWaSalutation(g);
    const text = `${salutation},\n\nDengan memohon rahmat dan ridho-Nya, kami bermaksud mengundang Anda untuk menghadiri hari bahagia ${coupleName}.\n\nBuka undangan digital di sini:\n${link}`;
    const direct = g.phone ? waLink(g.phone, text) : null;
    markGuestSent(g);
    window.open(direct ?? `https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const shareGroupWA = () => {
    const text = `Halo semuanya, kami mengundang Anda untuk menghadiri hari bahagia ${coupleName}. Lihat detail undangan di sini: ${baseUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const copyGeneralLink = () => {
    navigator.clipboard.writeText(baseUrl);
    toast.success("Link umum berhasil disalin");
  };

  const openGuestQr = async (g: GuestItem) => {
    if (g.checkInToken) {
      setQrTarget(g);
      return;
    }
    setQrLoadingId(g.id);
    try {
      const res = await fetch(`/api/user/guests/${g.id}/qr`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.checkInToken) {
        toast.error(data.message || "Gagal menyiapkan QR check-in");
        return;
      }
      const updated: GuestItem = { ...g, checkInToken: data.checkInToken };
      setGuests((prev) => prev.map((x) => (x.id === g.id ? updated : x)));
      setQrTarget(updated);
    } catch {
      toast.error("Terjadi kesalahan saat membuat QR");
    } finally {
      setQrLoadingId(null);
    }
  };

  const downloadGuestQr = async () => {
    if (!qrTarget?.checkInToken) return;
    setQrBusy(true);
    try {
      const guestDisplay = displayRecipient(qrTarget);
      if (qrKind === "standard") {
        await downloadStandardQr(qrTarget.checkInToken, guestDisplay);
      } else {
        await downloadQrCard(qrTarget.checkInToken, {
          guestName: guestDisplay,
          note: qrTarget.note,
          ...qrCardMeta,
        });
      }
      setQrTarget(null);
    } finally {
      setQrBusy(false);
    }
  };

  const sendGuestQrOnWhatsapp = async () => {
    if (!qrTarget?.checkInToken) return;
    setQrBusy(true);
    try {
      const guestDisplay = displayRecipient(qrTarget);
      const img =
        qrKind === "standard"
          ? await renderStandardQr(qrTarget.checkInToken, guestDisplay)
          : await renderQrCard(qrTarget.checkInToken, {
              guestName: guestDisplay,
              note: qrTarget.note,
              ...qrCardMeta,
            });
      const link = guestInviteLink(qrTarget);
      const salutation = formatWaSalutation(qrTarget);
      const message = [
        `${salutation},`,
        "",
        `Dengan memohon rahmat dan ridho-Nya, kami bermaksud mengundang Anda untuk menghadiri hari bahagia ${coupleName}.`,
        "",
        `Buka undangan digital di sini:\n${link}`,
        "",
        "Terlampir juga QR check-in pribadi Anda untuk ditunjukkan kepada penerima tamu saat tiba di lokasi acara.",
      ].join("\n");
      const how = await shareQrOnWhatsapp(img, qrTarget.phone, message);
      markGuestSent(qrTarget);
      if (how === "manual") {
        toast.success("QR diunduh. Lampirkan gambarnya di chat WhatsApp yang terbuka.");
      }
      setQrTarget(null);
    } catch {
      toast.error("Gagal menyiapkan QR");
    } finally {
      setQrBusy(false);
    }
  };

  const effectiveEventOptions = useMemo(() => {
    if (form.eventName && !eventOptions.includes(form.eventName)) {
      return [...eventOptions, form.eventName];
    }
    return eventOptions;
  }, [eventOptions, form.eventName]);

  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Total tamu"
          value={fmt.format(stats.total)}
          hint={maxGuestsLimit === Infinity ? "Kuota tanpa batas" : `dari ${fmt.format(maxGuestsLimit)} kuota paket`}
          icon={IconUsers}
        />
        <StatTile label="Sudah dikirim" value={fmt.format(stats.sent)} hint={`dari ${fmt.format(stats.total)} tamu`} icon={IconSend} delay={60} />
        <StatTile label="Sudah dibuka" value={fmt.format(stats.opened)} hint="Tamu sudah membuka web undangan" icon={IconEyeCheck} delay={120} />
        <StatTile label="Tamu VIP" value={fmt.format(stats.vip)} hint={`${fmt.format(stats.withPhone)} punya nomor WA`} icon={IconCrown} delay={180} />
      </div>

      {/* Quick share general link strip (hidden in Mitra monitoring mode) */}
      {monitoringOnly ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[#E6D5B2] bg-[#FAF4E8] px-4 py-3.5 text-sm text-[#40372B]">
          <IconShieldLock size={19} className="mt-0.5 shrink-0 text-[#8A6424]" />
          <div>
            <p className="font-medium text-[#1F1A14]">Mode Pemantauan Mitra</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#5E5446]">
              Daftar tamu dikelola langsung oleh akun klien. Untuk menjaga privasi tamu, nomor WhatsApp disensor sebagian dan aksi tambah, ubah, hapus, maupun kirim pesan dinonaktifkan.
            </p>
          </div>
        </div>
      ) : (
        <Panel tone="night" className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#D9B56A]">Tautan umum & grup</p>
              <p className="mt-1 font-(family-name:--font-landing-display) text-2xl text-[#F6EEDD]">Bagikan ke grup WhatsApp atau media sosial</p>
              <p className="mt-1 text-xs text-[#CDBF9F]">Untuk tamu perorangan, tambahkan nomor WA mereka di daftar agar bisa dikirim langsung dari tombol WA atau WA Blast.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={copyGeneralLink}
                variant="secondary"
                className="h-10 rounded-full border border-white/15 bg-white/10 px-4 text-[#F6EEDD] hover:bg-white/15"
              >
                <IconCopy size={16} /> Salin Link Umum
              </Button>
              <Button type="button" onClick={shareGroupWA} variant="gold" className="h-10 px-4">
                <IconBrandWhatsapp size={16} /> Share ke Grup
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {/* Main Guest Table Card */}
      <div className="rounded-2xl border border-[#EDE3CF] bg-white shadow-[0_1px_2px_rgba(26,21,16,.04)]">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-[#F3EBDB] p-4 lg:flex-row lg:items-center">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-4">
            <IconSearch size={16} className="shrink-0 text-[#6B5F50]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
              aria-label="Cari tamu"
              placeholder={monitoringOnly ? "Cari nama tamu, label, acara, atau catatan…" : "Cari nama, nomor WA, label, acara, atau catatan…"}
              className="w-full min-w-0 bg-transparent text-sm outline-none"
            />
          </label>
          {!monitoringOnly && (
            <div className="flex flex-wrap items-center gap-2">
              {isLimitReached && (
                <Link href="/upgrade" className={buttonVariants({ variant: "outline", className: "h-10 rounded-full border-[#E9DDC6] text-[#8A6424]" })}>
                  Tambah kuota tamu
                </Link>
              )}
              <GuestImportDialog disabled={isLimitReached} />
              <Button type="button" variant="gold" onClick={openAdd} disabled={isLimitReached} className="h-10 px-5">
                <IconUserPlus size={16} /> {isLimitReached ? "Batas tamu tercapai" : "Tambah Tamu"}
              </Button>
            </div>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 border-b border-[#F3EBDB] px-4 py-3">
          {[
            { key: "SEMUA", label: `Semua (${guests.length})` },
            { key: "OPENED", label: `Sudah dibuka (${stats.opened})` },
            { key: "SENT", label: `Terkirim (${Math.max(0, stats.sent - stats.opened)})` },
            { key: "UNSENT", label: `Belum dikirim (${stats.unsent})` },
            { key: "VIP", label: `VIP (${stats.vip})` },
            { key: "WA", label: `Ada No. WA (${stats.withPhone})` },
            ...usedLabels.map(([lbl, count]) => ({ key: `LABEL:${lbl}`, label: `${lbl} (${count})` })),
          ].map((chip) => (
            <button
              key={chip.key}
              type="button"
              aria-pressed={filterChip === chip.key}
              onClick={() => setFilterChip(chip.key)}
              className={`h-9 rounded-full border px-3.5 text-xs font-medium transition ${
                filterChip === chip.key
                  ? "border-[#1F1A14] bg-[#1F1A14] text-white"
                  : "border-[#E9DDC6] text-[#40372B] hover:border-[#8A6424]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-[#FBF7EF]">
              <tr className="border-b border-[#EFE6D4]">
                <SortableTableHead sortKey="name" sort={guestSort} onSort={onGuestSort}>Tamu</SortableTableHead>
                <SortableTableHead sortKey="status" sort={guestSort} onSort={onGuestSort}>Status Undangan</SortableTableHead>
                <SortableTableHead sortKey="label" sort={guestSort} onSort={onGuestSort}>Label & Acara</SortableTableHead>
                <SortableTableHead sortKey="quota" sort={guestSort} onSort={onGuestSort}>Kuota & RSVP</SortableTableHead>
                <TableHead>Catatan</TableHead>
                {!monitoringOnly && <TableHead className="text-right">Aksi</TableHead>}
              </tr>
            </thead>
            <tbody>
              {pageGuests.map((g) => {
                const directWa = monitoringOnly ? null : waLink(g.phone);
                return (
                  <tr key={g.id} className="border-t border-[#F3EBDB] align-top transition-colors hover:bg-[#FCF8F1]">
                    <td className="px-4 py-3.5">
                      <div className="flex items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F6EEDF] font-(family-name:--font-landing-display) text-base text-[#8A6424]">
                          {g.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="font-medium text-[#1F1A14]">{displayRecipient(g)}</p>
                            {g.guestType === "VIP" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(120deg,#B8903F,#E6CB86)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#1F1A14]">
                                VIP
                              </span>
                            )}
                            {g.recipientType === "GROUP" && (
                              <span className="rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-2 py-0.5 text-[10px] font-medium text-[#6B5F50]">
                                Grup
                              </span>
                            )}
                          </div>
                          {monitoringOnly ? (
                            g.phone ? (
                              <p className="mt-0.5 text-xs tabular-nums text-[#6B5F50]">{g.phone}</p>
                            ) : (
                              <p className="mt-0.5 text-xs text-[#8E8268]">Belum ada nomor WA</p>
                            )
                          ) : directWa ? (
                            <p className="mt-0.5 text-xs tabular-nums text-[#8A6424]">+{g.phone}</p>
                          ) : (
                            <p className="mt-0.5 text-xs text-[#8E8268]">Belum ada nomor WA</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {g.openedAt ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F0FB] px-2.5 py-1 text-xs font-medium text-[#2555A6]">
                            <IconEyeCheck size={14} /> Sudah dibuka
                          </span>
                          <p className="mt-1 text-[11px] text-[#6B5F50]">
                            {g.openCount > 1 ? `Dibuka ${g.openCount}× · ` : ""}
                            {shortDateFmt.format(new Date(g.lastOpenedAt ?? g.openedAt))}
                          </p>
                        </div>
                      ) : g.sentAt ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F6EEDF] px-2.5 py-1 text-xs font-medium text-[#8A6424]">
                            <IconCheck size={14} /> Terkirim
                          </span>
                          <p className="mt-1 text-[11px] text-[#8E8268]">{shortDateFmt.format(new Date(g.sentAt))}</p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-[#F6E7E4] px-2.5 py-1 text-xs font-medium text-[#9A3B2E]">
                          Belum dikirim
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {g.label ? (
                          <span className="rounded-full bg-[#F6EEDF] px-2.5 py-0.5 text-xs font-medium text-[#8A6424]">{g.label}</span>
                        ) : (
                          <span className="text-xs text-[#8E8268]">Tanpa label</span>
                        )}
                      </div>
                      {g.eventName && <p className="mt-1 text-xs text-[#6B5F50]">{g.eventName}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="tabular-nums text-[#40372B]">Maks. {g.maxGuests} orang</p>
                      <p className="mt-0.5 text-xs text-[#8E8268]">{g.rsvpEnabled ? "RSVP aktif" : "RSVP nonaktif"}</p>
                    </td>
                    <td className="max-w-52 px-4 py-3.5 text-xs text-[#6B5F50]">{g.note || "–"}</td>
                    {!monitoringOnly && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => copyLink(g)}
                            className="flex size-9 items-center justify-center rounded-full text-[#6B5F50] transition-colors hover:bg-[#F6EEDF] hover:text-[#1F1A14]"
                            title="Salin link personal"
                            aria-label={`Salin link untuk ${g.name}`}
                          >
                            <IconCopy size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => shareWA(g)}
                            className="flex size-9 items-center justify-center rounded-full text-[#8A6424] transition-colors hover:bg-[#F6EEDF] hover:text-[#1F1A14]"
                            title={g.phone ? `Kirim WA ke +${g.phone}` : "Bagikan via WhatsApp"}
                            aria-label={`Kirim WA untuk ${g.name}`}
                          >
                            <IconBrandWhatsapp size={18} />
                          </button>
                          {qrEnabled && (
                            <button
                              type="button"
                              disabled={qrLoadingId === g.id}
                              onClick={() => void openGuestQr(g)}
                              className="flex size-9 items-center justify-center rounded-full text-[#6B5F50] transition-colors hover:bg-[#F6EEDF] hover:text-[#1F1A14] disabled:opacity-45"
                              title="QR check-in tamu (unduh atau kirim bersama undangan)"
                              aria-label={`QR check-in untuk ${g.name}`}
                            >
                              <IconQrcode size={18} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEdit(g)}
                            className="flex size-9 items-center justify-center rounded-full text-[#6B5F50] transition-colors hover:bg-[#F6EEDF] hover:text-[#1F1A14]"
                            title="Ubah data tamu"
                            aria-label={`Ubah ${g.name}`}
                          >
                            <IconPencil size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(g)}
                            className="flex size-9 items-center justify-center rounded-full text-[#6B5F50] transition-colors hover:bg-[#F6E7E4] hover:text-[#9A3B2E]"
                            title="Hapus tamu"
                            aria-label={`Hapus ${g.name}`}
                          >
                            <IconTrash size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="divide-y divide-[#F3EBDB] md:hidden">
          {pageGuests.map((g) => (
            <li key={g.id} className="space-y-2.5 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-medium text-[#1F1A14]">{displayRecipient(g)}</p>
                    {g.guestType === "VIP" && (
                      <span className="rounded-full bg-[linear-gradient(120deg,#B8903F,#E6CB86)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#1F1A14]">
                        VIP
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs tabular-nums text-[#6B5F50]">
                    {g.phone ? (monitoringOnly ? g.phone : `+${g.phone}`) : "Belum ada No. WA"} · Maks. {g.maxGuests} orang
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {g.openedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F0FB] px-2.5 py-0.5 text-[11px] font-medium text-[#2555A6]">
                      <IconEyeCheck size={12} /> Dibuka{g.openCount > 1 ? ` ${g.openCount}×` : ""}
                    </span>
                  ) : g.sentAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F6EEDF] px-2.5 py-0.5 text-[11px] font-medium text-[#8A6424]">
                      <IconCheck size={12} /> Terkirim
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#F6E7E4] px-2.5 py-0.5 text-[11px] font-medium text-[#9A3B2E]">
                      Belum dikirim
                    </span>
                  )}
                  {g.label && (
                    <span className="rounded-full bg-[#F6EEDF] px-2 py-0.5 text-[10px] font-medium text-[#8A6424]">{g.label}</span>
                  )}
                </div>
              </div>
              {(g.eventName || g.note) && (
                <p className="text-xs text-[#6B5F50]">
                  {[g.eventName, g.note].filter(Boolean).join(" · ")}
                </p>
              )}
              {!monitoringOnly && (
                <div className="flex items-center justify-end gap-1 pt-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => copyLink(g)} className="h-9 rounded-full border-[#E9DDC6] px-3 text-xs">
                    <IconCopy size={14} /> Salin
                  </Button>
                  <Button type="button" variant="ink" size="sm" onClick={() => shareWA(g)} className="h-9 px-3 text-xs">
                    <IconBrandWhatsapp size={14} /> Kirim WA
                  </Button>
                  {qrEnabled && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={qrLoadingId === g.id}
                      onClick={() => void openGuestQr(g)}
                      className="h-9 rounded-full border-[#E9DDC6] px-3 text-xs"
                    >
                      <IconQrcode size={14} /> QR
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEdit(g)}
                    className="flex size-9 items-center justify-center rounded-full text-[#6B5F50] hover:bg-[#F6EEDF]"
                    aria-label={`Ubah ${g.name}`}
                  >
                    <IconPencil size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(g)}
                    className="flex size-9 items-center justify-center rounded-full text-[#6B5F50] hover:bg-[#F6E7E4] hover:text-[#9A3B2E]"
                    aria-label={`Hapus ${g.name}`}
                  >
                    <IconTrash size={17} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        {!filteredGuests.length && (
          <div className="px-6 py-16 text-center text-[#6B5F50]">
            <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-[#F6EEDF] text-[#8A6424]">
              <IconUsers size={26} stroke={1.6} />
            </span>
            <p className="text-[15px]">
              {guests.length
                ? "Tidak ada tamu yang cocok dengan filter atau pencarian ini."
                : monitoringOnly
                  ? "Belum ada tamu yang ditambahkan oleh klien."
                  : "Belum ada tamu di daftar undanganmu."}
            </p>
            {!guests.length && !monitoringOnly && (
              <Button type="button" variant="gold" onClick={openAdd} className="mt-4 h-10 px-5">
                <IconPlus size={16} /> Tambah tamu pertama
              </Button>
            )}
          </div>
        )}
        {filteredGuests.length > 0 && <TablePagination {...guestPagination} className="border-t border-[#F3EBDB] px-4" />}
      </div>

      {/* Add / Edit Guest Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !saving && setDialogOpen(o)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[#EDE3CF] bg-[#FFFDF9] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-(family-name:--font-landing-display) text-2xl font-normal text-[#1F1A14]">
              {editing ? `Ubah Data ${editing.name}` : "Tambah Tamu"}
            </DialogTitle>
            <DialogDescription>
              Lengkapi nama, nomor WhatsApp, dan label tamu agar mudah dibagikan secara personal maupun lewat WA Blast.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="block text-xs font-medium text-[#1F1A14]">Jenis Penerima</span>
                <SelectField
                  value={form.recipientType}
                  onChange={(e) => setForm((f) => ({ ...f, recipientType: e.target.value as "PERSONAL" | "GROUP" }))}
                  aria-label="Jenis Penerima"
                >
                  <option value="PERSONAL">Personal (1 penerima)</option>
                  <option value="GROUP">Grup (lebih dari 1 penerima)</option>
                </SelectField>
                <span className="block text-[11px] text-[#8E8268]">Personal untuk 1 penerima. Grup untuk keluarga/komunitas.</span>
              </label>

              <label className="block space-y-1.5">
                <span className="block text-xs font-medium text-[#1F1A14]">Tipe Tamu</span>
                <SelectField
                  value={form.guestType}
                  onChange={(e) => setForm((f) => ({ ...f, guestType: e.target.value as "REGULAR" | "VIP" }))}
                  aria-label="Tipe Tamu"
                >
                  <option value="REGULAR">Reguler</option>
                  <option value="VIP">VIP (label khusus VIP)</option>
                </SelectField>
                <span className="block text-[11px] text-[#8E8268]">Opsi VIP memberi penanda emas khusus di daftar tamu.</span>
              </label>

              <div className="space-y-1.5">
                <label htmlFor="guest-greeting" className="block text-xs font-medium text-[#1F1A14]">
                  Sapaan (opsional)
                </label>
                <Input
                  id="guest-greeting"
                  value={form.greeting}
                  onChange={(e) => setForm((f) => ({ ...f, greeting: e.target.value }))}
                  placeholder="Contoh: Kepada Yth., Bapak/Ibu, Dear"
                  maxLength={40}
                  className="h-10 rounded-xl border-[#E9DDC6] bg-white"
                />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {GREETING_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, greeting: preset }))}
                      className="rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-2.5 py-0.5 text-[11px] text-[#6B5F50] transition hover:border-[#8A6424] hover:text-[#1F1A14]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="block text-xs font-medium text-[#1F1A14]">
                  Nama Tamu <span className="text-[#9A3B2E]">*</span>
                </span>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Budi Santoso"
                  maxLength={120}
                  required
                  className="h-10 rounded-xl border-[#E9DDC6] bg-white"
                />
                <span className="block text-[11px] text-[#8E8268]">Nama yang tampil di sampul undangan tamu.</span>
              </label>

              <div className="space-y-1.5">
                <label htmlFor="guest-phone" className="block text-xs font-medium text-[#1F1A14]">
                  Nomor WhatsApp (opsional)
                </label>
                <PhoneInput
                  id="guest-phone"
                  value={form.phone}
                  onChange={(digits) => setForm((f) => ({ ...f, phone: digits }))}
                  className="h-10 rounded-xl border-[#E9DDC6] bg-white"
                />
                <span className="block text-[11px] text-[#8E8268]">Masukkan nomor WA aktif tanpa kode negara; otomatis dilengkapi kode negara.</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#1F1A14]">Label Grup (opsional)</label>
                <SelectField
                  value={form.labelMode}
                  onChange={(e) => setForm((f) => ({ ...f, labelMode: e.target.value }))}
                  aria-label="Label Grup"
                >
                  <option value="">Tanpa label</option>
                  {knownLabels.map((lbl) => (
                    <option key={lbl} value={lbl}>
                      {lbl}
                    </option>
                  ))}
                  <option value={CUSTOM_LABEL_VALUE}>+ Buat label baru…</option>
                </SelectField>
                {form.labelMode === CUSTOM_LABEL_VALUE ? (
                  <Input
                    value={form.customLabel}
                    onChange={(e) => setForm((f) => ({ ...f, customLabel: e.target.value }))}
                    placeholder="Ketik nama label baru (cth: Rekan SMA)"
                    maxLength={40}
                    className="mt-2 h-10 rounded-xl border-[#E9DDC6] bg-white"
                  />
                ) : (
                  <span className="block text-[11px] text-[#8E8268]">Kelompokkan tamu seperti Keluarga, Teman Kantor, Blast, atau Manual.</span>
                )}
              </div>

              <label className="block space-y-1.5">
                <span className="block text-xs font-medium text-[#1F1A14]">Jumlah Tamu</span>
                <NumberInput
                  max={20}
                  maxDigits={2}
                  placeholder="1"
                  value={String(form.maxGuests)}
                  onValueChange={(maxGuests) => setForm((f) => ({ ...f, maxGuests }))}
                  className="h-10 rounded-xl border-[#E9DDC6] bg-white"
                />
                <span className="block text-[11px] text-[#8E8268]">Batas maksimal jumlah tamu untuk 1 undangan ini.</span>
              </label>

              <label className="block space-y-1.5">
                <span className="block text-xs font-medium text-[#1F1A14]">RSVP</span>
                <SelectField
                  value={form.rsvpEnabled}
                  onChange={(e) => setForm((f) => ({ ...f, rsvpEnabled: e.target.value as "yes" | "no" }))}
                  aria-label="Status RSVP tamu"
                >
                  <option value="yes">Aktif — tamu bisa mengisi RSVP</option>
                  <option value="no">Nonaktif</option>
                </SelectField>
                <span className="block text-[11px] text-[#8E8268]">Jika aktif, tamu dapat mengonfirmasi kehadiran di undangan.</span>
              </label>

              <label className="block space-y-1.5">
                <span className="block text-xs font-medium text-[#1F1A14]">Acara</span>
                <SelectField
                  value={form.eventName}
                  onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
                  aria-label="Acara"
                >
                  {effectiveEventOptions.map((ev) => (
                    <option key={ev} value={ev}>
                      {ev}
                    </option>
                  ))}
                </SelectField>
                <span className="block text-[11px] text-[#8E8268]">Pilih sesi acara yang ditujukan untuk tamu ini.</span>
              </label>

              <label className="block space-y-1.5">
                <span className="block text-xs font-medium text-[#1F1A14]">Catatan (opsional)</span>
                <Input
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Contoh: Meja VIP 2, rekan kerja ayah"
                  maxLength={200}
                  className="h-10 rounded-xl border-[#E9DDC6] bg-white"
                />
                <span className="block text-[11px] text-[#8E8268]">Keterangan tambahan untuk panitia atau catatan pribadi.</span>
              </label>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" disabled={saving} onClick={() => setDialogOpen(false)} className="rounded-full border-[#E9DDC6]">
                Batal
              </Button>
              <Button type="submit" variant="gold" disabled={saving} className="h-10 px-6">
                {saving ? "Menyimpan…" : editing ? "Simpan Perubahan" : "Simpan Tamu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent className="border-[#EDE3CF] bg-[#FFFDF9] text-[#1A1510] sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-(family-name:--font-landing-display) text-2xl font-normal text-[#1A1510]">
              Hapus tamu?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#5E5446]">
              Nama tamu &ldquo;{deleteTarget?.name}&rdquo; akan dihapus dari daftar tamu undangan Anda.
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
                if (deleteTarget) void deleteGuest(deleteTarget.id);
              }}
              className="rounded-full bg-[#9A3B2E] text-white hover:bg-[#823025]"
            >
              {deleting ? "Menghapus…" : "Ya, hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Check-in modal for manual share (when qrCheckIn is active) */}
      <Dialog open={Boolean(qrTarget)} onOpenChange={(o) => !o && !qrBusy && setQrTarget(null)}>
        <DialogContent className="border-[#EDE3CF] bg-[#FFFDF9] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-(family-name:--font-landing-display) text-2xl font-normal text-[#1F1A14]">
              QR Check-in untuk {qrTarget ? displayRecipient(qrTarget) : ""}
            </DialogTitle>
            <DialogDescription>
              Pilih tampilan kartu QR, lalu kirim bersama tautan undangan ke WhatsApp tamu atau unduh gambarnya.
            </DialogDescription>
          </DialogHeader>
          {qrTarget?.checkInToken && (
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Bentuk QR">
              {(
                [
                  ["card", "Kartu undangan mini"],
                  ["standard", "QR standar"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={qrKind === k}
                  onClick={() => setQrKind(k)}
                  className={`flex flex-col items-center gap-3 rounded-2xl border p-3 transition ${
                    qrKind === k ? "border-[#8A6424] ring-2 ring-[#8A6424]/20" : "border-[#E9DDC6] hover:border-[#8A6424]"
                  }`}
                >
                  <span
                    className={`flex h-44 w-full items-center justify-center rounded-xl ${
                      k === "card" ? "bg-[linear-gradient(180deg,#FCF8F1,#F3E8D3)]" : "bg-[#F6EEDF]"
                    }`}
                  >
                    {k === "card" ? (
                      <span className="flex flex-col items-center gap-1 rounded-lg border border-[#8A6424]/40 bg-[#FCF8F1] px-3 py-2">
                        <span className="text-[8px] tracking-[0.2em] text-[#8A6424]">THE WEDDING OF</span>
                        <span className="max-w-28 truncate font-(family-name:--font-landing-display) text-sm text-[#1F1A14]">
                          {qrCardMeta.couple}
                        </span>
                        <CheckInQr token={qrTarget.checkInToken ?? ""} size={76} />
                      </span>
                    ) : (
                      <CheckInQr token={qrTarget.checkInToken ?? ""} size={130} />
                    )}
                  </span>
                  <span className="text-sm font-medium text-[#1F1A14]">{label}</span>
                </button>
              ))}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setQrTarget(null)} disabled={qrBusy} className="rounded-full">
              Batal
            </Button>
            <Button type="button" variant="outline" disabled={qrBusy} onClick={() => void downloadGuestQr()} className="h-10 rounded-full px-5">
              <IconDownload size={16} /> Unduh
            </Button>
            <Button type="button" variant="gold" disabled={qrBusy} onClick={() => void sendGuestQrOnWhatsapp()} className="h-10 px-5">
              <IconBrandWhatsapp size={16} /> Kirim WA + QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
