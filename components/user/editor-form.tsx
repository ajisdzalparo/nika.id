/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IconMapPin, IconHeart, IconCalendar, IconPhoto, IconSparkles, IconTrash, IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";

interface WeddingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  mapUrl: string;
}

interface InvitationData {
  groom: { nickname: string; fullName: string; instagram: string; fatherName: string; motherName: string; photo: string };
  bride: { nickname: string; fullName: string; instagram: string; fatherName: string; motherName: string; photo: string };
  events: WeddingEvent[];
  event: {
    date: string;
    time: string;
    venue: string;
    address: string;
    mapUrl: string;
  };
  gallery: string[];
  video: string;
  story: {
    title: string;
    content: string;
  };
  gifts: {
    enabled: boolean;
    bankAccounts: { bankName: string; accountHolder: string; accountNumber: string }[];
  };
  music: {
    enabled: boolean;
    url: string;
  };
  extendedFamily?: {
    title: string;
    members: string[];
  };
  protocol?: {
    enabled: boolean;
    items: string[];
  };
  streaming?: {
    enabled: boolean;
    platform: string;
    url: string;
  };
}

interface TemplateConfig {
  extraFields?: {
    id: string;
    label: string;
    type: "text" | "textarea" | "date" | "time";
    placeholder?: string;
    section: "mempelai" | "acara" | "galeri" | "fitur";
  }[];
}

interface EditorFormProps {
  initialData?: {
    data: any;
  } | null;
  templateConfig?: TemplateConfig | null;
}

