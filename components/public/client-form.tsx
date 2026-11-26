"use client";

import { waLink } from "@/lib/phone";
import { useState } from "react";
import { toast } from "sonner";
import { IconBrandWhatsapp, IconCheck, IconLoader2, IconMapPin, IconPlus, IconTrash } from "@tabler/icons-react";
import { DatePickerField } from "@/components/common/date-time-picker";
import { LocationPicker, mapsLink, type PickedLocation } from "@/components/common/location-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PersonForm {
  nickname: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  instagram: string;
}

interface EventForm {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  mapUrl: string;
  lat?: number;
  lng?: number;
}

interface BankForm {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
}

interface ClientFormProps {
  token: string;
  invitationTitle: string;
  agencyName: string;
  agencyWhatsapp: string | null;
  clientName: string | null;
  initial: {
    groom: PersonForm;
    bride: PersonForm;
    events: EventForm[];
    story: { title: string; content: string };
    quote: { text: string; source: string };
    bankAccounts: BankForm[];
  };
}

const fieldCls = "h-11 rounded-xl border-[#E9DDC6] bg-[#FCF8F1] text-[15px] placeholder:text-[#A59B8C] focus:border-[#8A6424]";

export function ClientForm({ token, invitationTitle, agencyName, agencyWhatsapp, clientName, initial }: ClientFormProps) {
  const [groom, setGroom] = useState<PersonForm>(initial.groom);
  const [bride, setBride] = useState<PersonForm>(initial.bride);
  const [events, setEvents] = useState<EventForm[]>(initial.events);
  const [story, setStory] = useState(initial.story);
  const [quote, setQuote] = useState(initial.quote);
  const [banks, setBanks] = useState<BankForm[]>(initial.bankAccounts);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/public/client-form/${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groom,
          bride,
          events,
          story,
          quote,
          bankAccounts: banks,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(d.message || "Gagal menyimpan data undangan");
        return;
      }
      setSavedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      toast.success("Data undangan berhasil disimpan!");
    } catch {
      toast.error("Koneksi bermasalah, coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const updatePerson = (which: "groom" | "bride", key: keyof PersonForm, val: string) => {
    const setter = which === "groom" ? setGroom : setBride;
    setter((prev) => ({ ...prev, [key]: val }));
  };

  const updateEvent = (idx: number, key: keyof EventForm, val: string) => {
    setEvents((prev) => prev.map((ev, i) => (i === idx ? { ...ev, [key]: val } : ev)));
  };

  const setEventLocation = (idx: number, loc: PickedLocation) => {
    setEvents((prev) =>
      prev.map((ev, i) =>
        i === idx
          ? {
              ...ev,
              lat: loc.lat,
              lng: loc.lng,
              mapUrl: mapsLink(loc.lat, loc.lng),
              address: ev.address || loc.address || "",
            }
          : ev,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-[#FCF8F1] px-4 py-8 text-[#1F1A14] sm:py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2 rounded-2xl border border-[#E9DDC6] bg-[#FFFDF9] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A6424]">
            Pengisian Data Undangan · {agencyName}
          </p>
          <h1 className="font-serif text-3xl font-medium text-[#1A1510] sm:text-4xl">{invitationTitle}</h1>
          <p className="text-sm leading-relaxed text-[#5E5446]">
            {clientName ? `Halo ${clientName}, silakan ` : "Silakan "}lengkapi data mempelai, jadwal acara, dan rekening amplop digital di bawah ini. Perubahan langsung tersimpan ke draf undangan Anda tanpa perlu membuat akun.
          </p>
        </header>

        {savedAt && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E6D5B2] bg-[#F7F0E1] px-5 py-3.5 text-sm text-[#5C431A]">
            <span className="flex items-center gap-2 font-medium">
              <IconCheck size={17} className="text-[#8A6424]" /> Data tersimpan pada pukul {savedAt}. Tim {agencyName} dapat langsung memproses desainnya.
            </span>
            {agencyWhatsapp && (
              <a
                href={waLink(agencyWhatsapp, `Halo ${agencyName}, data undangan "${invitationTitle}" sudah kami lengkapi.`) ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[#8A6424] underline underline-offset-4 hover:text-[#1F1A14]"
              >
                <IconBrandWhatsapp size={16} /> Kabari via WhatsApp
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Groom & Bride */}
          {(
            [
              ["groom", "Mempelai Pria", groom],
              ["bride", "Mempelai Wanita", bride],
            ] as const
          ).map(([key, heading, person]) => (
            <section key={key} className="space-y-4 rounded-2xl border border-[#E9DDC6] bg-[#FFFDF9] p-5 sm:p-6">
              <h2 className="font-serif text-2xl font-medium text-[#1A1510]">{heading}</h2>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="block text-sm font-medium leading-none">Nama Panggilan</span>
                  <Input
                    className={fieldCls}
                    value={person.nickname}
                    onChange={(e) => updatePerson(key, "nickname", e.target.value)}
                    placeholder={key === "groom" ? "Contoh: Adit" : "Contoh: Sarah"}
                    required
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="block text-sm font-medium leading-none">Nama Lengkap & Gelar</span>
                  <Input
                    className={fieldCls}
                    value={person.fullName}
                    onChange={(e) => updatePerson(key, "fullName", e.target.value)}
                    placeholder={key === "groom" ? "Contoh: Aditya Pratama, S.T." : "Contoh: Sarah Wijaya, S.Pd."}
                    required
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="block text-sm font-medium leading-none">Nama Ayah</span>
                  <Input
                    className={fieldCls}
                    value={person.fatherName}
                    onChange={(e) => updatePerson(key, "fatherName", e.target.value)}
                    placeholder="Contoh: Bpk. Hendra"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="block text-sm font-medium leading-none">Nama Ibu</span>
                  <Input
                    className={fieldCls}
                    value={person.motherName}
                    onChange={(e) => updatePerson(key, "motherName", e.target.value)}
                    placeholder="Contoh: Ibu Ratna"
                  />
                </label>
              </div>
              <label className="block space-y-1.5">
                <span className="block text-sm font-medium leading-none">Username Instagram (opsional)</span>
                <Input
                  className={fieldCls}
                  value={person.instagram}
                  onChange={(e) => updatePerson(key, "instagram", e.target.value)}
                  placeholder="@username"
                />
              </label>
            </section>
          ))}

          {/* Events */}
          <section className="space-y-4 rounded-2xl border border-[#E9DDC6] bg-[#FFFDF9] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif text-2xl font-medium text-[#1A1510]">Jadwal & Lokasi Acara</h2>
              {events.length < 4 && (
                <button
                  type="button"
                  onClick={() =>
                    setEvents((prev) => [
                      ...prev,
                      { id: `ev-${Date.now()}`, title: "Acara Tambahan", date: "", time: "", venue: "", address: "", mapUrl: "" },
                    ])
                  }
                  className="inline-flex h-10 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-[#E9DDC6] px-3.5 text-xs font-medium text-[#1A1510] hover:bg-[#FCF8F1]"
                >
                  <IconPlus size={14} /> Tambah Acara
                </button>
              )}
            </div>

            <div className="space-y-5">
              {events.map((ev, idx) => (
                <div key={ev.id} className="space-y-3 rounded-xl border border-[#F3EBDB] bg-[#FCF8F1]/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#8A6424]">Acara {idx + 1}</span>
                    {events.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEvents((prev) => prev.filter((_, i) => i !== idx))}
                        className="-mr-2 inline-flex min-h-9 items-center rounded-full px-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="block space-y-1">
                      <span className="block text-sm font-medium leading-none">Nama Acara</span>
                      <Input className={fieldCls} value={ev.title} onChange={(e) => updateEvent(idx, "title", e.target.value)} placeholder="Contoh: Akad Nikah" />
                    </label>
                    <div className="space-y-1">
                      <span className="block text-sm font-medium leading-none">Tanggal</span>
                      <DatePickerField className={fieldCls} value={ev.date} onChange={(v) => updateEvent(idx, "date", v)} />
                    </div>
                    <label className="block space-y-1">
                      <span className="block text-sm font-medium leading-none">Jam</span>
                      <Input className={fieldCls} value={ev.time} onChange={(e) => updateEvent(idx, "time", e.target.value)} placeholder="Contoh: 08.00 - 10.00 WIB" />
                    </label>
                  </div>
                  <label className="block space-y-1">
                    <span className="block text-sm font-medium leading-none">Nama Tempat / Gedung</span>
                    <Input className={fieldCls} value={ev.venue} onChange={(e) => updateEvent(idx, "venue", e.target.value)} placeholder="Pendopo Agung / Masjid ..." />
                  </label>
                  <label className="block space-y-1">
                    <span className="block text-sm font-medium leading-none">Alamat Lengkap</span>
                    <Input className={fieldCls} value={ev.address} onChange={(e) => updateEvent(idx, "address", e.target.value)} placeholder="Jl. ..." />
                  </label>
                  <div className="space-y-2 pt-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium leading-none">
                      <IconMapPin size={14} className="text-[#8A6424]" /> Cari Lokasi di Google Maps
                    </p>
                    <LocationPicker
                      value={{ lat: ev.lat, lng: ev.lng }}
                      initialQuery={[ev.venue, ev.address].filter(Boolean).join(", ")}
                      onChange={(loc) => setEventLocation(idx, loc)}
                    />
                    <details className="text-xs text-[#6B5F50]">
                      <summary className="flex min-h-8 cursor-pointer items-center hover:text-[#1F1A14]">
                        Atau tempel link Google Maps sendiri
                      </summary>
                      <Input
                        className={`mt-1.5 ${fieldCls}`}
                        value={ev.mapUrl}
                        onChange={(e) => updateEvent(idx, "mapUrl", e.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
                      />
                    </details>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Digital Gift */}
          <section className="space-y-4 rounded-2xl border border-[#E9DDC6] bg-[#FFFDF9] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-2xl font-medium text-[#1A1510]">Amplop Digital (Opsional)</h2>
                <p className="text-xs text-[#6B5F50]">Rekening bank atau e-wallet untuk hadiah dari tamu.</p>
              </div>
              {banks.length < 4 && (
                <button
                  type="button"
                  onClick={() => setBanks((prev) => [...prev, { bankName: "", accountHolder: "", accountNumber: "" }])}
                  className="inline-flex h-10 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-[#E9DDC6] px-3.5 text-xs font-medium text-[#1A1510] hover:bg-[#FCF8F1]"
                >
                  <IconPlus size={14} /> Tambah Rekening
                </button>
              )}
            </div>

            {banks.length === 0 ? (
              <p className="text-xs text-[#6B5F50]">Belum ada rekening ditambahkan.</p>
            ) : (
              <div className="space-y-3">
                {banks.map((b, idx) => (
                  <div key={idx} className="grid gap-2.5 rounded-xl border border-[#F3EBDB] bg-[#FCF8F1]/70 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                    <label className="block space-y-1">
                      <span className="block text-xs font-medium leading-none">Bank / E-wallet</span>
                      <Input
                        className="h-10 bg-white"
                        value={b.bankName}
                        onChange={(e) => setBanks((prev) => prev.map((x, i) => (i === idx ? { ...x, bankName: e.target.value } : x)))}
                        placeholder="BCA / GoPay"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="block text-xs font-medium leading-none">No. Rekening</span>
                      <Input
                        className="h-10 bg-white"
                        value={b.accountNumber}
                        onChange={(e) => setBanks((prev) => prev.map((x, i) => (i === idx ? { ...x, accountNumber: e.target.value } : x)))}
                        placeholder="1234567890"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="block text-xs font-medium leading-none">Atas Nama</span>
                      <Input
                        className="h-10 bg-white"
                        value={b.accountHolder}
                        onChange={(e) => setBanks((prev) => prev.map((x, i) => (i === idx ? { ...x, accountHolder: e.target.value } : x)))}
                        placeholder="Nama sesuai rekening"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setBanks((prev) => prev.filter((_, i) => i !== idx))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                      aria-label="Hapus rekening"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Story & Quote */}
          <section className="space-y-4 rounded-2xl border border-[#E9DDC6] bg-[#FFFDF9] p-5 sm:p-6">
            <h2 className="font-serif text-2xl font-medium text-[#1A1510]">Kutipan & Cerita Singkat (Opsional)</h2>
            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="block text-sm font-medium leading-none">Ayat / Kutipan Pernikahan</span>
                <Textarea
                  className="min-h-20 border-[#E9DDC6] bg-[#FCF8F1] placeholder:text-[#A59B8C]"
                  value={quote.text}
                  onChange={(e) => setQuote((prev) => ({ ...prev, text: e.target.value }))}
                  placeholder="Dan di antara tanda-tanda kekuasaan-Nya..."
                />
              </label>
              <label className="block space-y-1">
                <span className="block text-sm font-medium leading-none">Sumber Kutipan</span>
                <Input className={fieldCls} value={quote.source} onChange={(e) => setQuote((prev) => ({ ...prev, source: e.target.value }))} placeholder="QS. Ar-Rum: 21" />
              </label>
              <label className="block space-y-1">
                <span className="block text-sm font-medium leading-none">Kisah Pertemuan Singkat</span>
                <Textarea
                  className="min-h-24 border-[#E9DDC6] bg-[#FCF8F1] placeholder:text-[#A59B8C]"
                  value={story.content}
                  onChange={(e) => setStory((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Ceritakan singkat awal pertemuan kalian..."
                />
              </label>
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1A1510] px-6 text-sm font-semibold text-[#FCF8F1] transition hover:bg-[#2B241B] disabled:opacity-50"
          >
            {saving ? <IconLoader2 size={17} className="animate-spin" /> : <IconCheck size={17} />}
            {saving ? "Menyimpan..." : "Simpan Data Undangan"}
          </button>
        </form>
      </div>
    </div>
  );
}
