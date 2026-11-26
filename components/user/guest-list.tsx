"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconBrandWhatsapp,
  IconCheck,
  IconCopy,
  IconCrown,
  IconEyeCheck,
  IconPencil,
  IconPlus,
  IconSearch,
  IconSend,
  IconTrash,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
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
}

interface GuestListProps {
  initialGuests: GuestItem[];
  invitationSlug: string;
  coupleName: string;
  eventOptions: string[];
  userPlan: PlanType;
  extraGuestQuota?: number;
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
const shortDateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

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

      {/* Quick share general link strip */}
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
              placeholder="Cari nama, nomor WA, label, acara, atau catatan…"
              className="w-full min-w-0 bg-transparent text-sm outline-none"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {isLimitReached && (
              <Link href="/upgrade" className={buttonVariants({ variant: "outline", className: "h-10 rounded-full border-[#E9DDC6] text-[#8A6424]" })}>
                Tambah kuota tamu
              </Link>
            )}
            <Button type="button" variant="gold" onClick={openAdd} disabled={isLimitReached} className="h-10 px-5">
              <IconUserPlus size={16} /> {isLimitReached ? "Batas tamu tercapai" : "Tambah Tamu"}
            </Button>
          </div>
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
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-[#8E8268]">
                <th className="px-4 py-3 font-medium">Tamu</th>
                <th className="px-4 py-3 font-medium">Status Undangan</th>
                <th className="px-4 py-3 font-medium">Label & Acara</th>
                <th className="px-4 py-3 font-medium">Kuota & RSVP</th>
                <th className="px-4 py-3 font-medium">Catatan</th>
                <th className="px-4 py-3 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((g) => {
                const directWa = waLink(g.phone);
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
                          {directWa ? (
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
                          className="flex size-9 items-center justify-center rounded-full text-[#3F6B3A] transition-colors hover:bg-[#EEF4EA]"
                          title={g.phone ? `Kirim WA ke +${g.phone}` : "Bagikan via WhatsApp"}
                          aria-label={`Kirim WA untuk ${g.name}`}
                        >
                          <IconBrandWhatsapp size={18} />
                        </button>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="divide-y divide-[#F3EBDB] md:hidden">
          {filteredGuests.map((g) => (
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
                  <p className="mt-0.5 text-xs text-[#6B5F50]">
                    {g.phone ? `+${g.phone}` : "Belum ada No. WA"} · Maks. {g.maxGuests} orang
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
              <div className="flex items-center justify-end gap-1 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => copyLink(g)} className="h-9 rounded-full border-[#E9DDC6] px-3 text-xs">
                  <IconCopy size={14} /> Salin
                </Button>
                <Button type="button" variant="ink" size="sm" onClick={() => shareWA(g)} className="h-9 px-3 text-xs">
                  <IconBrandWhatsapp size={14} /> Kirim WA
                </Button>
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
            </li>
          ))}
        </ul>

        {!filteredGuests.length && (
          <div className="px-6 py-16 text-center text-[#6B5F50]">
            <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-[#F6EEDF] text-[#8A6424]">
              <IconUsers size={26} stroke={1.6} />
            </span>
            <p className="text-[15px]">
              {guests.length ? "Tidak ada tamu yang cocok dengan filter atau pencarian ini." : "Belum ada tamu di daftar undanganmu."}
            </p>
            {!guests.length && (
              <Button type="button" variant="gold" onClick={openAdd} className="mt-4 h-10 px-5">
                <IconPlus size={16} /> Tambah tamu pertama
              </Button>
            )}
          </div>
        )}
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
    </div>
  );
}
