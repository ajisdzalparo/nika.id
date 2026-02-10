/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IconHeart, IconCalendar, IconPhoto, IconSparkles } from "@tabler/icons-react";
import { toast } from "sonner";
import { WeddingData } from "@/types/wedding";
import { MempelaiSection } from "./editor/mempelai-section";
import { AcaraSection } from "./editor/acara-section";
import { GaleriSection } from "./editor/galeri-section";
import { FiturSection } from "./editor/fitur-section";

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
  const [data, setData] = useState<WeddingData & { extra?: Record<string, string> }>(() => {
    const defaults: WeddingData = {
      groom: { nickname: "", fullName: "", instagram: "", fatherName: "", motherName: "", photo: "" },
      bride: { nickname: "", fullName: "", instagram: "", fatherName: "", motherName: "", photo: "" },
      events: [
        { id: "1", title: "Akad Nikah", date: "", time: "", venue: "", address: "", mapUrl: "" },
        { id: "2", title: "Resepsi", date: "", time: "", venue: "", address: "", mapUrl: "" },
      ],
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

  const handleUpdate = (section: keyof WeddingData | "extra", field: string, value: any) => {
    setData((prev: any) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value,
      },
    }));
  };

  const handleFileUpload = async (section: "groom" | "bride", file: File) => {
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

        handleUpdate(section, "photo", url);
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
            <Textarea value={(data.extra?.[field.id] as string) || ""} onChange={(e) => handleUpdate("extra", field.id, e.target.value)} placeholder={field.placeholder} />
          ) : (
            <Input type={field.type} value={(data.extra?.[field.id] as string) || ""} onChange={(e) => handleUpdate("extra", field.id, e.target.value)} placeholder={field.placeholder} />
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

        <TabsContent value="mempelai">
          <MempelaiSection data={data} handleUpdate={handleUpdate} handleFileUpload={handleFileUpload} renderExtraFields={renderExtraFields} />
        </TabsContent>

        <TabsContent value="acara">
          <AcaraSection data={data} setData={setData} />
        </TabsContent>

        <TabsContent value="galeri">
          <GaleriSection data={data} setData={setData} renderExtraFields={renderExtraFields} />
        </TabsContent>

        <TabsContent value="fitur">
          <FiturSection data={data} setData={setData} handleUpdate={handleUpdate} renderExtraFields={renderExtraFields} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
