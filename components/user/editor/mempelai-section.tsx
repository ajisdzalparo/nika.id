/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { IconHeart, IconTrash, IconUpload, IconUser } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      <section className="rounded-2xl border border-[#E1D8C9] bg-[#F7F3EC]/55 p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-3.5 border-b border-[#E1D8C9]/80 pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFE8DC] text-[#8A6A2F]">
            {isGroom ? <IconUser size={20} stroke={1.7} /> : <IconHeart size={20} stroke={1.7} />}
          </span>
          <div>
            <h3 className="font-serif text-xl font-medium text-[#1E1B17]">{label}</h3>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#6B6358]">Data Utama</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_210px] md:items-start">
          {/* Fields */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Nama Panggilan</Label>
                <Input
                  value={sectionData.nickname || ""}
                  onChange={(e) => handleUpdate(type, "nickname", e.target.value)}
                  placeholder={`Contoh: ${isGroom ? "Adit" : "Sarah"}`}
                  className="h-11 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Username Instagram</Label>
                <Input
                  value={sectionData.instagram || ""}
                  onChange={(e) => handleUpdate(type, "instagram", e.target.value)}
                  placeholder="@username"
                  className="h-11 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Nama Lengkap</Label>
              <Input
                value={sectionData.fullName || ""}
                onChange={(e) => handleUpdate(type, "fullName", e.target.value)}
                placeholder="Nama lengkap beserta gelar"
                className="h-11 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Nama Ayah</Label>
                <Input
                  value={sectionData.fatherName || ""}
                  onChange={(e) => handleUpdate(type, "fatherName", e.target.value)}
                  placeholder="Nama Ayah"
                  className="h-11 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Nama Ibu</Label>
                <Input
                  value={sectionData.motherName || ""}
                  onChange={(e) => handleUpdate(type, "motherName", e.target.value)}
                  placeholder="Nama Ibu"
                  className="h-11 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]"
                />
              </div>
            </div>
          </div>

          {/* Proportional Portrait Photo Upload */}
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Foto {label}</Label>
            <div className="mx-auto w-full max-w-[210px]">
              {sectionData.photo ? (
                <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-[#E1D8C9] bg-[#FFFDF9]">
                  <img src={sectionData.photo} alt={label} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
                    <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[#FFFDF9] px-3.5 text-xs font-medium text-[#1E1B17] shadow-sm transition-colors hover:bg-[#EFE8DC]">
                      <IconUpload size={14} /> Ganti
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(type, e.target.files[0])} />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleUpdate(type, "photo", "")}
                      aria-label={`Hapus foto ${label}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-red-600"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-[#CFC5B4] bg-[#FFFDF9] p-4 text-center transition-colors hover:border-[#8A6A2F]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFE8DC] text-[#8A6A2F]">
                    <IconUpload size={20} />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-[#1E1B17]">Unggah Foto</p>
                    <p className="text-[11px] text-[#6B6358]">Rasio 3:4 atau 1:1 · Maks. 2MB</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(type, e.target.files[0])} />
                </label>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-6">
      {renderMempelaiForm("groom", "Mempelai Pria")}
      {renderMempelaiForm("bride", "Mempelai Wanita")}
      {renderExtraFields("mempelai")}
    </div>
  );
}
