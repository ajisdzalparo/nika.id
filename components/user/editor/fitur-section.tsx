/* eslint-disable @typescript-eslint/no-explicit-any */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconTrash, IconPlus } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";

interface FiturSectionProps {
  data: WeddingData;
  setData: React.Dispatch<React.SetStateAction<WeddingData & { extra?: Record<string, string> }>>;
  handleUpdate: (section: "story" | "extra" | "music", field: string, value: any) => void;
  renderExtraFields: (section: string) => React.ReactNode;
}

export function FiturSection({ data, setData, handleUpdate, renderExtraFields }: FiturSectionProps) {
  return (
    <div className="space-y-6">
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
                checked={data.music?.enabled}
                onChange={(e) => setData((prev) => ({ ...prev, music: { ...prev.music!, enabled: e.target.checked } }))}
              />
            </div>
            {data.music?.enabled && <Input value={data.music.url} onChange={(e) => handleUpdate("music", "url", e.target.value)} placeholder="Link Audio (mp3) / Google Drive Link" />}
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
                  <div key={index} className="p-4 border rounded-xl space-y-3 relative bg-gray-50/50">
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
                    setData((prev) => ({
                      ...prev,
                      gifts: { ...prev.gifts, bankAccounts: [...prev.gifts.bankAccounts, { bankName: "", accountHolder: "", accountNumber: "" }] },
                    }));
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
                  setData((prev) => ({
                    ...prev,
                    extendedFamily: { ...prev.extendedFamily!, members: [...prev.extendedFamily!.members, ""] },
                  }));
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
    </div>
  );
}
