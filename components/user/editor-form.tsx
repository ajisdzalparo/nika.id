/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IconHeart, IconCalendar, IconPhoto, IconSparkles, IconDeviceFloppy } from "@tabler/icons-react";
import { toast } from "sonner";
import { WeddingData } from "@/types/wedding";
import { MempelaiSection } from "./editor/mempelai-section";
import { AcaraSection } from "./editor/acara-section";
import { GaleriSection } from "./editor/galeri-section";
import { FiturSection } from "./editor/fitur-section";
import { cn } from "@/lib/utils";

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

const SECTIONS = [
  { id: "mempelai", label: "Mempelai", icon: IconHeart },
  { id: "acara", label: "Acara", icon: IconCalendar },
  { id: "galeri", label: "Galeri", icon: IconPhoto },
  { id: "fitur", label: "Fitur", icon: IconSparkles },
] as const;

export function EditorForm({ initialData, templateConfig }: EditorFormProps) {
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<(typeof SECTIONS)[number]["id"]>("mempelai");

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
    const initialGallery = Array.isArray(initial.gallery) ? initial.gallery : initial.gallery?.photos || [];
    const initialVideo = initial.video || initial.gallery?.video || "";

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
      music: { ...defaults.music, ...(initial.music || {}) },
      story: { ...defaults.story, ...(initial.story || {}) },
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
        const response = await fetch("/api/upload/image", {
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
          <Label className="uppercase tracking-wider text-[10px] font-bold text-muted-foreground">{field.label}</Label>
          {field.type === "textarea" ? (
            <Textarea
              className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-primary rounded-xl"
              value={(data.extra?.[field.id] as string) || ""}
              onChange={(e) => handleUpdate("extra", field.id, e.target.value)}
              placeholder={field.placeholder}
            />
          ) : (
            <Input
              className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-primary rounded-xl"
              type={field.type}
              value={(data.extra?.[field.id] as string) || ""}
              onChange={(e) => handleUpdate("extra", field.id, e.target.value)}
              placeholder={field.placeholder}
            />
          )}
        </div>
      ));
  };

  const onSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/invitation", {
        method: "PUT",
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
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-12rem)] relative">
      {/* Sidebar Navigation */}
      <aside className="lg:w-64 shrink-0 lg:sticky lg:top-24 self-start space-y-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h2 className="px-4 mb-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">Navigasi</h2>
          <nav className="flex flex-col gap-2">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-lg text-sm font-medium transition-all text-left relative overflow-hidden group border",
                  activeSection === section.id
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xl"
                    : "bg-white/50 dark:bg-white/5 border-transparent hover:bg-white hover:border-zinc-200 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    activeSection === section.id ? "bg-white/20 text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-white/5 text-zinc-400 group-hover:scale-110 group-hover:text-primary",
                  )}
                >
                  <section.icon size={20} strokeWidth={1.5} />
                </div>
                <span className="tracking-wide relative z-10">{section.label}</span>

                {activeSection === section.id && <div className="absolute inset-0 bg-linear-to-r from-white/10 to-transparent pointer-events-none" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-zinc-900 dark:bg-zinc-800 rounded-xl p-6 text-white shadow-xl relative overflow-hidden group">
          {/* Ambient Gold Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

          <h3 className="font-serif text-lg font-medium mb-1 relative z-10 text-primary">Sudah Selesai?</h3>
          <p className="text-zinc-400 text-sm mb-4 relative z-10">Simpan perubahan untuk memperbarui undangan.</p>
          <Button onClick={onSave} disabled={loading} className="bg-linear-to-r from-primary to-amber-600 hover:from-primary/90 hover:to-amber-600/90 text-white rounded-full px-8 shadow-lg shadow-primary/20">
            {loading ? <span className="animate-spin mr-2">⏳</span> : <IconDeviceFloppy className="w-4 h-4 mr-2" />}
            Simpan
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[600px] relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50 dark:bg-zinc-800 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="relative z-10">
            <div className="mb-8">
              <h1 className="font-serif text-3xl font-medium text-zinc-900 dark:text-zinc-100">{SECTIONS.find((s) => s.id === activeSection)?.label}</h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                {activeSection === "mempelai" && "Informasi data kedua mempelai."}
                {activeSection === "acara" && "Jadwal dan lokasi acara pernikahan."}
                {activeSection === "galeri" && "Foto, video, dan cerita cinta."}
                {activeSection === "fitur" && "Pengaturan musik, hadiah, dan lainnya."}
              </p>
            </div>

            {activeSection === "mempelai" && <MempelaiSection data={data} handleUpdate={handleUpdate} handleFileUpload={handleFileUpload} renderExtraFields={renderExtraFields} />}
            {activeSection === "acara" && <AcaraSection data={data} setData={setData} />}
            {activeSection === "galeri" && <GaleriSection data={data} setData={setData} renderExtraFields={renderExtraFields} />}
            {activeSection === "fitur" && <FiturSection data={data} setData={setData} handleUpdate={handleUpdate} renderExtraFields={renderExtraFields} />}
          </div>
        </div>
      </main>
    </div>
  );
}
