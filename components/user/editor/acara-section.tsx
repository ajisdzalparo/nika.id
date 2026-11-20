import { IconMapPin, IconPlus, IconTrash } from "@tabler/icons-react";
import { LocationPicker, mapsLink, type PickedLocation } from "@/components/common/location-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WeddingData, WeddingEvent } from "@/types/wedding";

interface AcaraSectionProps {
  data: WeddingData;
  setData: React.Dispatch<React.SetStateAction<WeddingData & { extra?: Record<string, string> }>>;
}

export function AcaraSection({ data, setData }: AcaraSectionProps) {
  const addEvent = () => {
    const newEvents = [...(data.events || []), { id: Date.now().toString(), title: "Acara Baru", date: "", time: "", venue: "", address: "", mapUrl: "" }];
    setData((prev) => ({ ...prev, events: newEvents }));
  };

  const removeEvent = (index: number) => {
    const newEvents = data.events.filter((_, i) => i !== index);
    setData((prev) => ({ ...prev, events: newEvents }));
  };

  const updateEvent = (index: number, field: keyof WeddingEvent, value: string) => {
    const newEvents = [...(data.events || [])];
    newEvents[index] = { ...newEvents[index], [field]: value };
    setData((prev) => ({ ...prev, events: newEvents }));
  };

  const setLocation = (index: number, loc: PickedLocation) => {
    setData((prev) => {
      const events = [...(prev.events || [])];
      const ev = events[index];
      events[index] = { ...ev, lat: loc.lat, lng: loc.lng, mapUrl: mapsLink(loc.lat, loc.lng), address: ev.address || loc.address || "" };
      return { ...prev, events };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-medium text-[#1E1B17]">Rangkaian Acara</h2>
          <p className="text-xs text-[#6B6358]">Tambahkan Akad Nikah, Resepsi, atau Unduh Mantu beserta pin lokasinya.</p>
        </div>
        <Button variant="outline" onClick={addEvent} className="h-10 rounded-full border-[#CFC5B4] bg-[#FFFDF9] px-4 text-sm text-[#1E1B17] hover:bg-[#EFE8DC]">
          <IconPlus className="mr-1.5 h-4 w-4" /> Tambah Acara
        </Button>
      </div>

      <div className="space-y-5">
        {data.events?.map((event, index) => (
          <section key={event.id} className="relative rounded-2xl border border-[#E1D8C9] bg-[#F7F3EC]/55 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#E1D8C9]/80 pb-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFE8DC] font-serif text-sm italic text-[#8A6A2F]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Input
                  className="h-10 border-none bg-transparent px-1 font-serif text-xl font-medium text-[#1E1B17] shadow-none focus-visible:ring-0"
                  value={event.title || ""}
                  onChange={(e) => updateEvent(index, "title", e.target.value)}
                  placeholder="Judul Acara (mis. Akad Nikah)"
                />
              </div>
              {data.events.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEvent(index)}
                  aria-label="Hapus acara"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#6B6358] transition-colors hover:bg-[#EFE8DC] hover:text-red-600"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Tanggal</Label>
                  <Input type="date" value={typeof event.date === "string" ? event.date : ""} onChange={(e) => updateEvent(index, "date", e.target.value)} className="h-11 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Waktu</Label>
                  <Input type="time" value={event.time || ""} onChange={(e) => updateEvent(index, "time", e.target.value)} className="h-11 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Nama Tempat / Gedung</Label>
                <Input value={event.venue || ""} onChange={(e) => updateEvent(index, "venue", e.target.value)} placeholder="Gedung Serbaguna / Kediaman Mempelai" className="h-11 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Alamat Lengkap</Label>
                <Textarea value={event.address || ""} onChange={(e) => updateEvent(index, "address", e.target.value)} placeholder="Jl. Merdeka No. 1, Bandung" className="min-h-20 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]" />
              </div>

              <div className="space-y-2 pt-1">
                <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">
                  <IconMapPin className="h-3.5 w-3.5 text-[#8A6A2F]" />
                  Lokasi di Peta
                </Label>
                <LocationPicker value={{ lat: event.lat, lng: event.lng }} onChange={(loc) => setLocation(index, loc)} />
                <details className="text-xs text-[#6B6358]">
                  <summary className="flex min-h-9 cursor-pointer items-center hover:text-[#1E1B17]">Atau tempel link Google Maps sendiri</summary>
                  <Input className="mt-1.5 h-10 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]" value={event.mapUrl || ""} onChange={(e) => updateEvent(index, "mapUrl", e.target.value)} placeholder="https://maps.app.goo.gl/..." />
                </details>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Fitur Acara Lanjutan */}
      <section className="rounded-2xl border border-[#E1D8C9] bg-[#F7F3EC]/55 p-5 sm:p-6 space-y-5">
        <h3 className="font-serif text-xl font-medium text-[#1E1B17]">Fitur Acara Lanjutan</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm font-medium text-[#1E1B17]">Live Streaming</Label>
              <p className="text-xs text-[#6B6358]">Aktifkan tautan siaran langsung untuk tamu yang hadir online</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(data.streaming?.enabled)}
              onClick={() => setData((prev) => ({ ...prev, streaming: { ...prev.streaming!, enabled: !prev.streaming?.enabled } }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${data.streaming?.enabled ? "bg-[#1E1B17]" : "bg-[#CFC5B4]"}`}
            >
              <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-[#FFFDF9] transition-transform ${data.streaming?.enabled ? "translate-x-5.5" : "translate-x-1"}`} />
            </button>
          </div>

          {data.streaming?.enabled && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Platform</Label>
                <Input value={data.streaming.platform || ""} onChange={(e) => setData((prev) => ({ ...prev, streaming: { ...prev.streaming!, platform: e.target.value } }))} placeholder="Zoom / YouTube / IG Live" className="h-11 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Link Streaming</Label>
                <Input value={data.streaming.url || ""} onChange={(e) => setData((prev) => ({ ...prev, streaming: { ...prev.streaming!, url: e.target.value } }))} placeholder="https://..." className="h-11 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]" />
              </div>
            </div>
          )}

          <div className="h-px bg-[#E1D8C9]" />

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-sm font-medium text-[#1E1B17]">Protokol Kesehatan</Label>
              <p className="text-xs text-[#6B6358]">Tampilkan anjuran protokol kesehatan pada undangan</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(data.protocol?.enabled)}
              onClick={() => setData((prev) => ({ ...prev, protocol: { ...prev.protocol!, enabled: !prev.protocol?.enabled } }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${data.protocol?.enabled ? "bg-[#1E1B17]" : "bg-[#CFC5B4]"}`}
            >
              <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-[#FFFDF9] transition-transform ${data.protocol?.enabled ? "translate-x-5.5" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
