/* eslint-disable @next/next/no-img-element */
import { IconPhoto, IconPlus, IconTrash, IconVideo } from "@tabler/icons-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeddingData } from "@/types/wedding";

interface GaleriSectionProps {
  data: WeddingData;
  setData: React.Dispatch<React.SetStateAction<WeddingData & { extra?: Record<string, string> }>>;
  renderExtraFields: (section: string) => React.ReactNode;
}

export function GaleriSection({ data, setData, renderExtraFields }: GaleriSectionProps) {
  const handlePhotoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload/image", { method: "POST", body: formData });
    const result = await res.json();
    if (result.url) {
      setData((prev) => ({ ...prev, gallery: [...(prev.gallery || []), result.url] }));
      toast.success("Foto berhasil diunggah");
    } else {
      toast.error(result.error || "Gagal mengunggah foto");
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = (data.gallery || []).filter((_, i) => i !== index);
    setData((prev) => ({ ...prev, gallery: newPhotos }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#E9DDC6] bg-[#FCF8F1]/55 p-5 sm:p-6 space-y-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B5F50]">
            <IconVideo size={14} className="text-[#8A6424]" />
            Link Video Prewedding (YouTube / Vimeo)
          </Label>
          <Input
            value={data.video || ""}
            onChange={(e) => setData((prev) => ({ ...prev, video: e.target.value }))}
            placeholder="https://www.youtube.com/watch?v=..."
            className="h-11 rounded-xl border-[#E9DDC6] bg-[#FFFDF9]"
          />
          <p className="text-xs text-[#6B5F50]">Opsional. Video akan ditampilkan di bagian galeri undangan.</p>
        </div>

        <div className="h-px bg-[#E9DDC6]" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B5F50]">
              <IconPhoto size={14} className="text-[#8A6424]" />
              Foto Galeri ({(data.gallery || []).length})
            </Label>
          </div>
          <div className="grid grid-cols-2 gap-3 @md:grid-cols-3 @2xl:grid-cols-4">
            {(data.gallery || []).map((photo, index) => (
              <div key={index} className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-[#E9DDC6] bg-[#FFFDF9]">
                <img src={photo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" alt={`Galeri ${index + 1}`} />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  aria-label={`Hapus foto ${index + 1}`}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-600"
                >
                  <IconTrash className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#D9CBAE] bg-[#FFFDF9] p-4 text-center transition-colors hover:border-[#8A6424]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5EDDD] text-[#8A6424]">
                <IconPlus className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium text-[#1F1A14]">Tambah Foto</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
              />
            </label>
          </div>
        </div>
        {renderExtraFields("galeri")}
      </section>
    </div>
  );
}
