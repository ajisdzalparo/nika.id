"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBell,
  IconBellCheck,
  IconBrandWhatsapp,
  IconCheck,
  IconClock,
  IconCopy,
  IconEye,
  IconInfoCircle,
  IconLock,
  IconPencil,
  IconPlus,
  IconQrcode,
  IconSearch,
  IconSend,
  IconTemplate,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Panel } from "@/components/common/studio-ui";
import { waLink } from "@/lib/phone";

interface BlastGuest {
  id: string;
  name: string;
  greeting: string | null;
  guestType: "REGULAR" | "VIP";
  phone: string | null;
  label: string | null;
  eventName: string | null;
  maxGuests: number;
}

type TemplateStatus = "APPROVED" | "PENDING" | "REJECTED";

interface BlastTemplate {
  id: string;
  title: string;
  kind: "INVITATION" | "REMINDER" | "QR";
  status: TemplateStatus;
  language: string;
  body: string;
  isDefault?: boolean;
  metaNote: string;
}

interface WaBlastStudioProps {
  invitationId: string;
  invitationSlug: string;
  baseUrl: string;
  coupleName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  address: string;
  qrEnabled: boolean;
  alreadyWaitlisted: boolean;
  guests: BlastGuest[];
}

const VARIABLES = [
  "[Sapaan]",
  "[Nama]",
  "[Mempelai]",
  "[Acara]",
  "[Tanggal]",
  "[Waktu]",
  "[Lokasi]",
  "[Alamat]",
  "[Link]",
  "[Kode QR]",
] as const;

const DEFAULT_TEMPLATES: BlastTemplate[] = [
  {
    id: "tpl-undangan-digital",
    title: "Template Undangan Digital",
    kind: "INVITATION",
    status: "APPROVED",
    language: "Bahasa Indonesia",
    isDefault: true,
    metaNote: "Template bawaan · Siap pratinjau & kirim manual",
    body: "Kepada [Sapaan] [Nama],\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri hari bahagia [Mempelai] pada acara [Acara].\n\nHari/Tanggal: [Tanggal]\nWaktu: [Waktu]\nTempat: [Lokasi]\n\nInformasi lengkap & konfirmasi kehadiran dapat dibuka melalui tautan berikut:\n[Link]\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Terima kasih.",
  },
  {
    id: "tpl-reminder-rsvp",
    title: "Template Pengingat RSVP (Default)",
    kind: "REMINDER",
    status: "APPROVED",
    language: "Bahasa Indonesia",
    isDefault: true,
    metaNote: "Template bawaan · Pengingat konfirmasi kehadiran",
    body: "Kepada Yth. [Nama], tanpa mengurangi rasa hormat, kami ingin mengingatkan kembali undangan [Acara] kami yang telah dikirimkan sebelumnya.\n\nAcara akan diselenggarakan pada [Tanggal] pukul [Waktu], bertempat di [Lokasi] yang beralamat di [Alamat].\n\nDimohon kesediaannya untuk mengisi konfirmasi kehadiran (RSVP) melalui undangan digital kami di [Link] guna membantu kami mempersiapkan segala sesuatunya dengan baik. Terima kasih banyak.",
  },
  {
    id: "tpl-qr-checkin",
    title: "Template Kartu QR Check-in",
    kind: "QR",
    status: "APPROVED",
    language: "Bahasa Indonesia",
    isDefault: true,
    metaNote: "Template QR bawaan · Lampirkan kartu check-in otomatis saat rilis",
    body: "Halo [Sapaan] [Nama],\n\nTerima kasih telah mengonfirmasi kehadiran pada hari bahagia [Mempelai] ([Tanggal], pukul [Waktu] di [Lokasi]).\n\nSilakan simpan kode check-in pribadi Anda ([Kode QR]) dan tunjukkan QR kepada penerima tamu saat tiba di lokasi acara.\n\nDetail lokasi & peta: [Link]",
  },
];

const STATUS_STYLE: Record<TemplateStatus, { label: string; cls: string }> = {
  APPROVED: { label: "Disetujui", cls: "bg-[#EEF4EA] text-[#3F6B3A]" },
  PENDING: { label: "Menunggu", cls: "bg-[#F6EEDF] text-[#8A6424]" },
  REJECTED: { label: "Ditolak", cls: "bg-[#F6E7E4] text-[#9A3B2E]" },
};

