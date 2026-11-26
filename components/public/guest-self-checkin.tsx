"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconCalendarEvent,
  IconCheck,
  IconExternalLink,
  IconMapPin,
  IconMinus,
  IconPencil,
  IconPlus,
  IconUserCheck,
  IconUsersGroup,
} from "@tabler/icons-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/common/phone-input";
import { loadGuestIdentity, saveGuestIdentity, type StoredGuestIdentity } from "@/components/public/guest-identity-memory";

interface CheckedReceipt {
  name: string;
  guests: number;
  checkedInAt: string;
  already?: boolean;
}

const timeFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function GuestSelfCheckIn({
  slug,
  couple,
  eventDate,
  venue,
  heroPhoto,
  urlIdentity,
  maxGuests,
  askPhone,
  isOwnerPreview,
}: {
  slug: string;
  couple: string;
  eventDate: string | null;
  venue: string | null;
  heroPhoto: string | null;
  urlIdentity: StoredGuestIdentity | null;
  maxGuests: number;
  askPhone: boolean;
  isOwnerPreview: boolean;
}) {
  const storageKey = `uy_self_checkin:${slug}`;
  const [identity, setIdentity] = useState<StoredGuestIdentity | null>(urlIdentity);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(urlIdentity?.recipientType === "PERSONAL" ? urlIdentity.name : "");
  const [guests, setGuests] = useState(1);
  const [phone, setPhone] = useState(urlIdentity?.phone ?? "");
  const [companions, setCompanions] = useState("");
  const [wish, setWish] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<CheckedReceipt | null>(null);

  useEffect(() => {
    // 1. Restore check-in receipt if already checked in on this phone
    try {
      const savedReceipt = window.localStorage.getItem(storageKey);
      if (savedReceipt) {
        const parsed = JSON.parse(savedReceipt) as CheckedReceipt;
        if (parsed?.name && parsed?.checkedInAt) setReceipt(parsed);
      }
    } catch {
      // Ignore storage errors
    }

    // 2. If URL didn't carry ?to=, check whether the guest opened a personal invitation link earlier
    if (!urlIdentity) {
      const remembered = loadGuestIdentity(slug);
      if (remembered) {
        setIdentity(remembered);
        if (remembered.recipientType === "PERSONAL") {
          setName(remembered.name);
          if (remembered.phone) setPhone(remembered.phone);
        }
      }
    } else {
      saveGuestIdentity(slug, urlIdentity);
    }
  }, [slug, storageKey, urlIdentity]);

  const isRecognizedPersonal = Boolean(identity?.recipientType === "PERSONAL" && identity.name && !editingName);
  const isGroupContext = Boolean(identity?.recipientType === "GROUP" && identity.name);
  const effectiveMaxGuests = Math.min(Math.max(identity?.maxGuests ?? maxGuests, 1), 20);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = (isRecognizedPersonal ? identity!.name : name).trim();
    if (!cleanName) {
      toast.error("Silakan tulis nama Anda terlebih dahulu");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          guestName: cleanName,
          guests,
          phone: phone || null,
          companions: guests > 1 ? companions.trim() || null : null,
          wish: wish.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        already?: boolean;
        guest?: { name: string; guests: number; checkedInAt: string };
        message?: string;
      };
      if (!res.ok || !data.guest) {
        toast.error(data.message || "Gagal mencatat kehadiran, coba lagi ya.");
        return;
      }

      const nextReceipt: CheckedReceipt = {
        name: data.guest.name,
        guests: data.guest.guests,
        checkedInAt: data.guest.checkedInAt,
        already: data.already,
      };
      setReceipt(nextReceipt);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(nextReceipt));
      } catch {
        // Ignore storage errors
      }
      toast.success(data.already ? "Kehadiran Anda sudah tercatat sebelumnya" : "Terima kasih! Kehadiran Anda tercatat.");
    } catch {
      toast.error("Koneksi terganggu, coba lagi sebentar.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForAnotherGuest = () => {
    setReceipt(null);
    setEditingName(true);
    setName("");
    setGuests(1);
    setPhone("");
    setCompanions("");
    setWish("");
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
  };

  const invitationHref = `/${slug}${isOwnerPreview ? "?preview=1" : ""}`;

  return (
    <div className="overflow-hidden rounded-3xl border border-[#EDE3CF] bg-white shadow-[0_24px_60px_-34px_rgba(26,21,16,0.28)]">
      {/* Couple Header Banner */}
      <div className="relative isolate overflow-hidden bg-[#1A1510] px-6 py-8 text-center text-[#F6EEDD]">
        {heroPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhoto}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_25%] opacity-35"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(26,21,16,0.65)_0%,rgba(26,21,16,0.92)_100%)]"
        />
        <div aria-hidden className="uy-lattice-light pointer-events-none absolute inset-0 -z-10 opacity-60" />

        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#D9B56A]">
          Buku Tamu &amp; Check-in Kehadiran
        </p>
        <h1 className="mt-2 font-(family-name:--font-landing-display) text-4xl leading-tight">{couple}</h1>
        {(eventDate || venue) && (
          <div className="mt-3 flex flex-col items-center gap-1 text-xs text-[#E2D6BE]">
            {eventDate && (
              <p className="flex items-center gap-1.5">
                <IconCalendarEvent size={14} className="text-[#D9B56A]" /> {eventDate}
              </p>
            )}
            {venue && (
              <p className="flex items-center gap-1.5">
                <IconMapPin size={14} className="text-[#D9B56A]" /> {venue}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Body: Receipt or Form */}
      <div className="p-6">
        {receipt ? (
          <div className="space-y-5 py-2 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#EEF4EA] text-[#3F6B3A]">
              <IconCheck size={32} stroke={2.4} />
            </span>

            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#3F6B3A]">
                {receipt.already ? "Sudah tercatat sebelumnya" : "Kehadiran tercatat"}
              </p>
              <h2 className="font-(family-name:--font-landing-display) text-3xl text-[#1F1A14]">
                Selamat datang, {receipt.name}
              </h2>
              <p className="text-sm leading-relaxed text-[#6B5F50]">
                Terima kasih telah hadir dan turut mendoakan hari bahagia {couple}. Silakan menikmati rangkaian acara.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#EDE3CF] bg-[#FCF8F1] px-4 py-3 text-xs text-[#40372B]">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#1F1A14]">
                <IconUserCheck size={15} className="text-[#8A6424]" /> {receipt.guests} orang
              </span>
              <span className="text-[#C4B7A0]">·</span>
              <span className="tabular-nums text-[#6B5F50]">{timeFmt.format(new Date(receipt.checkedInAt))}</span>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <Link href={invitationHref} className={buttonVariants({ variant: "gold", className: "h-11 w-full" })}>
                <IconExternalLink size={16} /> Buka Undangan Digital
              </Link>
              <button
                type="button"
                onClick={resetForAnotherGuest}
                className="min-h-10 text-xs font-medium text-[#6B5F50] hover:text-[#1F1A14] hover:underline"
              >
                Isi kehadiran untuk tamu lain
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRecognizedPersonal ? (
              /* Auto-recognized personal guest: NO need to type name again! */
              <div className="rounded-2xl border border-[#E6D7BC] bg-[#FCF8F1] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A6424]">
                      <IconCheck size={12} /> Undangan personal dikenali
                    </p>
                    <p className="mt-1 truncate font-(family-name:--font-landing-display) text-2xl text-[#1F1A14]">
                      {identity!.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[#6B5F50]">
                      Tidak perlu menulis nama lagi — langsung ketuk konfirmasi kehadiran di bawah.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(true);
                      setName(identity!.name);
                    }}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-[#E9DDC6] bg-white px-2.5 text-[11px] font-medium text-[#6B5F50] transition hover:border-[#8A6424] hover:text-[#1F1A14]"
                  >
                    <IconPencil size={12} /> Ganti
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <h2 className="font-(family-name:--font-landing-display) text-2xl text-[#1F1A14]">Selamat Datang</h2>
                  <p className="text-xs leading-relaxed text-[#6B5F50]">
                    {isGroupContext
                      ? `Tamu dari undangan grup "${identity!.name}". Silakan tulis nama pribadi Anda untuk check-in.`
                      : "Silakan isi nama Anda untuk mencatat kehadiran di buku tamu digital."}
                  </p>
                </div>

                {isGroupContext && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-3 py-1 text-xs font-medium text-[#8A6424]">
                    <IconUsersGroup size={14} /> Undangan Grup · {identity!.name}
                  </div>
                )}

                <label className="block space-y-1.5">
                  <span className="block text-xs font-medium text-[#1F1A14]">
                    Nama Lengkap <span className="text-[#9A3B2E]">*</span>
                  </span>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    maxLength={100}
                    required
                    autoFocus
                    className="h-11 rounded-xl border-[#E9DDC6] bg-[#FCF8F1]/60 text-base md:text-sm"
                  />
                </label>
              </>
            )}

            {/* Guest count stepper */}
            <div className="space-y-1.5">
              <span className="block text-xs font-medium text-[#1F1A14]">Jumlah Tamu yang Hadir</span>
              <div className="flex h-11 items-center justify-between rounded-xl border border-[#E9DDC6] bg-[#FCF8F1]/60 px-2">
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                  disabled={guests <= 1}
                  aria-label="Kurangi jumlah tamu"
                  className="flex size-8 items-center justify-center rounded-lg bg-white text-[#1F1A14] shadow-2xs transition hover:bg-[#F6EEDF] disabled:opacity-40"
                >
                  <IconMinus size={15} />
                </button>
                <span className="text-sm font-semibold tabular-nums text-[#1F1A14]">{guests} orang</span>
                <button
                  type="button"
                  onClick={() => setGuests((g) => Math.min(effectiveMaxGuests, g + 1))}
                  disabled={guests >= effectiveMaxGuests}
                  aria-label="Tambah jumlah tamu"
                  className="flex size-8 items-center justify-center rounded-lg bg-white text-[#1F1A14] shadow-2xs transition hover:bg-[#F6EEDF] disabled:opacity-40"
                >
                  <IconPlus size={15} />
                </button>
              </div>
            </div>

            {guests > 1 && (
              <label className="block space-y-1.5">
                <span className="block text-xs font-medium text-[#1F1A14]">Nama Pendamping (opsional)</span>
                <Input
                  value={companions}
                  onChange={(e) => setCompanions(e.target.value)}
                  placeholder="Contoh: Ibu Siti, Dinda"
                  maxLength={300}
                  className="h-11 rounded-xl border-[#E9DDC6] bg-[#FCF8F1]/60 text-base md:text-sm"
                />
              </label>
            )}

            {askPhone && !isRecognizedPersonal && (
              <div className="space-y-1.5">
                <label htmlFor="self-checkin-phone" className="block text-xs font-medium text-[#1F1A14]">
                  Nomor WhatsApp (opsional)
                </label>
                <PhoneInput
                  id="self-checkin-phone"
                  value={phone}
                  onChange={setPhone}
                  className="h-11 rounded-xl border-[#E9DDC6] bg-[#FCF8F1]/60"
                />
              </div>
            )}

            <label className="block space-y-1.5">
              <span className="block text-xs font-medium text-[#1F1A14]">Ucapan &amp; Doa Singkat (opsional)</span>
              <Textarea
                value={wish}
                onChange={(e) => setWish(e.target.value)}
                placeholder={`Tuliskan doa terbaik untuk ${couple}…`}
                rows={isRecognizedPersonal ? 2 : 3}
                maxLength={500}
                className="rounded-xl border-[#E9DDC6] bg-[#FCF8F1]/60 text-base md:text-sm"
              />
            </label>

            <Button type="submit" variant="gold" disabled={submitting} className="h-12 w-full text-sm">
              <IconUserCheck size={18} />
              {submitting
                ? "Mencatat kehadiran…"
                : isRecognizedPersonal
                  ? `Konfirmasi Hadir · ${identity!.name}`
                  : "Konfirmasi Kehadiran"}
            </Button>

            <p className="text-center text-[11px] text-[#8E8268]">
              Kehadiran Anda langsung tercatat di buku tamu digital mempelai.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
