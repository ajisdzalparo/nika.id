/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IconHeart, IconCalendar, IconPhoto, IconAdjustmentsHorizontal, IconDeviceFloppy, IconLoader2 } from "@tabler/icons-react";
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
  { id: "fitur", label: "Fitur", icon: IconAdjustmentsHorizontal },
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
      success: "Foto berhasil diunggah",
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

      toast.success("Undangan berhasil diperbarui");
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col gap-6 xl:flex-row xl:gap-8">
      {/* Mobile Horizontal Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] xl:hidden">
        {SECTIONS.map((section, idx) => {
          const active = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all",
                active ? "border-[#1E1B17] bg-[#1E1B17] text-[#F7F3EC]" : "border-[#E1D8C9] bg-[#FFFDF9] text-[#6B6358]",
              )}
            >
              <section.icon size={16} strokeWidth={1.7} />
              <span>{String(idx + 1).padStart(2, "0")}. {section.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden xl:block xl:w-64 shrink-0 xl:sticky xl:top-24 self-start space-y-4">
        <div className="rounded-2xl border border-[#E1D8C9] bg-[#FFFDF9] p-3">
          <h2 className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8C8272]">Navigasi</h2>
          <nav className="flex flex-col gap-1.5">
            {SECTIONS.map((section, idx) => {
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-all",
                    active ? "bg-[#1E1B17] text-[#F7F3EC] shadow-xs" : "text-[#6B6358] hover:bg-[#F7F3EC] hover:text-[#1E1B17]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      active ? "bg-white/15 text-[#C9A45C]" : "bg-[#EFE8DC] text-[#8A6A2F]",
                    )}
                  >
                    <section.icon size={17} strokeWidth={1.7} />
                  </span>
                  <span className="flex-1 truncate">{section.label}</span>
                  <span className={cn("text-[11px] tabular-nums", active ? "text-[#B8AD9A]" : "text-[#A59B8C]")}>{String(idx + 1).padStart(2, "0")}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="rounded-2xl bg-[#15130F] p-5 text-[#F3EBDD]">
          <h3 className="font-serif text-2xl font-medium text-[#C9A45C]">Sudah selesai?</h3>
          <p className="mt-1 mb-4 text-sm leading-relaxed text-[#B8AD9A]">Simpan perubahan untuk memperbarui undangan.</p>
          <Button onClick={onSave} disabled={loading} className="h-11 w-full rounded-full bg-[#F3EBDD] text-[#15130F] hover:bg-white">
            {loading ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconDeviceFloppy className="mr-2 h-4 w-4" />}
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="@container flex-1 min-w-0">
        <div className="rounded-2xl border border-[#E1D8C9] bg-[#FFFDF9] p-5 sm:p-7">
          <div className="mb-7 flex flex-col justify-between gap-4 border-b border-[#E1D8C9] pb-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#8A6A2F]">
                Bagian {String(SECTIONS.findIndex((s) => s.id === activeSection) + 1).padStart(2, "0")}
              </p>
              <h1 className="mt-1 font-serif text-3xl font-medium text-[#1E1B17]">{SECTIONS.find((s) => s.id === activeSection)?.label}</h1>
              <p className="mt-1 text-sm text-[#6B6358]">
                {activeSection === "mempelai" && "Lengkapi nama panggilan, nama lengkap, dan orang tua kedua mempelai."}
                {activeSection === "acara" && "Atur jadwal, lokasi peta, serta live streaming acara pernikahan."}
                {activeSection === "galeri" && "Tambahkan video prewedding dan foto galeri pilihan Anda."}
                {activeSection === "fitur" && "Atur musik latar (YouTube atau S3), amplop digital, turut mengundang, dan kisah cinta."}
              </p>
            </div>
            <Button onClick={onSave} disabled={loading} className="h-11 shrink-0 rounded-full bg-[#1E1B17] px-6 text-[#F7F3EC] hover:bg-[#2E2A24] xl:hidden">
              {loading ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconDeviceFloppy className="mr-2 h-4 w-4" />}
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>

          <div key={activeSection} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