function HighlightedBody({ text, clamp = false }: { text: string; clamp?: boolean }) {
  const parts = text.split(/(\[[A-Za-z0-9 ]+\])/g);
  return (
    <p className={`whitespace-pre-line text-xs leading-relaxed text-[#40372B] ${clamp ? "line-clamp-3" : ""}`}>
      {parts.map((part, i) =>
        /^\[[A-Za-z0-9 ]+\]$/.test(part) ? (
          <span key={i} className="mx-0.5 inline-block rounded bg-[#F6EEDF] px-1.5 py-0.5 font-medium text-[#8A6424]">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </p>
  );
}

export function WaBlastStudio({
  invitationId,
  invitationSlug,
  baseUrl,
  coupleName,
  eventTitle,
  eventDate,
  eventTime,
  venue,
  address,
  qrEnabled,
  alreadyWaitlisted,
  guests,
}: WaBlastStudioProps) {
  const storageKey = `uy_wa_blast_templates:${invitationId}`;

  const [customTemplates, setCustomTemplates] = useState<BlastTemplate[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | TemplateStatus>("ALL");
  const [tplSearch, setTplSearch] = useState("");
  const [previewTpl, setPreviewTpl] = useState<BlastTemplate | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<BlastTemplate | null>(null);
  const [tplTitle, setTplTitle] = useState("");
  const [tplKind, setTplKind] = useState<"INVITATION" | "REMINDER" | "QR">("INVITATION");
  const [tplBody, setTplBody] = useState("");

  // Send WA Blast tab state
  const [activeTab, setActiveTab] = useState<"templates" | "send">("templates");
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTplId, setSelectedTplId] = useState<string>(DEFAULT_TEMPLATES[0].id);
  const [guestSearch, setGuestSearch] = useState("");
  const [guestFilter, setGuestFilter] = useState<string>("ALL");
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>(() =>
    guests.filter((g) => Boolean(g.phone)).map((g) => g.id),
  );
  const [manualSentIds, setManualSentIds] = useState<string[]>([]);

  // Coming soon waitlist modal
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [waitlisted, setWaitlisted] = useState(alreadyWaitlisted);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);

  // Load local custom templates safely on client
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as BlastTemplate[];
        if (Array.isArray(parsed)) setCustomTemplates(parsed);
      }
    } catch {
      // Ignore storage errors
    }
  }, [storageKey]);

  const persistCustomTemplates = (next: BlastTemplate[]) => {
    setCustomTemplates(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  };

  const allTemplates = useMemo(() => [...customTemplates, ...DEFAULT_TEMPLATES], [customTemplates]);

  const filteredTemplates = useMemo(() => {
    const q = tplSearch.trim().toLowerCase();
    return allTemplates.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (!q) return true;
      return `${t.title} ${t.body}`.toLowerCase().includes(q);
    });
  }, [allTemplates, statusFilter, tplSearch]);

  const statusCounts = useMemo(
    () => ({
      ALL: allTemplates.length,
      APPROVED: allTemplates.filter((t) => t.status === "APPROVED").length,
      PENDING: allTemplates.filter((t) => t.status === "PENDING").length,
      REJECTED: allTemplates.filter((t) => t.status === "REJECTED").length,
    }),
    [allTemplates],
  );

  const selectedTemplate = useMemo(
    () => allTemplates.find((t) => t.id === selectedTplId) ?? allTemplates[0],
    [allTemplates, selectedTplId],
  );

  const guestLabels = useMemo(() => {
    const set = new Set<string>();
    for (const g of guests) {
      if (g.label) set.add(g.label);
    }
    return Array.from(set);
  }, [guests]);

  const guestsWithPhone = useMemo(() => guests.filter((g) => Boolean(g.phone)), [guests]);

  const filteredGuests = useMemo(() => {
    const q = guestSearch.trim().toLowerCase();
    return guests.filter((g) => {
      if (guestFilter === "WA" && !g.phone) return false;
      if (guestFilter === "VIP" && g.guestType !== "VIP") return false;
      if (guestFilter.startsWith("LABEL:") && g.label !== guestFilter.slice(6)) return false;
      if (!q) return true;
      return `${g.greeting ?? ""} ${g.name} ${g.phone ?? ""} ${g.label ?? ""}`.toLowerCase().includes(q);
    });
  }, [guests, guestSearch, guestFilter]);

  const renderMessage = (body: string, guest?: BlastGuest | null) => {
    const cleanGreeting = (guest?.greeting ?? "")
      .trim()
      .replace(/^kepada\s+yth\.?\s*/i, "")
      .replace(/^kepada\s+/i, "")
      .replace(/^yth\.?\s*/i, "")
      .trim();
    const greeting = cleanGreeting || "Bapak/Ibu";
    const name = guest?.name?.trim() || "Tamu Undangan";
    const coverRecipient = cleanGreeting ? `${cleanGreeting} ${name}` : name;
    const origin = typeof window !== "undefined" ? window.location.origin : baseUrl.replace(/\/$/, "");
    const params = new URLSearchParams({ to: coverRecipient });
    const link = `${origin}/${invitationSlug}?${params.toString()}`;

    return body
      .replaceAll("[Sapaan]", greeting)
      .replaceAll("[Nama]", name)
      .replaceAll("[Mempelai]", coupleName)
      .replaceAll("[Acara]", guest?.eventName && guest.eventName !== "Umum" ? guest.eventName : eventTitle)
      .replaceAll("[Tanggal]", eventDate)
      .replaceAll("[Waktu]", eventTime)
      .replaceAll("[Lokasi]", venue)
      .replaceAll("[Alamat]", address)
      .replaceAll("[Link]", link)
      .replaceAll("[Kode QR]", qrEnabled ? "UY-CHECKIN:CONTOH9X" : "(Aktifkan QR di Editor)");
  };

  const openNewTemplate = (kind: "INVITATION" | "REMINDER" | "QR") => {
    setEditingTpl(null);
    setTplKind(kind);
    setTplTitle(kind === "QR" ? "Template QR Kustom" : "");
    setTplBody(
      kind === "QR"
        ? "Halo [Sapaan] [Nama],\n\nBerikut kode check-in untuk acara [Acara] ([Tanggal], [Waktu] di [Lokasi]): [Kode QR].\n\nSampai jumpa di hari bahagia [Mempelai]!\n[Link]"
        : "Kepada [Sapaan] [Nama],\n\nDengan penuh kebahagiaan, kami mengundang Anda hadir di acara [Acara] [Mempelai] pada [Tanggal] pukul [Waktu] di [Lokasi].\n\nLihat undangan digital:\n[Link]",
    );
    setEditorOpen(true);
  };

  const openEditTemplate = (tpl: BlastTemplate) => {
    if (tpl.isDefault) {
      // Duplicate default template as a custom editable draft
      setEditingTpl(null);
      setTplKind(tpl.kind);
      setTplTitle(`${tpl.title} (Salinan)`);
      setTplBody(tpl.body);
      setEditorOpen(true);
      return;
    }
    setEditingTpl(tpl);
    setTplKind(tpl.kind);
    setTplTitle(tpl.title);
    setTplBody(tpl.body);
    setEditorOpen(true);
  };

  const saveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplTitle.trim() || !tplBody.trim()) {
      toast.error("Judul dan isi pesan template wajib diisi");
      return;
    }
    if (editingTpl) {
      const next = customTemplates.map((t) =>
        t.id === editingTpl.id
          ? { ...t, title: tplTitle.trim(), kind: tplKind, body: tplBody.trim(), metaNote: "Draf lokal · Diperbarui barusan" }
          : t,
      );
      persistCustomTemplates(next);
      toast.success("Draf template diperbarui");
    } else {
      const created: BlastTemplate = {
        id: `custom-${Date.now()}`,
        title: tplTitle.trim(),
        kind: tplKind,
        status: "PENDING",
        language: "Bahasa Indonesia",
        body: tplBody.trim(),
        metaNote: "Draf lokal · Menunggu rilis verifikasi WhatsApp resmi",
      };
      persistCustomTemplates([created, ...customTemplates]);
      setSelectedTplId(created.id);
      toast.success("Draf template disimpan & siap dipakai untuk kirim manual");
    }
    setEditorOpen(false);
  };

  const deleteTemplate = (tpl: BlastTemplate) => {
    if (tpl.isDefault) return;
    const next = customTemplates.filter((t) => t.id !== tpl.id);
    persistCustomTemplates(next);
    if (selectedTplId === tpl.id) setSelectedTplId(DEFAULT_TEMPLATES[0].id);
    toast.success(`Template "${tpl.title}" dihapus`);
  };

  const copyRenderedTemplate = (tpl: BlastTemplate, guest?: BlastGuest | null) => {
    navigator.clipboard.writeText(renderMessage(tpl.body, guest));
    toast.success("Teks pesan berhasil disalin");
  };

  const toggleGuestSelection = (id: string) => {
    setSelectedGuestIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const allVisibleSelected =
    filteredGuests.length > 0 && filteredGuests.every((g) => selectedGuestIds.includes(g.id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleSet = new Set(filteredGuests.map((g) => g.id));
      setSelectedGuestIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      const merged = new Set([...selectedGuestIds, ...filteredGuests.map((g) => g.id)]);
      setSelectedGuestIds(Array.from(merged));
    }
  };

  const openManualWa = (g: BlastGuest) => {
    if (!selectedTemplate) return;
    const text = renderMessage(selectedTemplate.body, g);
    const url = g.phone ? waLink(g.phone, text) : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url ?? `https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setManualSentIds((prev) => (prev.includes(g.id) ? prev : [...prev, g.id]));
  };

  const joinWaitlist = async () => {
    if (waitlisted) {
      toast.info("Kamu sudah masuk daftar tunggu rilis WA Blast");
      return;
    }
    setJoiningWaitlist(true);
    try {
      const res = await fetch("/api/user/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: "FITUR_BARU",
          feature: "TAMU",
          pagePath: "/wa-blast",
          message: `Minat fitur tambahan WA Blast (${guests.length} tamu terdaftar, ${guestsWithPhone.length} nomor WA). Kabari saat rilis.`,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.message || "Gagal mendaftarkan minat");
        return;
      }
      setWaitlisted(true);
      toast.success("Tercatat! Kami akan kabari begitu add-on WA Blast resmi dibuka.");
    } catch {
      toast.error("Gagal menghubungi server");
    } finally {
      setJoiningWaitlist(false);
    }
  };

  const selectedGuests = useMemo(
    () => guests.filter((g) => selectedGuestIds.includes(g.id)),
    [guests, selectedGuestIds],
  );
  const selectedWithPhoneCount = selectedGuests.filter((g) => Boolean(g.phone)).length;

  return (
    <div className="space-y-6">
      {/* Coming soon add-on hero banner */}
      <Panel tone="night" className="p-6 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="space-y-3">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[linear-gradient(120deg,#B8903F,#E6CB86_50%,#C9A24E)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1F1A14]">
              <IconClock size={12} stroke={2.4} /> Segera Hadir
            </span>
            <h2 className="font-(family-name:--font-landing-display) text-2xl leading-tight text-[#F6EEDD] sm:text-3xl">Kirim otomatis ke semua tamu</h2>
            <p className="max-w-xl text-sm leading-relaxed text-[#CDBF9F]">Sementara itu, kirim satu per satu gratis dari halaman ini.</p>
          </div>
          <div data-feature-allow="true" className="flex flex-wrap items-center gap-2.5 lg:flex-col lg:items-stretch">
            <Button
              type="button"
              variant="gold"
              disabled={joiningWaitlist}
              onClick={joinWaitlist}
              className="h-11 px-5"
            >
              {waitlisted ? (
                <>
                  <IconBellCheck size={17} /> Sudah di Daftar Tunggu
                </>
              ) : (
                <>
                  <IconBell size={17} /> {joiningWaitlist ? "Mendaftarkan…" : "Kabari Saya Saat Rilis"}
                </>
              )}
            </Button>
            <Link
              href="/manajemen-tamu"
              className={buttonVariants({
                variant: "ghost",
                className: "h-10 rounded-full border border-white/20 bg-white/5 px-4 text-xs text-[#F6EEDD] hover:bg-white/10 hover:text-white",
              })}
            >
              <IconBrandWhatsapp size={15} /> Kirim manual
            </Link>
          </div>
        </div>
      </Panel>

      {/* Main Tabs: Template WA Blast & Kirim WA Blast */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "templates" | "send")} className="w-full">
        <TabsList className="mb-5 h-auto max-w-full flex-wrap rounded-full bg-[#F6EEDF] p-1 sm:w-fit">
          <TabsTrigger value="templates" className="rounded-full px-3.5 py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm sm:px-5 sm:text-sm">
            <IconTemplate className="mr-1.5 size-4 sm:mr-2" /> Template WA ({allTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="send" className="rounded-full px-3.5 py-2 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm sm:px-5 sm:text-sm">
            <IconSend className="mr-1.5 size-4 sm:mr-2" /> Kirim WA Blast
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: WA BLAST TEMPLATE */}
        <TabsContent value="templates" className="space-y-5">
          {/* Quota summary bar (matching reference layout in champagne/gold style) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Panel className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#6B5F50]">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-[#F6EEDF] text-[#8A6424]">
                      <IconBrandWhatsapp size={16} />
                    </span>
                    <span>Kuota WA Blast Tersedia</span>
                    <span className="rounded-full bg-[#F6EEDF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8A6424]">
                      Segera Hadir
                    </span>
                  </div>
                  <p className="mt-3 font-(family-name:--font-landing-display) text-4xl tabular-nums text-[#1F1A14]">
                    0 <span className="text-xl text-[#8E8268]">/ 0</span>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setComingSoonOpen(true)}
                  className="h-10 rounded-full border-[#D9CBAE] text-[#8A6424] hover:bg-[#FCF8F1]"
                >
                  <IconPlus size={15} /> Tambah Kuota WA Blast
                </Button>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#F3EBDB]">
                <div className="h-full w-0 rounded-full bg-[linear-gradient(90deg,#B8903F,#E6CB86)]" />
              </div>
              <p className="mt-2.5 text-xs text-[#8E8268]">
                Kuota hanya dibutuhkan untuk pengiriman massal otomatis via WhatsApp API. Pengiriman manual satu per satu tetap gratis tanpa batas kuota.
              </p>
            </Panel>

            <Panel className="flex flex-col justify-between p-5 sm:p-6">
              <div>
                <div className="flex items-center gap-2 text-xs text-[#6B5F50]">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-[#F6EEDF] text-[#8A6424]">
                    <IconCheck size={15} />
                  </span>
                  <span>Total Kuota Terpakai</span>
                </div>
                <p className="mt-3 font-(family-name:--font-landing-display) text-4xl tabular-nums text-[#1F1A14]">0</p>
              </div>
              <p className="mt-3 text-xs text-[#8E8268]">
                {guestsWithPhone.length} dari {guests.length} tamumu sudah memiliki nomor WhatsApp aktif.
              </p>
            </Panel>
          </div>

          {/* Template list card */}
          <div className="rounded-2xl border border-[#EDE3CF] bg-white shadow-[0_1px_2px_rgba(26,21,16,.04)]">
            {/* Header actions */}
            <div className="flex flex-col gap-3 border-b border-[#F3EBDB] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ["ALL", "Semua"],
                    ["APPROVED", "Disetujui"],
                    ["PENDING", "Menunggu"],
                    ["REJECTED", "Ditolak"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={statusFilter === key}
                    onClick={() => setStatusFilter(key)}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition ${
                      statusFilter === key
                        ? "border-[#1F1A14] bg-[#1F1A14] text-white"
                        : "border-[#E9DDC6] text-[#40372B] hover:border-[#8A6424]"
                    }`}
                  >
                    {label}
                    <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${statusFilter === key ? "bg-white/20 text-white" : "bg-[#F6EEDF] text-[#8A6424]"}`}>
                      {statusCounts[key]}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-3.5 sm:w-52 sm:flex-initial">
                  <IconSearch size={15} className="shrink-0 text-[#6B5F50]" />
                  <input
                    value={tplSearch}
                    onChange={(e) => setTplSearch(e.target.value)}
                    type="search"
                    aria-label="Cari template WA Blast"
                    placeholder="Cari template…"
                    className="w-full min-w-0 bg-transparent text-xs outline-none"
                  />
                </label>
                <Button type="button" variant="outline" size="sm" onClick={() => openNewTemplate("QR")} className="h-9 rounded-full border-[#E9DDC6] px-3.5">
                  <IconQrcode size={15} /> Template QR
                </Button>
                <Button type="button" variant="ink" size="sm" onClick={() => openNewTemplate("INVITATION")} className="h-9 px-4">
                  <IconPlus size={15} /> Tambah Template
                </Button>
              </div>
            </div>

            {/* Template rows */}
            <div className="divide-y divide-[#F3EBDB]">
              {filteredTemplates.map((tpl) => {
                const st = STATUS_STYLE[tpl.status];
                return (
                  <div key={tpl.id} className="space-y-3 p-5 transition-colors hover:bg-[#FCF8F1]/60">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-[#1F1A14]">{tpl.title}</h3>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>{st.label}</span>
                          {tpl.kind === "QR" && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-2 py-0.5 text-[11px] text-[#8A6424]">
                              <IconQrcode size={12} /> QR
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8E8268]">{tpl.metaNote}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {!tpl.isDefault && (
                          <button
                            type="button"
                            onClick={() => deleteTemplate(tpl)}
                            className="flex size-9 items-center justify-center rounded-full text-[#6B5F50] transition hover:bg-[#F6E7E4] hover:text-[#9A3B2E]"
                            aria-label={`Hapus ${tpl.title}`}
                            title="Hapus draf"
                          >
                            <IconTrash size={17} />
                          </button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyRenderedTemplate(tpl, guests[0])}
                          className="h-9 rounded-full border-[#E9DDC6] px-3 text-xs"
                        >
                          <IconCopy size={14} /> Salin
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditTemplate(tpl)}
                          className="h-9 rounded-full border-[#E9DDC6] px-3 text-xs"
                        >
                          <IconPencil size={14} /> {tpl.isDefault ? "Duplikat" : "Ubah"}
                        </Button>
                        <Button
                          type="button"
                          variant="ink"
                          size="sm"
                          onClick={() => setPreviewTpl(tpl)}
                          className="h-9 px-3.5 text-xs"
                        >
                          <IconEye size={14} /> Lihat
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#F3EBDB] bg-[#FCF8F1] p-3.5">
                      <HighlightedBody text={tpl.body} clamp />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-[#EDE3CF] bg-white px-2.5 py-0.5 text-[11px] text-[#6B5F50]">
                        {tpl.language}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredTemplates.length === 0 && (
                <div className="px-6 py-14 text-center text-sm text-[#6B5F50]">
                  Tidak ada template yang cocok dengan filter ini.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: SEND WA BLAST */}
        <TabsContent value="send" className="space-y-5">
          {/* 2-step indicator bar */}
          <Panel className="p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="group text-left"
              >
                <div className={`h-1.5 w-full rounded-full transition-colors ${step >= 1 ? "bg-[linear-gradient(90deg,#B8903F,#E6CB86)]" : "bg-[#F3EBDB]"}`} />
                <div className="mt-2.5 flex items-center gap-2">
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                      step >= 1 ? "bg-[#1F1A14] text-[#F6EEDD]" : "border border-[#D9CBAE] text-[#8E8268]"
                    }`}
                  >
                    1
                  </span>
                  <span className={`text-sm font-medium ${step === 1 ? "text-[#1F1A14]" : "text-[#6B5F50]"}`}>Pilih Template</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="group text-left"
              >
                <div className={`h-1.5 w-full rounded-full transition-colors ${step >= 2 ? "bg-[linear-gradient(90deg,#B8903F,#E6CB86)]" : "bg-[#F3EBDB]"}`} />
                <div className="mt-2.5 flex items-center gap-2">
                  <span
                    className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                      step === 2 ? "bg-[#1F1A14] text-[#F6EEDD]" : "border border-[#D9CBAE] text-[#8E8268]"
                    }`}
                  >
                    2
                  </span>
                  <span className={`text-sm font-medium ${step === 2 ? "text-[#1F1A14]" : "text-[#6B5F50]"}`}>Pilih Tamu</span>
                </div>
              </button>
            </div>
          </Panel>

          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            {/* Left workspace */}
            <Panel className="p-5 sm:p-6">
              {step === 1 ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-(family-name:--font-landing-display) text-2xl text-[#1F1A14]">Pilih Template Pesan</h3>
                      <p className="text-xs text-[#6B5F50]">Pilih format undangan atau pengingat yang akan dikirimkan ke tamu.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => openNewTemplate("INVITATION")} className="h-9 rounded-full border-[#E9DDC6]">
                      <IconPlus size={15} /> Tambah Template
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {allTemplates.map((tpl) => {
                      const active = selectedTemplate?.id === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => setSelectedTplId(tpl.id)}
                          role="radio"
                          tabIndex={0}
                          aria-checked={active}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedTplId(tpl.id);
                            }
                          }}
                          className={`flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition ${
                            active
                              ? "border-[#8A6424] bg-[#FCF8F1]/60 ring-2 ring-[#8A6424]/15"
                              : "border-[#EDE3CF] bg-white hover:border-[#D9CBAE]"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium text-[#1F1A14]">{tpl.title}</p>
                                <p className="text-[11px] text-[#8E8268]">{tpl.language}</p>
                              </div>
                              <span
                                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                                  active ? "border-[#8A6424] bg-[#8A6424] text-white" : "border-[#D9CBAE]"
                                }`}
                              >
                                {active && <IconCheck size={12} stroke={3} />}
                              </span>
                            </div>

                            <div className="rounded-xl bg-[#FCF8F1] p-3">
                              <HighlightedBody text={tpl.body} clamp />
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-center border-t border-[#F3EBDB] pt-2.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTpl(tpl);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8A6424] hover:underline"
                            >
                              <IconEye size={14} /> Pratinjau pesan
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end border-t border-[#F3EBDB] pt-4">
                    <Button type="button" variant="gold" onClick={() => setStep(2)} className="h-10 px-6">
                      Lanjut pilih tamu <IconArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-(family-name:--font-landing-display) text-2xl text-[#1F1A14]">Pilih Tamu Penerima</h3>
                      <p className="text-xs text-[#6B5F50]">
                        Template aktif: <strong className="text-[#1F1A14]">{selectedTemplate?.title}</strong>
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setStep(1)} className="h-9 rounded-full border-[#E9DDC6]">
                      <IconArrowLeft size={15} /> Ganti template
                    </Button>
                  </div>

                  {/* Guest search & filter */}
                  <div className="space-y-3">
                    <label className="flex h-10 items-center gap-2 rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-4">
                      <IconSearch size={15} className="shrink-0 text-[#6B5F50]" />
                      <input
                        value={guestSearch}
                        onChange={(e) => setGuestSearch(e.target.value)}
                        type="search"
                        aria-label="Cari tamu penerima"
                        placeholder="Cari nama tamu, nomor WA, atau label…"
                        className="w-full min-w-0 bg-transparent text-sm outline-none"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "ALL", label: `Semua (${guests.length})` },
                        { key: "WA", label: `Punya No. WA (${guestsWithPhone.length})` },
                        { key: "VIP", label: "VIP" },
                        ...guestLabels.map((lbl) => ({ key: `LABEL:${lbl}`, label: lbl })),
                      ].map((chip) => (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => setGuestFilter(chip.key)}
                          className={`h-8 rounded-full border px-3 text-xs font-medium transition ${
                            guestFilter === chip.key
                              ? "border-[#1F1A14] bg-[#1F1A14] text-white"
                              : "border-[#E9DDC6] text-[#40372B] hover:border-[#8A6424]"
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredGuests.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-[#EDE3CF]">
                      <div className="flex items-center justify-between border-b border-[#F3EBDB] bg-[#FCF8F1] px-4 py-2.5 text-xs text-[#6B5F50]">
                        <label className="flex cursor-pointer items-center gap-2.5 font-medium text-[#1F1A14]">
                          <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectAllVisible} />
                          Pilih semua ({filteredGuests.length})
                        </label>
                        <span>{selectedGuests.length} dipilih</span>
                      </div>

                      <ul className="max-h-96 divide-y divide-[#F3EBDB] overflow-y-auto">
                        {filteredGuests.map((g) => {
                          const checked = selectedGuestIds.includes(g.id);
                          const sentManual = manualSentIds.includes(g.id);
                          return (
                            <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-[#FCF8F1]/60">
                              <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                                <Checkbox checked={checked} onCheckedChange={() => toggleGuestSelection(g.id)} className="mt-0.5" />
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="truncate text-sm font-medium text-[#1F1A14]">
                                      {g.greeting ? `${g.greeting} ${g.name}` : g.name}
                                    </span>
                                    {g.guestType === "VIP" && (
                                      <span className="rounded-full bg-[linear-gradient(120deg,#B8903F,#E6CB86)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#1F1A14]">
                                        VIP
                                      </span>
                                    )}
                                    {g.label && (
                                      <span className="rounded-full bg-[#F6EEDF] px-2 py-0.5 text-[10px] font-medium text-[#8A6424]">
                                        {g.label}
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-0.5 text-xs text-[#6B5F50]">
                                    {g.phone ? `+${g.phone}` : "Belum ada nomor WA · tambahkan di Daftar Tamu"}
                                  </p>
                                </div>
                              </label>

                              <Button
                                type="button"
                                variant={sentManual ? "outline" : "secondary"}
                                size="sm"
                                onClick={() => openManualWa(g)}
                                className={`h-8 shrink-0 rounded-full px-3 text-xs ${
                                  sentManual
                                    ? "border-[#C8DDC2] bg-[#EEF4EA] text-[#3F6B3A]"
                                    : "bg-[#F6EEDF] text-[#1F1A14] hover:bg-[#EDE0C6]"
                                }`}
                              >
                                {sentManual ? (
                                  <>
                                    <IconCheck size={14} /> Dibuka di WA
                                  </>
                                ) : (
                                  <>
                                    <IconBrandWhatsapp size={14} /> Kirim manual
                                  </>
                                )}
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#E9DDC6] px-5 py-10 text-center text-sm text-[#6B5F50]">
                      <IconUsers size={26} className="mx-auto mb-2 text-[#D9B56A]" />
                      {guests.length === 0
                        ? "Belum ada tamu di undangan ini. Tambahkan tamu beserta nomor WA-nya terlebih dahulu."
                        : "Tidak ada tamu yang cocok dengan filter ini."}
                      {guests.length === 0 && (
                        <div className="mt-4">
                          <Link href="/manajemen-tamu" className={buttonVariants({ variant: "ink", size: "sm", className: "h-9 px-4" })}>
                            Buka Daftar Tamu
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer action bar */}
                  <div className="flex flex-col gap-3 border-t border-[#F3EBDB] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-[#6B5F50]">
                      <strong className="text-[#1F1A14]">{selectedGuests.length} tamu</strong> dipilih ·{" "}
                      <strong className="text-[#8A6424]">{selectedWithPhoneCount}</strong> punya nomor WA aktif
                    </div>
                    <Button
                      type="button"
                      variant="gold"
                      onClick={() => setComingSoonOpen(true)}
                      className="h-10 px-5"
                    >
                      <IconLock size={15} /> Kirim Massal Otomatis (Segera Hadir)
                    </Button>
                  </div>
                </div>
              )}
            </Panel>

            {/* Right sticky Quota Donut Card (inspired by reference screenshot 4, in champagne/gold aesthetic) */}
            <Panel className="p-5 sm:p-6 lg:sticky lg:top-24">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-(family-name:--font-landing-display) text-xl text-[#1F1A14]">Kuota WA Blast</h3>
                <span className="rounded-full bg-[#F6EEDF] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8A6424]">
                  Segera
                </span>
              </div>

              {/* Clean SVG Ring Gauge */}
              <div className="my-5 flex justify-center">
                <div className="relative flex size-40 items-center justify-center">
                  <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
                    <circle cx="60" cy="60" r="48" fill="none" stroke="#F3EBDB" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      fill="none"
                      stroke="#C9A24E"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="301.6"
                      strokeDashoffset="240"
                      opacity="0.45"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-(family-name:--font-landing-display) text-3xl tabular-nums leading-none text-[#1F1A14]">0</span>
                    <span className="mt-1 text-xs text-[#8E8268]">/ 0 pesan</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-2.5 border-t border-[#F3EBDB] pt-4 text-xs">
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[#6B5F50]">
                    <span className="size-2 rounded-full bg-[#C9A24E]" /> Kuota tersedia
                  </span>
                  <span className="font-medium tabular-nums text-[#1F1A14]">0</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[#6B5F50]">
                    <span className="size-2 rounded-full bg-[#6B5F50]" /> Kuota terpakai
                  </span>
                  <span className="font-medium tabular-nums text-[#1F1A14]">0</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[#6B5F50]">
                    <span className="size-2 rounded-full bg-[#3F6B3A]" /> Tamu punya No. WA
                  </span>
                  <span className="font-medium tabular-nums text-[#1F1A14]">{guestsWithPhone.length}</span>
                </li>
              </ul>

              <Button
                type="button"
                variant="outline"
                onClick={() => setComingSoonOpen(true)}
                className="mt-5 h-10 w-full rounded-full border-[#D9CBAE] text-[#8A6424] hover:bg-[#FCF8F1]"
              >
                Tambah Kuota WA Blast
              </Button>
            </Panel>
          </div>
        </TabsContent>
      </Tabs>

      {/* Live Preview Dialog */}
      <Dialog open={Boolean(previewTpl)} onOpenChange={(o) => !o && setPreviewTpl(null)}>
        <DialogContent className="border-[#EDE3CF] bg-[#FFFDF9] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-(family-name:--font-landing-display) text-2xl font-normal text-[#1F1A14]">
              Pratinjau Pesan
            </DialogTitle>
            <DialogDescription>
              {previewTpl?.title} — contoh tampilan pesan dengan data undangan <strong>{coupleName}</strong>.
            </DialogDescription>
          </DialogHeader>
          {previewTpl && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-[#E5DEC9] bg-[#F6EFE1] p-4">
                <div className="rounded-xl rounded-tl-sm bg-white p-4 shadow-xs">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-[#1F1A14]">
                    {renderMessage(previewTpl.body, guests[0])}
                  </p>
                  <p className="mt-2 text-right text-[10px] text-[#8E8268]">Contoh pesan WhatsApp ✓✓</p>
                </div>
              </div>
              <p className="text-xs text-[#8E8268]">
                Variabel seperti <code className="rounded bg-[#F6EEDF] px-1 text-[#8A6424]">[Nama]</code> dan{" "}
                <code className="rounded bg-[#F6EEDF] px-1 text-[#8A6424]">[Link]</code> otomatis berganti sesuai data masing-masing tamu.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setPreviewTpl(null)} className="rounded-full border-[#E9DDC6]">
              Tutup
            </Button>
            {previewTpl && (
              <Button type="button" variant="gold" onClick={() => copyRenderedTemplate(previewTpl, guests[0])} className="h-10 px-5">
                <IconCopy size={15} /> Salin teks ini
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Template Draft Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="border-[#EDE3CF] bg-[#FFFDF9] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-(family-name:--font-landing-display) text-2xl font-normal text-[#1F1A14]">
              {editingTpl ? "Ubah Draf Template" : tplKind === "QR" ? "Tambah Template QR" : "Tambah Template WA"}
            </DialogTitle>
            <DialogDescription>
              Susun pesan undanganmu sendiri. Draf tersimpan di perangkat ini dan langsung bisa digunakan untuk kirim manual sekarang.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveTemplate} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="block text-xs font-medium text-[#1F1A14]">Nama Template</span>
              <Input
                value={tplTitle}
                onChange={(e) => setTplTitle(e.target.value)}
                placeholder="Contoh: Undangan Rekan Kantor"
                maxLength={80}
                required
                className="h-10 rounded-xl border-[#E9DDC6] bg-white"
              />
            </label>

            <div className="space-y-1.5">
              <label htmlFor="tpl-body" className="block text-xs font-medium text-[#1F1A14]">
                Isi Pesan
              </label>
              <Textarea
                id="tpl-body"
                value={tplBody}
                onChange={(e) => setTplBody(e.target.value)}
                rows={7}
                required
                className="rounded-xl border-[#E9DDC6] bg-white text-sm"
              />
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] text-[#8E8268]">Klik variabel untuk menyisipkan otomatis:</p>
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setTplBody((prev) => `${prev}${prev.endsWith(" ") || !prev ? "" : " "}${v}`)}
                      className="rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-2.5 py-0.5 text-[11px] font-medium text-[#8A6424] transition hover:border-[#8A6424]"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setEditorOpen(false)} className="rounded-full border-[#E9DDC6]">
                Batal
              </Button>
              <Button type="submit" variant="gold" className="h-10 px-6">
                Simpan Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Coming Soon Add-on Info Modal */}
      <Dialog open={comingSoonOpen} onOpenChange={setComingSoonOpen}>
        <DialogContent className="border-[#EDE3CF] bg-[#FFFDF9] sm:max-w-md">
          <DialogHeader>
            <span className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#F6EEDF] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#8A6424]">
              <IconInfoCircle size={14} /> Fitur Tambahan · Segera Hadir
            </span>
            <DialogTitle className="font-(family-name:--font-landing-display) text-2xl font-normal text-[#1F1A14]">
              WA Blast Otomatis Segera Dibuka
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              Kami sedang menyiapkan integrasi WhatsApp resmi agar pengiriman undangan massal aman, tidak memblokir nomor pribadimu, serta menampilkan status <strong>terkirim &amp; dibaca</strong> langsung di dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-xl border border-[#EDE3CF] bg-[#FCF8F1] p-4 text-xs text-[#40372B]">
            <p className="font-medium text-[#1F1A14]">Yang akan hadir di add-on WA Blast:</p>
            <ul className="space-y-1.5 text-[#6B5F50]">
              <li className="flex items-start gap-2">
                <IconCheck size={14} className="mt-0.5 shrink-0 text-[#8A6424]" />
                Kuota kirim fleksibel (bayar sesuai jumlah tamu yang ingin di-blast).
              </li>
              <li className="flex items-start gap-2">
                <IconCheck size={14} className="mt-0.5 shrink-0 text-[#8A6424]" />
                Template pesan resmi + lampiran otomatis kartu QR check-in.
              </li>
              <li className="flex items-start gap-2">
                <IconCheck size={14} className="mt-0.5 shrink-0 text-[#8A6424]" />
                Laporan status terkirim, dibaca, dan gagal per tamu di halaman RSVP.
              </li>
            </ul>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setComingSoonOpen(false)} className="rounded-full border-[#E9DDC6]">
              Nanti saja
            </Button>
            <Button
              type="button"
              variant="gold"
              disabled={joiningWaitlist}
              onClick={async () => {
                await joinWaitlist();
                setComingSoonOpen(false);
              }}
              className="h-10 px-5"
            >
              {waitlisted ? "Sudah terdaftar" : joiningWaitlist ? "Mendaftarkan…" : "Kabari saat rilis"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