export function EditorForm({ initialData, templateConfig }: EditorFormProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InvitationData & { extra?: Record<string, string> }>(() => {
    const defaults = {
      groom: { nickname: "", fullName: "", instagram: "", fatherName: "", motherName: "", photo: "" },
      bride: { nickname: "", fullName: "", instagram: "", fatherName: "", motherName: "", photo: "" },
      events: [
        { id: "1", title: "Akad Nikah", date: "", time: "", venue: "", address: "", mapUrl: "" },
        { id: "2", title: "Resepsi", date: "", time: "", venue: "", address: "", mapUrl: "" },
      ],
      event: { date: "", time: "", venue: "", address: "", mapUrl: "" },
      gallery: [],
      video: "",
      story: { title: "", content: "" },
      gifts: { enabled: false, bankAccounts: [] },
      music: { enabled: false, url: "" },
      extendedFamily: { title: "Turut Mengundang", members: [] },
      protocol: { enabled: true, items: ["Masker", "Cuci Tangan", "Jaga Jarak"] },
      streaming: { enabled: false, platform: "YouTube", url: "" },
      extra: {},
    };

    const initial = initialData?.data || {};

    // Ensure gallery is array and event has mapUrl
    const initialGallery = Array.isArray(initial.gallery) ? initial.gallery : initial.gallery?.photos || [];
    const initialVideo = initial.video || initial.gallery?.video || "";

    // Deep merge to ensure all nested fields exist
    return {
      ...defaults,
      ...initial,
      groom: { ...defaults.groom, ...(initial.groom || {}) },
      bride: { ...defaults.bride, ...(initial.bride || {}) },
      events: (initial.events || (initial.event ? [{ id: "legacy", title: "Acara", ...initial.event }] : defaults.events)).map((e: any) => ({
        ...e,
        mapUrl: e.mapUrl || e.maps || "",
      })),
      extendedFamily: { ...defaults.extendedFamily, ...(initial.extendedFamily || {}) },
      gallery: initialGallery,
      video: initialVideo,
      gifts: { ...defaults.gifts, ...(initial.gifts || {}) },
      protocol: { ...defaults.protocol, ...(initial.protocol || {}) },
      streaming: { ...defaults.streaming, ...(initial.streaming || {}) },
      extra: { ...defaults.extra, ...(initial.extra || {}) },
    };
  });

  const handleUpdate = (section: keyof InvitationData | "extra", field: string, value: any) => {
    setData((prev: any) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value,
      },
    }));
  };

  const handleFileUpload = async (section: "groom" | "bride" | "gallery", file: File, index?: number) => {
    const formData = new FormData();
    formData.append("file", file);

    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Gagal mengupload");
        const { url } = await response.json();

        if (section === "gallery" && typeof index === "number") {
          const newPhotos = [...(data.gallery || [])];
          newPhotos[index] = url;
          setData((prev) => ({ ...prev, gallery: newPhotos }));
        } else if (section !== "gallery") {
          handleUpdate(section, "photo", url);
        }
        resolve(url);
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(promise, {
      loading: "Mengupload foto...",
      success: "Foto berhasil diunggah! ✨",
      error: "Gagal mengupload foto",
    });
  };

  const renderExtraFields = (section: string) => {
    return templateConfig?.extraFields
      ?.filter((f) => f.section === section)
      .map((field) => (
        <div key={field.id} className="space-y-2">
          <Label>{field.label}</Label>
          {field.type === "textarea" ? (
            <Textarea value={data.extra?.[field.id] || ""} onChange={(e) => handleUpdate("extra", field.id, e.target.value)} placeholder={field.placeholder} />
          ) : (
            <Input type={field.type} value={data.extra?.[field.id] || ""} onChange={(e) => handleUpdate("extra", field.id, e.target.value)} placeholder={field.placeholder} />
          )}
        </div>
      ));
  };

  const onSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) throw new Error("Gagal menyimpan data");

      toast.success("Undangan berhasil diperbarui! ✨");
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10 py-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">Editor Undangan</h1>
          <p className="text-sm text-muted-foreground">Kustomisasi momen spesial Anda</p>
        </div>
        <Button onClick={onSave} disabled={loading} className="rounded-full px-8 bg-pink-500 hover:bg-pink-600">
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>

      <Tabs defaultValue="mempelai" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-gray-100 rounded-2xl mb-8">
          <TabsTrigger value="mempelai" className="rounded-xl py-3 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <IconHeart className="h-4 w-4" /> Mempelai
          </TabsTrigger>
          <TabsTrigger value="acara" className="rounded-xl py-3 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <IconCalendar className="h-4 w-4" /> Acara
          </TabsTrigger>
          <TabsTrigger value="galeri" className="rounded-xl py-3 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <IconPhoto className="h-4 w-4" /> Galeri
          </TabsTrigger>
          <TabsTrigger value="fitur" className="rounded-xl py-3 gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <IconSparkles className="h-4 w-4" /> Fitur
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mempelai" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-500">👨‍💼</div>
                  Mempelai Pria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input value={data.groom.fullName || ""} onChange={(e) => handleUpdate("groom", "fullName", e.target.value)} placeholder="Budi Santoso" />
                </div>
                <div className="space-y-2">
                  <Label>Nama Panggilan</Label>
                  <Input value={data.groom.nickname || ""} onChange={(e) => handleUpdate("groom", "nickname", e.target.value)} placeholder="Budi" />
                </div>
                <div className="space-y-2">
                  <Label>Instagram (Tanpa @)</Label>
                  <Input value={data.groom.instagram || ""} onChange={(e) => handleUpdate("groom", "instagram", e.target.value)} placeholder="budisantoso" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Nama Ayah</Label>
                    <Input value={data.groom.fatherName || ""} onChange={(e) => handleUpdate("groom", "fatherName", e.target.value)} placeholder="Bpk. Harto" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Ibu</Label>
                    <Input value={data.groom.motherName || ""} onChange={(e) => handleUpdate("groom", "motherName", e.target.value)} placeholder="Ibu Siti" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Upload Foto</Label>
                  <div className="flex gap-2">
                    <Input value={data.groom.photo} onChange={(e) => handleUpdate("groom", "photo", e.target.value)} placeholder="Link URL Foto" />
                    <Label className="cursor-pointer bg-gray-100 p-2 rounded-xl border hover:bg-gray-200 transition-colors">
                      <IconPlus className="h-5 w-5" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload("groom", file);
                        }}
                      />
                    </Label>
                  </div>
                </div>
                {renderExtraFields("mempelai")}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-pink-50 text-pink-500">👩‍💼</div>
                  Mempelai Wanita
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input value={data.bride.fullName || ""} onChange={(e) => handleUpdate("bride", "fullName", e.target.value)} placeholder="Ani Wijaya" />
                </div>
                <div className="space-y-2">
                  <Label>Nama Panggilan</Label>
                  <Input value={data.bride.nickname || ""} onChange={(e) => handleUpdate("bride", "nickname", e.target.value)} placeholder="Ani" />
                </div>
                <div className="space-y-2">
                  <Label>Instagram (Tanpa @)</Label>
                  <Input value={data.bride.instagram || ""} onChange={(e) => handleUpdate("bride", "instagram", e.target.value)} placeholder="aniwijaya" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Nama Ayah</Label>
                    <Input value={data.bride.fatherName || ""} onChange={(e) => handleUpdate("bride", "fatherName", e.target.value)} placeholder="Bpk. Agus" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Ibu</Label>
                    <Input value={data.bride.motherName || ""} onChange={(e) => handleUpdate("bride", "motherName", e.target.value)} placeholder="Ibu Rina" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Upload Foto</Label>
                  <div className="flex gap-2">
                    <Input value={data.bride.photo} onChange={(e) => handleUpdate("bride", "photo", e.target.value)} placeholder="Link URL Foto" />
                    <Label className="cursor-pointer bg-gray-100 p-2 rounded-xl border hover:bg-gray-200 transition-colors">
                      <IconPlus className="h-5 w-5" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload("bride", file);
                        }}
                      />
                    </Label>
                  </div>
                </div>
                {renderExtraFields("mempelai")}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="acara" className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Daftar Acara</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newEvents = [...(data.events || []), { id: Date.now().toString(), title: "Acara Baru", date: "", time: "", venue: "", address: "", mapUrl: "" }];
                  setData((prev) => ({ ...prev, events: newEvents }));
                }}
              >
                <IconPlus className="h-4 w-4 mr-2" /> Tambah Acara
              </Button>
            </div>

            {data.events?.map((event, index) => (
              <Card key={event.id} className="border-none shadow-lg relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => {
                    const newEvents = data.events.filter((_, i) => i !== index);
                    setData((prev) => ({ ...prev, events: newEvents }));
                  }}
                >
                  <IconTrash className="h-4 w-4 text-red-500" />
                </Button>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <Input
                      className="border-none text-lg font-bold p-0 focus-visible:ring-0 w-auto"
                      value={event.title || ""}
                      onChange={(e) => {
                        const newEvents = [...(data.events || [])];
                        newEvents[index].title = e.target.value;
                        setData((prev) => ({ ...prev, events: newEvents }));
                      }}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tanggal</Label>
                      <Input
                        type="date"
                        value={event.date || ""}
                        onChange={(e) => {
                          const newEvents = [...(data.events || [])];
                          newEvents[index].date = e.target.value;
                          setData((prev) => ({ ...prev, events: newEvents }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Waktu</Label>
                      <Input
                        type="time"
                        value={event.time || ""}
                        onChange={(e) => {
                          const newEvents = [...(data.events || [])];
                          newEvents[index].time = e.target.value;
                          setData((prev) => ({ ...prev, events: newEvents }));
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Tempat / Gedung</Label>
                    <Input
                      value={event.venue || ""}
                      onChange={(e) => {
                        const newEvents = [...(data.events || [])];
                        newEvents[index].venue = e.target.value;
                        setData((prev) => ({ ...prev, events: newEvents }));
                      }}
                      placeholder="Gedung Serbaguna XYZ"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alamat Lengkap</Label>
                    <Textarea
                      value={event.address || ""}
                      onChange={(e) => {
                        const newEvents = [...(data.events || [])];
                        newEvents[index].address = e.target.value;
                        setData((prev) => ({ ...prev, events: newEvents }));
                      }}
                      placeholder="Jl. Merdeka No. 1..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <IconMapPin className="h-4 w-4 text-red-500" />
                      Link Google Maps
                    </Label>
                    <Input
                      value={event.mapUrl || ""}
                      onChange={(e) => {
                        const newEvents = [...(data.events || [])];
                        newEvents[index].mapUrl = e.target.value;
                        setData((prev) => ({ ...prev, events: newEvents }));
                      }}
                      placeholder="https://maps.google.com/..."
                    />
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
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-pink-500"
                    checked={data.protocol?.enabled}
                    onChange={(e) => setData((prev) => ({ ...prev, protocol: { ...prev.protocol!, enabled: e.target.checked } }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="galeri" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Media Gallery</CardTitle>
              <CardDescription>Bagikan momen visual Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Link Video (YouTube/Vimeo)</Label>
                <Input value={data.video || ""} onChange={(e) => setData((prev) => ({ ...prev, video: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." />
              </div>

              <div className="space-y-4">
                <Label>Foto Galeri</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(data.gallery || []).map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img src={photo} className="w-full h-full object-cover" alt="Gallery" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full"
                        onClick={() => {
                          const newPhotos = (data.gallery || []).filter((_, i) => i !== index);
                          setData((prev) => ({ ...prev, gallery: newPhotos }));
                        }}
                      >
                        <IconTrash className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all">
                    <IconPlus className="h-6 w-6 text-gray-400" />
                    <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold text-center px-2">Upload Photo</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append("file", file);
                          const res = await fetch("/api/upload", { method: "POST", body: formData });
                          const result = await res.json();
                          if (result.url) {
                            setData((prev) => ({ ...prev, gallery: [...(prev.gallery || []), result.url] }));
                            toast.success("Foto berhasil diupload");
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              {renderExtraFields("galeri")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fitur" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Digital Gift & Music</CardTitle>
              <CardDescription>Fitur tambahan untuk undangan Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Music Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Musik Latar</Label>
                    <p className="text-sm text-muted-foreground italic">Putar musik otomatis saat undangan dibuka</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                    checked={data.music.enabled}
                    onChange={(e) => setData((prev) => ({ ...prev, music: { ...prev.music, enabled: e.target.checked } }))}
                  />
                </div>
                {data.music.enabled && <Input value={data.music.url} onChange={(e) => handleUpdate("music", "url", e.target.value)} placeholder="Link Audio (mp3) / Google Drive Link" />}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Gift Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Kado Digital (Amplop)</Label>
                    <p className="text-sm text-muted-foreground italic">Aktifkan fitur nomor rekening/e-wallet</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                    checked={data.gifts.enabled}
                    onChange={(e) => setData((prev) => ({ ...prev, gifts: { ...prev.gifts, enabled: e.target.checked } }))}
                  />
                </div>

                {data.gifts.enabled && (
                  <div className="space-y-4">
                    {data.gifts.bankAccounts.map((account, index) => (
                      <div key={index} className="p-4 border rounded-2xl space-y-3 relative bg-gray-50/50">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            const newAccounts = data.gifts.bankAccounts.filter((_, i) => i !== index);
                            setData((prev) => ({ ...prev, gifts: { ...prev.gifts, bankAccounts: newAccounts } }));
                          }}
                        >
                          <IconTrash className="h-4 w-4 text-red-500" />
                        </Button>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Nama Bank/E-Wallet</Label>
                            <Input
                              value={account.bankName}
                              onChange={(e) => {
                                const newAccounts = [...data.gifts.bankAccounts];
                                newAccounts[index].bankName = e.target.value;
                                setData((prev) => ({ ...prev, gifts: { ...prev.gifts, bankAccounts: newAccounts } }));
                              }}
                              placeholder="BCA / Mandiri / Dana"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Atas Nama</Label>
                            <Input
                              value={account.accountHolder}
                              onChange={(e) => {
                                const newAccounts = [...data.gifts.bankAccounts];
                                newAccounts[index].accountHolder = e.target.value;
                                setData((prev) => ({ ...prev, gifts: { ...prev.gifts, bankAccounts: newAccounts } }));
                              }}
                              placeholder="Budi Santoso"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Nomor Rekening</Label>
                          <Input
                            value={account.accountNumber}
                            onChange={(e) => {
                              const newAccounts = [...data.gifts.bankAccounts];
                              newAccounts[index].accountNumber = e.target.value;
                              setData((prev) => ({ ...prev, gifts: { ...prev.gifts, bankAccounts: newAccounts } }));
                            }}
                            placeholder="12345678"
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full border-dashed py-6 rounded-xl"
                      onClick={() => {
                        setData((prev) => ({ ...prev, gifts: { ...prev.gifts, bankAccounts: [...prev.gifts.bankAccounts, { bankName: "", accountHolder: "", accountNumber: "" }] } }));
                      }}
                    >
                      <IconPlus className="h-4 w-4 mr-2" /> Tambah Rekening Baru
                    </Button>
                  </div>
                )}
              </div>

              {renderExtraFields("fitur")}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Turut Mengundang</CardTitle>
              <CardDescription>Daftar keluarga yang ikut mengundang</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Label Section</Label>
                <Input value={data.extendedFamily?.title} onChange={(e) => setData((prev) => ({ ...prev, extendedFamily: { ...prev.extendedFamily!, title: e.target.value } }))} placeholder="Turut Mengundang / Kel. Besar" />
              </div>
              <div className="space-y-4">
                <Label>Nama-nama Keluarga</Label>
                <div className="space-y-2">
                  {data.extendedFamily?.members?.map((member, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={member}
                        onChange={(e) => {
                          const newMembers = [...data.extendedFamily!.members];
                          newMembers[index] = e.target.value;
                          setData((prev) => ({ ...prev, extendedFamily: { ...prev.extendedFamily!, members: newMembers } }));
                        }}
                        placeholder="Nama Keluarga"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newMembers = data.extendedFamily!.members.filter((_, i) => i !== index);
                          setData((prev) => ({ ...prev, extendedFamily: { ...prev.extendedFamily!, members: newMembers } }));
                        }}
                      >
                        <IconTrash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full border-dashed p-4 rounded-xl"
                    onClick={() => {
                      setData((prev) => ({ ...prev, extendedFamily: { ...prev.extendedFamily!, members: [...prev.extendedFamily!.members, ""] } }));
                    }}
                  >
                    <IconPlus className="h-4 w-4 mr-2" /> Tambah Nama
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Love Story</CardTitle>
              <CardDescription>Bagikan perjalanan cinta Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Judul Cerita</Label>
                <Input value={data.story.title} onChange={(e) => handleUpdate("story", "title", e.target.value)} placeholder="Awal Bertemu..." />
              </div>
              <div className="space-y-2">
                <Label>Konten Cerita</Label>
                <Textarea value={data.story.content} onChange={(e) => handleUpdate("story", "content", e.target.value)} rows={6} placeholder="Tuliskan kisah indah Anda..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
