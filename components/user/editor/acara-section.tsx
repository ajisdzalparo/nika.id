import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconMapPin, IconTrash, IconPlus } from "@tabler/icons-react";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Daftar Acara</h2>
        <Button variant="outline" size="sm" onClick={addEvent}>
          <IconPlus className="h-4 w-4 mr-2" /> Tambah Acara
        </Button>
      </div>

      {data.events?.map((event, index) => (
        <Card key={event.id} className="border-none shadow-lg relative">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10" onClick={() => removeEvent(index)}>
            <IconTrash className="h-4 w-4 text-red-500" />
          </Button>
          <CardHeader>
            <CardTitle className="text-lg">
              <Input className="border-none text-lg font-bold p-0 focus-visible:ring-0 w-auto" value={event.title || ""} onChange={(e) => updateEvent(index, "title", e.target.value)} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" value={typeof event.date === "string" ? event.date : ""} onChange={(e) => updateEvent(index, "date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Waktu</Label>
                <Input type="time" value={event.time || ""} onChange={(e) => updateEvent(index, "time", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nama Tempat / Gedung</Label>
              <Input value={event.venue || ""} onChange={(e) => updateEvent(index, "venue", e.target.value)} placeholder="Gedung Serbaguna XYZ" />
            </div>
            <div className="space-y-2">
              <Label>Alamat Lengkap</Label>
              <Textarea value={event.address || ""} onChange={(e) => updateEvent(index, "address", e.target.value)} placeholder="Jl. Merdeka No. 1..." />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <IconMapPin className="h-4 w-4 text-red-500" />
                Link Google Maps
              </Label>
              <Input value={event.mapUrl || ""} onChange={(e) => updateEvent(index, "mapUrl", e.target.value)} placeholder="https://maps.google.com/..." />
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Fitur Acara Lanjutan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Live Streaming</Label>
              <p className="text-sm text-muted-foreground italic">Aktifkan link untuk tamu yang hadir online</p>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-gray-300 text-pink-500"
              checked={data.streaming?.enabled}
              onChange={(e) => setData((prev) => ({ ...prev, streaming: { ...prev.streaming!, enabled: e.target.checked } }))}
            />
          </div>
          {data.streaming?.enabled && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Input value={data.streaming.platform} onChange={(e) => setData((prev) => ({ ...prev, streaming: { ...prev.streaming!, platform: e.target.value } }))} placeholder="Zoom / YouTube / IG Live" />
              </div>
              <div className="space-y-2">
                <Label>Link Streaming</Label>
                <Input value={data.streaming.url} onChange={(e) => setData((prev) => ({ ...prev, streaming: { ...prev.streaming!, url: e.target.value } }))} placeholder="https://..." />
              </div>
            </div>
          )}
          <div className="h-px bg-gray-100" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Protokol Kesehatan</Label>
              <p className="text-sm text-muted-foreground italic">Tampilkan anjuran prokes pada undangan</p>
            </div>
            <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-pink-500" checked={data.protocol?.enabled} onChange={(e) => setData((prev) => ({ ...prev, protocol: { ...prev.protocol!, enabled: e.target.checked } }))} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
