"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconBrandWhatsapp,
  IconBuildingStore,
  IconCheck,
  IconCopy,
  IconEdit,
  IconExternalLink,
  IconLink,
  IconLoader2,
  IconPalette,
  IconPlus,
  IconSearch,
  IconShare,
  IconShieldCheck,
  IconUsers,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { DatePickerField } from "@/components/common/date-time-picker";
import { PhoneInput } from "@/components/common/phone-input";
import { normalizePhoneDigits, waLink } from "@/lib/phone";
import { AGENCY_PACKS, PLAN_LIMITS, type PlanType } from "@/lib/limits";

export interface AgencyProfileData {
  id: string;
  name: string | null;
  email: string;
  accountType: string;
  agencyName: string | null;
  agencyWhatsapp: string | null;
  agencyInstagram: string | null;
  agencyLogo: string | null;
  agencyVerified: boolean;
  agencyQuota: number;
  agencyQuotaExpiresAt: string | null;
  aiCredits: number;
}

export interface AgencyInvitationRow {
  id: string;
  slug: string | null;
  title: string;
  weddingDate: string | null;
  templateSlug: string | null;
  plan: string;
  planExpiresAt: string | null;
  isPublic: boolean;
  views: number;
  clientName: string | null;
  clientWhatsapp: string | null;
  clientEditToken: string | null;
  updatedAt: string;
  _count: { guests: number; rsvps: number; messages: number };
}

export interface AgencyReferralInfo {
  code: string;
  signups: number;
  conversions: number;
  totalCommission: number;
}

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const dateStr = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "-";

