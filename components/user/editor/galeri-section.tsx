/* eslint-disable @next/next/no-img-element */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconTrash, IconPlus } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";
import { toast } from "sonner";

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
      toast.success("Foto berhasil diupload");
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = (data.gallery || []).filter((_, i) => i !== index);
    setData((prev) => ({ ...prev, gallery: newPhotos }));
  };

  return (
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
                <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 rounded-full" onClick={() => removePhoto(index)}>
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
              />
            </label>
          </div>
        </div>
        {renderExtraFields("galeri")}
      </CardContent>
    </Card>
  );
}
