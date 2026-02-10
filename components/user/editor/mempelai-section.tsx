/* eslint-disable @typescript-eslint/no-explicit-any */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconPlus } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";

interface MempelaiSectionProps {
  data: WeddingData;
  handleUpdate: (section: "groom" | "bride" | "extra", field: string, value: any) => void;
  handleFileUpload: (section: "groom" | "bride", file: File) => void;
  renderExtraFields: (section: string) => React.ReactNode;
}

export function MempelaiSection({ data, handleUpdate, handleFileUpload, renderExtraFields }: MempelaiSectionProps) {
  return (
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
              <Input value={data.groom.photo || ""} onChange={(e) => handleUpdate("groom", "photo", e.target.value)} placeholder="Link URL Foto" />
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
              <Input value={data.bride.photo || ""} onChange={(e) => handleUpdate("bride", "photo", e.target.value)} placeholder="Link URL Foto" />
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
  );
}