export function AgencyHub({
  initialAgency,
  initialInvitations,
  initialReferral,
  appUrl,
}: {
  initialAgency: AgencyProfileData;
  initialInvitations: AgencyInvitationRow[];
  initialReferral: AgencyReferralInfo;
  appUrl: string;
}) {
  const router = useRouter();
  const [agency, setAgency] = useState(initialAgency);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [savingProfile, setSavingProfile] = useState(false);

  // Profile form
  const [agencyName, setAgencyName] = useState(initialAgency.agencyName || "");
  const [agencyWhatsapp, setAgencyWhatsapp] = useState(normalizePhoneDigits(initialAgency.agencyWhatsapp));
  const [agencyInstagram, setAgencyInstagram] = useState(initialAgency.agencyInstagram || "");
  const [agencyLogo, setAgencyLogo] = useState(initialAgency.agencyLogo || "");

  // Filter client invitations
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PAID" | "FREE">("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Create client invitation modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientWa, setNewClientWa] = useState("");
  const [newDate, setNewDate] = useState("");
  // Opt-in: a quota is paid stock, so never spend it without an explicit tick
  const [useQuotaOnCreate, setUseQuotaOnCreate] = useState(false);
  const [genLinkOnCreate, setGenLinkOnCreate] = useState(true);
  const [creating, setCreating] = useState(false);

  const isAgency = agency.accountType === "AGENCY";
  const quotaExpired = Boolean(agency.agencyQuotaExpiresAt && new Date(agency.agencyQuotaExpiresAt).getTime() <= Date.now());
  const usableQuota = quotaExpired ? 0 : agency.agencyQuota;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invitations.filter((inv) => {
      if (filter === "PAID" && inv.plan === "FREE") return false;
      if (filter === "FREE" && inv.plan !== "FREE") return false;
      if (!q) return true;
      return (
        inv.title.toLowerCase().includes(q) ||
        (inv.clientName ?? "").toLowerCase().includes(q) ||
        (inv.slug ?? "").toLowerCase().includes(q)
      );
    });
  }, [invitations, search, filter]);

  const totalRsvps = invitations.reduce((s, inv) => s + inv._count.rsvps, 0);
  const activeCount = invitations.filter((inv) => inv.plan !== "FREE").length;

  const referralUrl = `${appUrl}/?ref=${initialReferral.code}`;

  const saveAgencyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/agency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyName, agencyWhatsapp, agencyInstagram, agencyLogo }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.message || "Gagal menyimpan profil mitra");
        return;
      }
      setAgency((prev) => ({ ...prev, ...d.agency }));
      toast.success(isAgency ? "Profil mitra diperbarui" : "Akun Mitra aktif! Anda siap mengelola klien.");
      router.refresh();
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateClientInv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return toast.error("Judul acara wajib diisi");
    setCreating(true);
    try {
      const res = await fetch("/api/user/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          clientName: newClientName.trim() || undefined,
          clientWhatsapp: newClientWa.trim() || undefined,
          weddingDate: newDate || undefined,
          activateWithQuota: usableQuota > 0 && useQuotaOnCreate,
          generateClientLink: genLinkOnCreate,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.message || "Gagal membuat undangan klien");
        return;
      }
      setInvitations((prev) => [d.invitation, ...prev]);
      if (usableQuota > 0 && useQuotaOnCreate) {
        setAgency((prev) => ({ ...prev, agencyQuota: Math.max(0, prev.agencyQuota - 1) }));
      }
      setCreateOpen(false);
      setNewTitle("");
      setNewClientName("");
      setNewClientWa("");
      setNewDate("");
      toast.success("Undangan klien berhasil dibuat");
      router.refresh();
    } finally {
      setCreating(false);
    }
  };

  const activateWithQuota = async (inv: AgencyInvitationRow) => {
    setBusyId(inv.id);
    try {
      const res = await fetch(`/api/user/invitations/${inv.id}/activate-quota`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.message || "Gagal mengaktifkan undangan");
        return;
      }
      setInvitations((prev) =>
        prev.map((x) =>
          x.id === inv.id
            ? { ...x, plan: d.invitation.plan, planExpiresAt: d.invitation.planExpiresAt, isPublic: true }
            : x,
        ),
      );
      setAgency((prev) => ({ ...prev, agencyQuota: d.remainingQuota }));
      toast.success(`“${inv.title}” aktif setara Premium menggunakan 1 kuota mitra!`);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const ensureClientLink = async (inv: AgencyInvitationRow, rotate = false) => {
    setBusyId(inv.id);
    try {
      const res = await fetch(`/api/user/invitations/${inv.id}/client-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rotate }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.message || "Gagal membuat link klien");
        return;
      }
      setInvitations((prev) =>
        prev.map((x) => (x.id === inv.id ? { ...x, clientEditToken: d.clientEditToken } : x)),
      );
      const url = `${appUrl}/isi-data/${d.clientEditToken}`;
      await navigator.clipboard?.writeText(url).catch(() => {});
      toast.success("Link pengisian data klien siap & disalin!");
    } finally {
      setBusyId(null);
    }
  };

  const openInWorkspace = async (invId: string, href: string) => {
    setBusyId(invId);
    try {
      const res = await fetch("/api/user/invitations/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: invId }),
      });
      if (!res.ok) throw new Error();
      router.push(href);
      router.refresh();
    } catch {
      toast.error("Gagal membuka undangan");
    } finally {
      setBusyId(null);
    }
  };

  const copyText = (text: string, message: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(message);
  };

  if (!isAgency) {
    return (
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="w-full space-y-10">
          <header className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A6424]">Program Mitra B2B</p>
            <h1 className="font-serif text-4xl font-medium leading-tight text-[#1A1510] sm:text-5xl">
              Kelola banyak undangan klien dalam satu akun
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[#5E5446] sm:text-base">
              Dirancang untuk Wedding Organizer, MUA, fotografer, dan percetakan. Aktifkan mode Mitra dalam 1 langkah — tanpa tunggu persetujuan berhari-hari.
            </p>
          </header>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
            <div className="space-y-6">
              <section className="rounded-2xl border border-[#EDE3CF] bg-white p-6">
                <h2 className="font-serif text-2xl font-medium text-[#1A1510]">Kenapa lebih mudah jadi Mitra?</h2>
                <ul className="mt-4 grid gap-3 text-sm text-[#40372B] sm:grid-cols-2">
                  {[
                    "Harga grosir mulai Rp 19,9rb per undangan Premium",
                    "Link isi data klien tanpa klien harus bikin akun",
                    "Nama brand / studio tampil di footer undangan",
                    "Aktifkan undangan klien cukup 1 klik pakai kuota",
                    "Dashboard terpusat untuk pantau semua RSVP klien",
                    "Komisi referral 15% jika klien membeli mandiri",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <IconCheck size={16} className="mt-0.5 shrink-0 text-[#8A6424]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-2xl font-medium text-[#1A1510]">Pilihan Paket Kuota Mitra</h3>
                  <Link href="/upgrade?pilih=mitra#kuota-mitra" className="text-xs font-medium text-[#8A6424] hover:underline">
                    Beli kuota →
                  </Link>
                </div>
                <div className="grid gap-3.5 sm:grid-cols-3">
                  {AGENCY_PACKS.map((p) => (
                    <div
                      key={p.id}
                      className={`rounded-2xl border p-4 ${p.popular ? "border-[#8A6424] bg-[#FCF9F2]" : "border-[#EDE3CF] bg-white"}`}
                    >
                      <p className="font-serif text-xl font-medium text-[#1A1510]">{p.label}</p>
                      <p className="mt-1 text-xs text-[#6B5F50]">{p.tagline}</p>
                      <p className="mt-4 font-serif text-2xl font-semibold tabular-nums text-[#1A1510]">{rupiah(p.price)}</p>
                      <p className="text-[11px] text-[#8A6424]">{p.quota} undangan Premium · 12 bulan</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="rounded-2xl border border-[#EDE3CF] bg-white p-6 shadow-xs">
              <form onSubmit={saveAgencyProfile} className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5E8CA] text-[#8A6424]">
                    <IconBuildingStore size={20} />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6424]">Aktivasi Instan</p>
                    <h2 className="font-serif text-xl font-medium text-[#1A1510]">Profil Usaha Mitra</h2>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="onboard-name">Nama Usaha / Studio / WO</Label>
                  <Input
                    id="onboard-name"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Contoh: Kirana Wedding Organizer"
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="onboard-wa">WhatsApp Bisnis</Label>
                  <PhoneInput id="onboard-wa" value={agencyWhatsapp} onChange={setAgencyWhatsapp} required className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="onboard-ig">Instagram (opsional)</Label>
                  <Input
                    id="onboard-ig"
                    value={agencyInstagram}
                    onChange={(e) => setAgencyInstagram(e.target.value)}
                    placeholder="@kirana.wedding"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Logo Usaha / WO (opsional — tampil di halaman depan)</Label>
                  <ImageUploadField value={agencyLogo} onChange={setAgencyLogo} aspect="aspect-[16/9]" fit="contain" />
                </div>

                <Button type="submit" disabled={savingProfile} className="h-11 w-full rounded-full bg-[#1A1510] text-[#FCF8F1] hover:bg-[#2B241B]">
                  {savingProfile && <IconLoader2 size={16} className="mr-2 animate-spin" />}
                  Aktifkan Mode Mitra Sekarang
                </Button>
                <p className="text-center text-xs text-[#6B5F50]">Gratis aktivasi · Langsung dapat dashboard klien & link referral 15%.</p>
              </form>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
      <div className="w-full space-y-8">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A6424]">Workspace Mitra B2B</p>
              {agency.agencyVerified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#E6D5B2] bg-[#F7F0E1] px-2.5 py-0.5 text-[11px] font-medium text-[#5C431A]">
                  <IconShieldCheck size={13} className="text-[#8A6424]" /> Mitra Terverifikasi
                </span>
              )}
            </div>
            <h1 className="font-serif text-4xl font-medium text-[#1A1510]">{agency.agencyName || "Dashboard Mitra"}</h1>
            <p className="text-sm text-[#6B5F50]">
              Kelola undangan klien, kirim link isi data tanpa login, dan aktifkan undangan 1 klik dengan kuota grosir.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/upgrade?pilih=mitra#kuota-mitra"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#E9DDC6] bg-white px-5 text-sm font-medium text-[#1A1510] hover:bg-[#FCF8F1]"
            >
              Beli Kuota Mitra
            </Link>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 rounded-full bg-[#1A1510] px-5 text-sm font-medium text-[#FCF8F1] hover:bg-[#2B241B]">
                  <IconPlus size={17} className="mr-1.5" /> Undangan Klien Baru
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateClientInv} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-2xl">Buat Undangan Klien</DialogTitle>
                    <DialogDescription>Buat proyek undangan klien baru dan opsional langsung aktifkan atau buat link pengisian data.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-1.5">
                    <Label htmlFor="client-title">Judul Undangan / Pasangan</Label>
                    <Input
                      id="client-title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Mis. Pernikahan Raka & Dinda"
                      required
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="client-name">Nama Klien (opsional)</Label>
                      <Input id="client-name" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="Dinda Putri" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="client-wa">WA Klien (opsional)</Label>
                      <PhoneInput id="client-wa" value={newClientWa} onChange={setNewClientWa} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="client-date">Tanggal Acara (opsional)</Label>
                    <DatePickerField id="client-date" value={newDate} onChange={setNewDate} />
                  </div>
                  <div className="space-y-2 rounded-xl border border-[#EDE3CF] bg-[#FCF8F1] p-3.5 text-sm">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={genLinkOnCreate}
                        onChange={(e) => setGenLinkOnCreate(e.target.checked)}
                        className="h-4 w-4 accent-[#1A1510]"
                      />
                      <span>Buat link agar klien bisa isi data sendiri (tanpa login)</span>
                    </label>
                    <label className={`flex items-center gap-2.5 ${usableQuota > 0 ? "cursor-pointer" : "opacity-50"}`}>
                      <input
                        type="checkbox"
                        disabled={usableQuota < 1}
                        checked={usableQuota > 0 && useQuotaOnCreate}
                        onChange={(e) => setUseQuotaOnCreate(e.target.checked)}
                        className="h-4 w-4 accent-[#1A1510]"
                      />
                      <span>Langsung aktifkan dengan 1 kuota Mitra (sisa {usableQuota}). Biarkan kosong untuk simpan sebagai draf dulu.</span>
                    </label>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={creating} className="rounded-full bg-[#1A1510] text-[#FCF8F1] hover:bg-[#2B241B]">
                      {creating && <IconLoader2 size={15} className="mr-2 animate-spin" />}
                      Buat Undangan
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Top KPI strip */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-[#1A1510] p-5 text-[#FCF8F1]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#D9B56A]">Sisa Kuota Mitra</p>
            <p className="mt-2 font-serif text-4xl lining-nums">{usableQuota}</p>
            <p className="mt-1 text-xs text-[#D9CBAE]">
              {agency.agencyQuotaExpiresAt ? `Berlaku s.d. ${dateStr(agency.agencyQuotaExpiresAt)}` : "Beli paket Mitra untuk tambah kuota"}
            </p>
          </div>
          <div className="rounded-2xl border border-[#EDE3CF] bg-white p-5">
            <p className="text-xs text-[#6B5F50]">Undangan Klien</p>
            <p className="mt-2 font-serif text-4xl lining-nums text-[#1A1510]">
              {activeCount} <span className="text-lg text-[#8C8272]">/ {invitations.length} aktif</span>
            </p>
            <p className="mt-1 text-xs text-[#6B5F50]">Semua proyek undangan di akun Anda</p>
          </div>
          <div className="rounded-2xl border border-[#EDE3CF] bg-white p-5">
            <p className="text-xs text-[#6B5F50]">Total RSVP Terkumpul</p>
            <p className="mt-2 font-serif text-4xl lining-nums text-[#1A1510]">{totalRsvps}</p>
            <p className="mt-1 text-xs text-[#6B5F50]">Kredit AI tersedia: {agency.aiCredits}</p>
          </div>
          <div className="rounded-2xl border border-[#EDE3CF] bg-white p-5">
            <p className="text-xs text-[#6B5F50]">Komisi Referral (15%)</p>
            <p className="mt-2 font-serif text-3xl lining-nums text-[#1A1510]">{rupiah(initialReferral.totalCommission)}</p>
            <Link href="/dompet" className="mt-1 inline-flex min-h-9 items-center text-xs font-medium text-[#8A6424] hover:underline">
              Kelola Dompet & Referral →
            </Link>
          </div>
        </section>

        {/* Client Invitations List */}
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8272]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="search"
                aria-label="Cari undangan klien"
                placeholder="Cari nama klien, judul, atau slug..."
                className="h-11 rounded-full border-[#E9DDC6] bg-white pl-10"
              />
            </div>
            <div className="flex gap-1.5">
              {(
                [
                  ["ALL", "Semua"],
                  ["PAID", "Aktif"],
                  ["FREE", "Pratinjau"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFilter(k)}
                  className={`h-10 rounded-full px-4 text-xs font-medium transition ${
                    filter === k ? "bg-[#1A1510] text-[#FCF8F1]" : "border border-[#E9DDC6] bg-white text-[#5E5446] hover:bg-[#FCF8F1]"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D8CFC0] bg-white/70 p-10 text-center text-sm text-[#6B5F50]">
              Belum ada undangan klien yang cocok. Klik <strong>Undangan Klien Baru</strong> untuk mulai.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filtered.map((inv) => {
                const isPaid = inv.plan !== "FREE";
                const limits = PLAN_LIMITS[(inv.plan as PlanType) ?? "FREE"];
                const clientFormUrl = inv.clientEditToken ? `${appUrl}/isi-data/${inv.clientEditToken}` : null;
                const clientWaLink = clientFormUrl
                  ? waLink(
                      inv.clientWhatsapp,
                      `Halo${inv.clientName ? ` ${inv.clientName}` : ""}, silakan lengkapi data mempelai, jadwal acara, dan rekening amplop untuk undangan "${inv.title}" lewat tautan berikut (tanpa perlu login):\n${clientFormUrl}`,
                    )
                  : null;

                return (
                  <article key={inv.id} className="flex flex-col justify-between gap-4 rounded-2xl border border-[#EDE3CF] bg-white p-5 shadow-xs">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                              isPaid ? "border border-[#E6D5B2] bg-[#F7F0E1] text-[#5C431A]" : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            {isPaid ? `Aktif · ${limits.name}` : "Mode Pratinjau"}
                          </span>
                          {inv.clientName && (
                            <span className="rounded-full bg-[#FCF8F1] px-2.5 py-0.5 text-[11px] text-[#5E5446]">
                              Klien: {inv.clientName}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#8C8272]">{dateStr(inv.weddingDate)}</span>
                      </div>

                      <div>
                        <h3 className="font-serif text-2xl font-medium text-[#1A1510]">{inv.title}</h3>
                        <p className="text-xs text-[#6B5F50]">/{inv.slug || "-"}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#F3EBDB] bg-[#FCF8F1] px-3 py-2 text-center text-xs">
                        <div>
                          <span className="text-[#6B5F50]">Dilihat</span>
                          <p className="font-serif text-lg tabular-nums text-[#1A1510]">{inv.views}</p>
                        </div>
                        <div>
                          <span className="text-[#6B5F50]">Tamu</span>
                          <p className="font-serif text-lg tabular-nums text-[#1A1510]">{inv._count.guests}</p>
                        </div>
                        <div>
                          <span className="text-[#6B5F50]">RSVP</span>
                          <p className="font-serif text-lg tabular-nums text-[#1A1510]">{inv._count.rsvps}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 border-t border-[#F3EBDB] pt-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busyId === inv.id}
                          onClick={() => void openInWorkspace(inv.id, "/editor")}
                          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#1A1510] px-4 text-xs font-medium text-[#FCF8F1] hover:bg-[#2B241B] disabled:opacity-50"
                        >
                          <IconEdit size={15} /> Edit
                        </button>
                        <button
                          type="button"
                          disabled={busyId === inv.id}
                          onClick={() => void openInWorkspace(inv.id, "/desain-ai")}
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#E9DDC6] px-3.5 text-xs font-medium text-[#1A1510] hover:bg-[#FCF8F1]"
                        >
                          <IconPalette size={15} /> Desain
                        </button>
                        <button
                          type="button"
                          disabled={busyId === inv.id}
                          onClick={() => void openInWorkspace(inv.id, "/manajemen-tamu")}
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#E9DDC6] px-3.5 text-xs font-medium text-[#1A1510] hover:bg-[#FCF8F1]"
                        >
                          <IconUsers size={15} /> Tamu
                        </button>
                        {inv.slug && (
                          <a
                            href={`/${inv.slug}${!isPaid || !inv.isPublic ? "?preview=1" : ""}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-10 items-center justify-center gap-1 rounded-full border border-[#E9DDC6] px-3.5 text-xs font-medium text-[#1A1510] hover:bg-[#FCF8F1]"
                          >
                            <IconExternalLink size={14} /> Lihat
                          </a>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {clientFormUrl ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => copyText(clientFormUrl, "Link pengisian data klien disalin")}
                              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E6D5B2] bg-[#F7F0E1] px-3 text-xs font-medium text-[#5C431A] hover:bg-[#ECE2CE]"
                            >
                              <IconLink size={14} /> Salin Link Isi Data Klien
                            </button>
                            {clientWaLink && (
                              <a
                                href={clientWaLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                              >
                                <IconBrandWhatsapp size={14} /> Kirim ke Klien
                              </a>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={busyId === inv.id}
                            onClick={() => void ensureClientLink(inv)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E9DDC6] px-3 text-xs font-medium text-[#5E5446] hover:bg-[#FCF8F1] hover:text-[#1A1510]"
                          >
                            <IconLink size={14} /> Buat Link Isi Data Klien
                          </button>
                        )}

                        {!isPaid &&
                          (usableQuota > 0 ? (
                            <button
                              type="button"
                              disabled={busyId === inv.id}
                              onClick={() => void activateWithQuota(inv)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#8A6424] px-3.5 text-xs font-semibold text-white hover:bg-[#755925] disabled:opacity-50"
                            >
                              {busyId === inv.id ? <IconLoader2 size={14} className="animate-spin" /> : <IconShare size={14} />}
                              Aktifkan (1 Kuota)
                            </button>
                          ) : (
                            <Link
                              href="/upgrade?pilih=mitra#kuota-mitra"
                              className="inline-flex h-9 items-center gap-1 rounded-full border border-[#D9B56A] px-3 text-xs font-medium text-[#8A6424] hover:bg-[#FCF5E6]"
                            >
                              Beli Kuota
                            </Link>
                          ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Branding & Referral shortcut */}
        <section className="grid gap-6 xl:grid-cols-2">
          <form onSubmit={saveAgencyProfile} className="space-y-4 rounded-2xl border border-[#EDE3CF] bg-white p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6424]">Branding Footer</p>
              <h2 className="mt-1 font-serif text-2xl font-medium text-[#1A1510]">Identitas Mitra di Undangan</h2>
              <p className="text-xs text-[#6B5F50]">Nama usaha & Instagram Anda tampil di bagian penutup undangan klien.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="edit-agency-name">Nama Usaha</Label>
                <Input id="edit-agency-name" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} required className="h-10" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-agency-wa">WhatsApp Bisnis</Label>
                <PhoneInput id="edit-agency-wa" value={agencyWhatsapp} onChange={setAgencyWhatsapp} required className="h-10" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-agency-ig">Instagram</Label>
              <Input id="edit-agency-ig" value={agencyInstagram} onChange={(e) => setAgencyInstagram(e.target.value)} placeholder="@studio.anda" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Logo Usaha / WO (tampil otomatis di landing page SatuMoment)</Label>
              <ImageUploadField value={agencyLogo} onChange={setAgencyLogo} aspect="aspect-[16/9]" fit="contain" />
            </div>
            <Button type="submit" disabled={savingProfile} className="h-10 rounded-full bg-[#1A1510] px-5 text-xs font-medium text-[#FCF8F1] hover:bg-[#2B241B]">
              {savingProfile && <IconLoader2 size={14} className="mr-2 animate-spin" />}
              Simpan Identitas Mitra
            </Button>
          </form>

          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#EDE3CF] bg-[#FFFDF9] p-6">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6424]">Link Referral Mitra</p>
              <h2 className="font-serif text-2xl font-medium text-[#1A1510]">Klien bayar sendiri? Anda tetap dapat 15%</h2>
              <p className="text-xs leading-relaxed text-[#5E5446]">
                Bagikan kode <strong>{initialReferral.code}</strong> ke pasangan atau vendor lain. Pembeli langsung hemat 10% (maks Rp15rb), dan komisi 15% otomatis masuk ke Dompet Anda.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-10 flex-1 items-center rounded-xl border border-[#E9DDC6] bg-white px-3 text-xs text-[#40372B]">
                <span className="truncate">{referralUrl}</span>
              </div>
              <button
                type="button"
                onClick={() => copyText(referralUrl, "Link referral disalin")}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#1A1510] px-4 text-xs font-medium text-[#FCF8F1]"
              >
                <IconCopy size={14} /> Salin Link
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Buat undangan pernikahan digital di SatuMoment — pakai kode referral ${initialReferral.code} atau buka ${referralUrl} untuk diskon 10% langsung!`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-xs font-medium text-emerald-800"
              >
                <IconBrandWhatsapp size={15} /> Bagikan
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
