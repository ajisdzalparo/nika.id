/* eslint-disable @typescript-eslint/no-explicit-any */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IconUpload } from "@tabler/icons-react";
import Image from "next/image";

interface MempelaiSectionProps {
  data: any;
  handleUpdate: (section: "groom" | "bride", field: string, value: any) => void;
  handleFileUpload: (section: "groom" | "bride", file: File) => Promise<unknown>;
  renderExtraFields: (section: string) => React.ReactNode;
}

export function MempelaiSection({ data, handleUpdate, handleFileUpload, renderExtraFields }: MempelaiSectionProps) {
  const renderMempelaiForm = (type: "groom" | "bride", label: string) => {
    const sectionData = data[type];
    const isGroom = type === "groom";

    return (
      <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-[2rem] p-6 border border-zinc-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${isGroom ? "bg-blue-100 text-blue-500" : "bg-pink-100 text-pink-500"}`}>{isGroom ? "👨‍⚖️" : "👰‍♀️"}</div>
          <div>
            <h3 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-100">{label}</h3>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Data Utama</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase">Nama Panggilan</Label>
              <Input
                value={sectionData.nickname}
                onChange={(e) => handleUpdate(type, "nickname", e.target.value)}
                placeholder={`Contoh: ${isGroom ? "Romeo" : "Juliet"}`}
                className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl h-12 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase">Nama Lengkap</Label>
              <Input
                value={sectionData.fullName}
                onChange={(e) => handleUpdate(type, "fullName", e.target.value)}
                placeholder="Nama lengkap beserta gelar"
                className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl h-12 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase">Nama Ayah</Label>
              <Input
                value={sectionData.fatherName}
                onChange={(e) => handleUpdate(type, "fatherName", e.target.value)}
                placeholder="Nama Ayah"
                className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl h-12 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase">Nama Ibu</Label>
              <Input
                value={sectionData.motherName}
                onChange={(e) => handleUpdate(type, "motherName", e.target.value)}
                placeholder="Nama Ibu"
                className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl h-12 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase">Username Instagram</Label>
              <Input
                value={sectionData.instagram}
                onChange={(e) => handleUpdate(type, "instagram", e.target.value)}
                placeholder="@username"
                className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl h-12 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-xs font-bold text-zinc-500 uppercase">Foto {label}</Label>
            <div className="aspect-square relative rounded-[1.5rem] overflow-hidden border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 group transition-all hover:border-primary/50">
              {sectionData.photo ? (
                <Image src={sectionData.photo} alt={label} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                  <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-2">
                    <IconUpload size={24} />
                  </div>
                  <span className="text-sm font-medium">Upload Foto</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                <Button variant="secondary" size="sm" className="relative cursor-pointer rounded-full" asChild>
                  <label>
                    Ganti Foto
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(type, e.target.files[0])} />
                  </label>
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 text-center">Disarankan rasio 1:1 (Persegi). Max 2MB.</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-8">
      {renderMempelaiForm("groom", "Mempelai Pria")}
      {renderMempelaiForm("bride", "Mempelai Wanita")}
      {renderExtraFields("mempelai")}
    </div>
  );
}
