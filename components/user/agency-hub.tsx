"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconBrandWhatsapp,
  IconBuildingStore,
  IconChartBar,
  IconCheck,
  IconLock,
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { DatePickerField } from "@/components/common/date-time-picker";
import { PhoneInput } from "@/components/common/phone-input";
import { normalizePhoneDigits, waLink } from "@/lib/phone";
import { MitraApplicationForm } from "@/components/common/mitra-application-form";
import { ClientAccountDialog, ClientLoginCard } from "@/components/user/client-account-dialog";
import { AGENCY_PACKS, MITRA_BONUS_EVERY, PLAN_LIMITS, type PlanType } from "@/lib/limits";

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
  paidPlanClients: number;
  bonusEarned: number;
  totalCommission: number;
}

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const dateStr = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "-";

export function AgencyHub({
  initialAgency,
  initialInvitations,
  initialReferral,
  appUrl,
  application = null,
  adminWhatsapp = null,
}: {
  initialAgency: AgencyProfileData;
  initialInvitations: AgencyInvitationRow[];
  initialReferral: AgencyReferralInfo;
  appUrl: string;
  /** Latest mitra application (shown while this account is not a mitra yet) */
  application?: { status: string; createdAt: string; adminNote: string | null } | null;
  adminWhatsapp?: string | null;
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

  // Filter & paginate client invitations table
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PAID" | "FREE">("ALL");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Create client invitation modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientWa, setNewClientWa] = useState("");
  // Optional client email: creates the client's own login together with the invitation
  const [newClientEmail, setNewClientEmail] = useState("");
  const [createdLogin, setCreatedLogin] = useState<{
    login: { email: string; tempPassword: string | null };
    clientName: string;
    title: string;
    whatsapp: string | null;
  } | null>(null);
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
      toast.success("Profil mitra diperbarui");
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

      let login: { email: string; tempPassword: string | null } | null = null;
      if (newClientEmail.trim()) {
        const clientName = newClientName.trim() || newTitle.trim();
        const ca = await fetch(`/api/user/invitations/${d.invitation.id}/client-account`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: clientName, email: newClientEmail.trim() }),
        });
        const cd = await ca.json().catch(() => ({}));
        if (ca.ok) login = { email: cd.email, tempPassword: cd.tempPassword };
        else toast.error(`Undangan dibuat, tapi akun klien gagal: ${cd.message || "coba lagi lewat tombol Akun Klien"}`);
      }

      if (login) {
        // Keep the dialog open on the login details so the mitra can send them right away
        setCreatedLogin({ login, clientName: newClientName.trim(), title: newTitle.trim(), whatsapp: newClientWa.trim() || null });
      } else {
        setCreateOpen(false);
      }
      setNewTitle("");
      setNewClientName("");
      setNewClientWa("");
      setNewClientEmail("");
      setNewDate("");
      toast.success(login ? "Undangan dan akun klien berhasil dibuat" : "Undangan klien berhasil dibuat");
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
              Untuk wedding organizer, MUA, fotografer, percetakan, maupun reseller perorangan. Kirim pengajuan, admin meninjau dan menghubungimu lewat WhatsApp.
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
                    `Bonus 1 undangan gratis tiap ${MITRA_BONUS_EVERY} klien beli lewat kode Anda`,
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <IconCheck size={16} className="mt-0.5 shrink-0 text-[#8A6424]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-serif text-2xl font-medium text-[#1A1510]">Paket Kuota Mitra</h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D5B2] bg-[#F7F0E1] px-3 py-1 text-xs font-medium text-[#5C431A]">
                    <IconLock size={13} className="text-[#8A6424]" /> Terbuka setelah pengajuan Mitra disetujui
                  </span>
                </div>
                {/* Preview only: packs stay locked until the account is an approved Mitra (the API enforces this too) */}
                <div className="grid gap-3.5 sm:grid-cols-3" aria-disabled="true">
                  {AGENCY_PACKS.map((p) => (
                    <div
                      key={p.id}
                      className="relative cursor-not-allowed select-none rounded-2xl border border-dashed border-[#E3D8C4] bg-[#FAF7F1] p-4 opacity-70"
                    >
                      <IconLock size={15} className="absolute right-4 top-4 text-[#A8977C]" aria-hidden="true" />
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
              <div className="mb-5 flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5E8CA] text-[#8A6424]">
                  <IconBuildingStore size={20} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6424]">Gabung Program Mitra</p>
                  <h2 className="font-serif text-xl font-medium text-[#1A1510]">Ajukan diri jadi Mitra</h2>
                </div>
              </div>
              {application?.status === "PENDING" ? (
                <div className="space-y-2 rounded-xl bg-[#FCF8F1] p-4 text-sm text-[#40372B]">
                  <p className="font-medium text-[#1F1A14]">Pengajuanmu sedang ditinjau admin</p>
                  <p>Dikirim {dateStr(application.createdAt)}. Admin akan menghubungimu lewat WhatsApp.</p>
                </div>
              ) : (
                <>
                  {application?.status === "REJECTED" && (
                    <p className="mb-4 rounded-xl bg-[#F4E6E2] p-3 text-sm text-[#7A2F22]">
                      Pengajuan sebelumnya belum disetujui{application.adminNote ? `: ${application.adminNote}` : "."} Kamu bisa mengajukan ulang.
                    </p>
                  )}
                  <MitraApplicationForm
                    defaultName={agency.name ?? ""}
                    defaultEmail={agency.email}
                    emailLocked
                    adminWhatsapp={adminWhatsapp}
                    onSubmitted={() => router.refresh()}
                  />
                </>
              )}
              <p className="mt-4 text-center text-xs text-[#6B5F50]">
                Mitra disetujui admin. Setelah aktif: dashboard klien, link mitra (bonus kuota tiap {MITRA_BONUS_EVERY} klien), dan kuota grosir.
              </p>
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
              href="/mitra/laporan"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#E9DDC6] bg-white px-5 text-sm font-medium text-[#1A1510] transition hover:border-[#8A6424] hover:bg-[#FCF8F1]"
            >
              <IconChartBar size={16} className="text-[#8A6424]" /> Laporan Penjualan
            </Link>
            <Link
              href="/upgrade?pilih=mitra#kuota-mitra"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#E9DDC6] bg-white px-5 text-sm font-medium text-[#1A1510] transition hover:border-[#8A6424] hover:bg-[#FCF8F1]"
            >
              Beli Kuota Mitra
            </Link>
            <Dialog
              open={createOpen}
              onOpenChange={(v) => {
                setCreateOpen(v);
                if (!v) setCreatedLogin(null);
              }}
            >
              <DialogTrigger asChild>
                <Button className="h-11 rounded-full bg-[#1A1510] px-5 text-sm font-medium text-[#FCF8F1] hover:bg-[#2B241B]">
                  <IconPlus size={17} className="mr-1.5" /> Undangan Klien Baru
                </Button>
              </DialogTrigger>
              <DialogContent>
                {createdLogin ? (
                  <div className="space-y-4">
                    <DialogHeader>
                      <DialogTitle className="font-serif text-2xl">Undangan &amp; akun klien siap</DialogTitle>
                      <DialogDescription>Kirim info login ini ke klien. Klien bisa memilih template, mengedit undangan, serta mengelola tamu, RSVP, ucapan, dan check-in.</DialogDescription>
                    </DialogHeader>
                    <ClientLoginCard
                      created={createdLogin.login}
                      clientName={createdLogin.clientName}
                      invitationTitle={createdLogin.title}
                      clientWhatsapp={createdLogin.whatsapp}
                      appUrl={appUrl}
                    />
                    <DialogFooter>
                      <Button type="button" variant="ink" onClick={() => setCreateOpen(false)}>
                        Selesai
                      </Button>
                    </DialogFooter>
                  </div>
                ) : (
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
                    <Label htmlFor="client-email">Email Klien (opsional)</Label>
                    <Input
                      id="client-email"
                      type="email"
                      inputMode="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      pattern="[^\s@]+@[^\s@]+\.[^\s@]{2,}"
                      title="Masukkan alamat email yang valid, contoh: dinda@email.com"
                      placeholder="dinda@email.com"
                      maxLength={120}
                    />
                    <p className="text-xs text-[#6B5F50]">Isi untuk langsung membuat akun login klien (pilih template, edit undangan, tamu, RSVP, dan check-in).</p>
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
                )}
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
            <p className="text-xs text-[#6B5F50]">Bonus Kuota dari Klien</p>
            <p className="mt-2 font-serif text-4xl lining-nums text-[#1A1510]">
              {initialReferral.bonusEarned} <span className="text-lg text-[#8C8272]">undangan gratis</span>
            </p>
            <p className="mt-1 text-xs text-[#6B5F50]">
              {initialReferral.paidPlanClients} klien membeli lewat kode Anda · {initialReferral.paidPlanClients % MITRA_BONUS_EVERY}/{MITRA_BONUS_EVERY} menuju bonus berikutnya
            </p>
          </div>
        </section>

        {/* Client Invitations Table */}
        {(() => {
          const pages = Math.max(1, Math.ceil(filtered.length / perPage));
          const current = Math.min(page, pages);
          const pageRows = filtered.slice((current - 1) * perPage, current * perPage);
          const paidCount = invitations.filter((i) => i.plan !== "FREE").length;
          const freeCount = invitations.length - paidCount;

          return (
            <section className="overflow-hidden rounded-2xl border border-[#EDE3CF] bg-white shadow-[0_1px_2px_rgba(26,21,16,.04)]">
              {/* Toolbar */}
              <div className="flex flex-col justify-between gap-3 border-b border-[#F3EBDB] p-4 sm:flex-row sm:items-center">
                <div className="relative max-w-sm flex-1">
                  <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8272]" />
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    type="search"
                    aria-label="Cari undangan klien"
                    placeholder="Cari nama klien, judul, atau slug..."
                    className="h-10 rounded-full border-[#E9DDC6] bg-[#FCF8F1] pl-10"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ["ALL", `Semua (${invitations.length})`],
                      ["PAID", `Aktif (${paidCount})`],
                      ["FREE", `Pratinjau (${freeCount})`],
                    ] as const
                  ).map(([k, l]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setFilter(k);
                        setPage(1);
                      }}
                      className={`h-9 rounded-full px-3.5 text-xs font-medium transition ${
                        filter === k
                          ? "bg-[#1A1510] text-[#FCF8F1]"
                          : "border border-[#E9DDC6] bg-white text-[#5E5446] hover:border-[#8A6424] hover:text-[#1A1510]"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="px-6 py-14 text-center text-sm text-[#6B5F50]">
                  Belum ada undangan klien yang cocok. Klik <strong>Undangan Klien Baru</strong> untuk mulai.
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#F3EBDB] bg-[#FCF8F1]/60 text-left text-[11px] uppercase tracking-[0.12em] text-[#8E8268]">
                          <th className="px-4 py-3 font-medium">Undangan &amp; Klien</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium">Tanggal</th>
                          <th className="px-4 py-3 font-medium">Statistik</th>
                          <th className="px-4 py-3 font-medium">Form Klien</th>
                          <th className="px-4 py-3 text-right font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3EBDB]">
                        {pageRows.map((inv) => {
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
                            <tr key={inv.id} className="align-middle transition-colors hover:bg-[#FCF8F1]/70">
                              <td className="px-4 py-3.5">
                                <p className="font-medium text-[#1F1A14]">{inv.title}</p>
                                <p className="mt-0.5 text-xs text-[#6B5F50]">
                                  /{inv.slug || "-"}
                                  {inv.clientName ? ` · Klien: ${inv.clientName}` : ""}
                                </p>
                              </td>
                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                                    isPaid
                                      ? "border border-[#E6D5B2] bg-[#F7F0E1] text-[#5C431A]"
                                      : "bg-amber-50 text-amber-800"
                                  }`}
                                >
                                  {isPaid ? `Aktif · ${limits.name}` : "Pratinjau"}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-4 py-3.5 text-xs text-[#40372B]">
                                {dateStr(inv.weddingDate)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3.5 text-xs tabular-nums text-[#5E5446]">
                                <span title="Dilihat">{inv.views} lihat</span>
                                <span className="mx-1.5 text-[#D9CBAE]">·</span>
                                <span title="Daftar tamu">{inv._count.guests} tamu</span>
                                <span className="mx-1.5 text-[#D9CBAE]">·</span>
                                <span title="RSVP">{inv._count.rsvps} RSVP</span>
                              </td>
                              <td className="px-4 py-3.5">
                                {clientFormUrl ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => copyText(clientFormUrl, "Link pengisian data klien disalin")}
                                      className="inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-full border border-[#E6D5B2] bg-[#F7F0E1] px-2.5 text-xs font-medium text-[#5C431A] transition hover:bg-[#ECE2CE]"
                                    >
                                      <IconLink size={13} /> Salin link
                                    </button>
                                    {clientWaLink && (
                                      <a
                                        href={clientWaLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Kirim link isi data ke WA klien"
                                        aria-label={`Kirim link isi data ${inv.title} ke WhatsApp klien`}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E6D5B2] bg-white text-[#8A6424] transition hover:border-[#8A6424] hover:bg-[#FCF8F1] hover:text-[#1F1A14]"
                                      >
                                        <IconBrandWhatsapp size={15} />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={busyId === inv.id}
                                    onClick={() => void ensureClientLink(inv)}
                                    className="inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-full border border-[#E9DDC6] bg-white px-2.5 text-xs font-medium text-[#5E5446] transition hover:border-[#8A6424] hover:text-[#1F1A14]"
                                  >
                                    <IconLink size={13} /> Buat link
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex flex-wrap items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    disabled={busyId === inv.id}
                                    onClick={() => void openInWorkspace(inv.id, "/editor")}
                                    className="inline-flex h-8 items-center gap-1 rounded-full bg-[#1F1A14] px-3 text-xs font-medium text-[#FCF8F1] transition hover:bg-[#2F281F] disabled:opacity-50"
                                  >
                                    <IconEdit size={13} /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busyId === inv.id}
                                    onClick={() => void openInWorkspace(inv.id, "/pilih-template")}
                                    title="Pilih / ubah desain"
                                    className="inline-flex h-8 items-center gap-1 rounded-full border border-[#E9DDC6] bg-white px-2.5 text-xs font-medium text-[#1F1A14] transition hover:border-[#8A6424] hover:bg-[#FCF8F1]"
                                  >
                                    <IconPalette size={13} /> Desain
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busyId === inv.id}
                                    onClick={() => void openInWorkspace(inv.id, "/manajemen-tamu")}
                                    title="Kelola daftar tamu"
                                    className="inline-flex h-8 items-center gap-1 rounded-full border border-[#E9DDC6] bg-white px-2.5 text-xs font-medium text-[#1F1A14] transition hover:border-[#8A6424] hover:bg-[#FCF8F1]"
                                  >
                                    <IconUsers size={13} /> Tamu
                                  </button>
                                  <ClientAccountDialog
                                    invitationId={inv.id}
                                    invitationTitle={inv.title}
                                    clientName={inv.clientName}
                                    clientWhatsapp={inv.clientWhatsapp}
                                    appUrl={appUrl}
                                    compact
                                  />
                                  {inv.slug && (
                                    <a
                                      href={`/${inv.slug}${!isPaid || !inv.isPublic ? "?preview=1" : ""}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Lihat undangan"
                                      aria-label={`Lihat undangan ${inv.title}`}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E9DDC6] bg-white text-[#5E5446] transition hover:border-[#8A6424] hover:text-[#1F1A14]"
                                    >
                                      <IconExternalLink size={14} />
                                    </a>
                                  )}
                                  {!isPaid &&
                                    (usableQuota > 0 ? (
                                      <button
                                        type="button"
                                        disabled={busyId === inv.id}
                                        onClick={() => void activateWithQuota(inv)}
                                        className="inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-full bg-[#8A6424] px-3 text-xs font-semibold text-white transition hover:bg-[#755925] disabled:opacity-50"
                                      >
                                        {busyId === inv.id ? <IconLoader2 size={13} className="animate-spin" /> : <IconShare size={13} />}
                                        Aktifkan
                                      </button>
                                    ) : (
                                      <Link
                                        href="/upgrade?pilih=mitra#kuota-mitra"
                                        className="inline-flex h-8 items-center whitespace-nowrap rounded-full border border-[#D9B56A] px-2.5 text-xs font-medium text-[#8A6424] hover:bg-[#FCF5E6]"
                                      >
                                        Beli Kuota
                                      </Link>
                                    ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile compact list */}
                  <ul className="divide-y divide-[#F3EBDB] md:hidden">
                    {pageRows.map((inv) => {
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
                        <li key={inv.id} className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-[#1F1A14]">{inv.title}</p>
                              <p className="mt-0.5 text-xs text-[#6B5F50]">
                                /{inv.slug || "-"}
                                {inv.clientName ? ` · ${inv.clientName}` : ""}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                                isPaid ? "border border-[#E6D5B2] bg-[#F7F0E1] text-[#5C431A]" : "bg-amber-50 text-amber-800"
                              }`}
                            >
                              {isPaid ? `Aktif · ${limits.name}` : "Pratinjau"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B5F50]">
                            <span>{dateStr(inv.weddingDate)}</span>
                            <span>·</span>
                            <span>{inv.views} lihat</span>
                            <span>·</span>
                            <span>{inv._count.guests} tamu</span>
                            <span>·</span>
                            <span>{inv._count.rsvps} RSVP</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={busyId === inv.id}
                              onClick={() => void openInWorkspace(inv.id, "/editor")}
                              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#1A1510] px-4 text-xs font-medium text-[#FCF8F1]"
                            >
                              <IconEdit size={14} /> Edit
                            </button>
                            <button
                              type="button"
                              disabled={busyId === inv.id}
                              onClick={() => void openInWorkspace(inv.id, "/manajemen-tamu")}
                              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#E9DDC6] bg-white px-3.5 text-xs font-medium text-[#1A1510]"
                            >
                              <IconUsers size={14} /> Tamu
                            </button>
                            <ClientAccountDialog
                              invitationId={inv.id}
                              invitationTitle={inv.title}
                              clientName={inv.clientName}
                              clientWhatsapp={inv.clientWhatsapp}
                              appUrl={appUrl}
                            />
                            {inv.slug && (
                              <a
                                href={`/${inv.slug}${!isPaid || !inv.isPublic ? "?preview=1" : ""}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-10 items-center gap-1 rounded-full border border-[#E9DDC6] bg-white px-3.5 text-xs font-medium text-[#1A1510]"
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
                                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E6D5B2] bg-[#F7F0E1] px-3 text-xs font-medium text-[#5C431A]"
                                >
                                  <IconLink size={13} /> Salin Link Isi Data
                                </button>
                                {clientWaLink && (
                                  <a
                                    href={clientWaLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E6D5B2] bg-white px-3 text-xs font-medium text-[#1F1A14]"
                                  >
                                    <IconBrandWhatsapp size={14} className="text-[#8A6424]" /> Kirim WA
                                  </a>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={busyId === inv.id}
                                onClick={() => void ensureClientLink(inv)}
                                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E9DDC6] px-3 text-xs font-medium text-[#5E5446]"
                              >
                                <IconLink size={13} /> Buat Link Isi Data
                              </button>
                            )}
                            {!isPaid &&
                              (usableQuota > 0 ? (
                                <button
                                  type="button"
                                  disabled={busyId === inv.id}
                                  onClick={() => void activateWithQuota(inv)}
                                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#8A6424] px-3.5 text-xs font-semibold text-white"
                                >
                                  <IconShare size={14} /> Aktifkan (1 Kuota)
                                </button>
                              ) : (
                                <Link
                                  href="/upgrade?pilih=mitra#kuota-mitra"
                                  className="inline-flex h-9 items-center rounded-full border border-[#D9B56A] px-3 text-xs font-medium text-[#8A6424]"
                                >
                                  Beli Kuota
                                </Link>
                              ))}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Pagination */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F3EBDB] px-4 py-3 text-xs text-[#6B5F50]">
                    <div className="flex items-center gap-2">
                      <SelectField
                        value={String(perPage)}
                        onChange={(e) => {
                          setPerPage(Number(e.target.value));
                          setPage(1);
                        }}
                        size="sm"
                        aria-label="Baris per halaman"
                        className="w-20"
                      >
                        {[10, 20, 50].map((n) => (
                          <option key={n} value={String(n)}>
                            {n}
                          </option>
                        ))}
                      </SelectField>
                      <span>
                        {(current - 1) * perPage + 1}–{Math.min(current * perPage, filtered.length)} dari {filtered.length} undangan
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={current <= 1}
                        onClick={() => setPage(current - 1)}
                        className="h-9 rounded-full border-[#E9DDC6] text-xs"
                      >
                        Sebelumnya
                      </Button>
                      <span className="px-2 tabular-nums">
                        {current}/{pages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={current >= pages}
                        onClick={() => setPage(current + 1)}
                        className="h-9 rounded-full border-[#E9DDC6] text-xs"
                      >
                        Berikutnya
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </section>
          );
        })()}

        {/* Branding & Referral shortcut */}
        <section className="grid gap-6 xl:grid-cols-2 xl:items-start">
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

          <div className="space-y-5 rounded-2xl border border-[#EDE3CF] bg-[#FFFDF9] p-6">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6424]">Link Referral Mitra</p>
              <h2 className="font-serif text-2xl font-medium text-[#1A1510]">Klien bayar sendiri? Anda dapat bonus kuota</h2>
              <p className="text-sm leading-relaxed text-[#5E5446]">
                Bagikan kode <strong className="text-[#1F1A14]">{initialReferral.code}</strong> ke klien yang ingin membeli paket sendiri. Klien membayar harga normal, dan setiap {MITRA_BONUS_EVERY} klien membeli, Anda mendapat 1 kuota undangan gratis (setara Premium) yang bisa dijual lagi.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-[#EDE3CF] bg-[#FCF8F1] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#8E8268]">Kode Mitra Anda</p>
                  <p className="mt-0.5 font-mono text-lg font-semibold tracking-wider text-[#1F1A14]">{initialReferral.code}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(initialReferral.code, "Kode mitra disalin")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E6D5B2] bg-white px-3.5 text-xs font-medium text-[#1F1A14] transition hover:border-[#8A6424]"
                >
                  <IconCopy size={13} /> Salin Kode
                </button>
              </div>
              <div className="space-y-1.5 border-t border-[#EDE3CF] pt-3">
                <div className="flex items-center justify-between text-xs text-[#5E5446]">
                  <span>Progres menuju bonus kuota berikutnya</span>
                  <span className="font-medium tabular-nums text-[#1F1A14]">
                    {initialReferral.paidPlanClients % MITRA_BONUS_EVERY} / {MITRA_BONUS_EVERY} klien
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#EDE3CF]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#B8903F,#D9B56A)] transition-all"
                    style={{ width: `${((initialReferral.paidPlanClients % MITRA_BONUS_EVERY) / MITRA_BONUS_EVERY) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#8E8268]">
                  Total {initialReferral.paidPlanClients} klien berbayar · {initialReferral.bonusEarned} kuota bonus sudah diterima
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex h-10 items-center rounded-xl border border-[#E9DDC6] bg-white px-3.5 text-xs text-[#40372B]">
                <span className="truncate font-mono">{referralUrl}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyText(referralUrl, "Link referral disalin")}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#1F1A14] px-4 text-xs font-medium text-[#FCF8F1] transition hover:bg-[#2F281F] sm:flex-initial"
                >
                  <IconCopy size={14} /> Salin Link
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Buat undangan pernikahan digital di SatuMoment — pakai kode ${initialReferral.code} atau buka ${referralUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({
                    variant: "gold",
                    className: "h-10 flex-1 px-4 text-xs sm:flex-initial",
                  })}
                >
                  <IconBrandWhatsapp size={15} /> Bagikan via WA
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
