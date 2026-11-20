/* eslint-disable @typescript-eslint/no-explicit-any */
import { IconGift, IconHeartHandshake, IconMusic, IconPlus, IconTrash, IconUsersGroup } from "@tabler/icons-react";
import { MusicSourcePicker } from "@/components/common/music-source-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      {/* Music Section */}
      <section className="rounded-2xl border border-[#E1D8C9] bg-[#F7F3EC]/55 p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFE8DC] text-[#8A6A2F]">
              <IconMusic size={20} stroke={1.7} />
            </span>
            <div>
              <h3 className="font-serif text-xl font-medium text-[#1E1B17]">Musik Latar</h3>
              <p className="text-xs text-[#6B6358]">Putar musik otomatis dari link YouTube atau file audio yang diunggah ke S3.</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(data.music?.enabled)}
            aria-label="Aktifkan musik latar"
            onClick={() => setData((prev) => ({ ...prev, music: { ...prev.music!, enabled: !prev.music?.enabled } }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${data.music?.enabled ? "bg-[#1E1B17]" : "bg-[#CFC5B4]"}`}
          >
            <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-[#FFFDF9] transition-transform ${data.music?.enabled ? "translate-x-5.5" : "translate-x-1"}`} />
          </button>
        </div>

        {data.music?.enabled && (
          <MusicSourcePicker
            type={data.music?.type}
            url={data.music?.url || ""}
            onChangeType={(t) => handleUpdate("music", "type", t)}
            onChangeUrl={(u) => handleUpdate("music", "url", u)}
          />
        )}
      </section>

      {/* Gift Section */}
      <section className="rounded-2xl border border-[#E1D8C9] bg-[#F7F3EC]/55 p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFE8DC] text-[#8A6A2F]">
              <IconGift size={20} stroke={1.7} />
            </span>
            <div>
              <h3 className="font-serif text-xl font-medium text-[#1E1B17]">Kado Digital (Amplop)</h3>
              <p className="text-xs text-[#6B6358]">Tampilkan nomor rekening atau e-wallet agar tamu mudah mengirim tanda kasih.</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(data.gifts.enabled)}
            aria-label="Aktifkan amplop digital"
            onClick={() => setData((prev) => ({ ...prev, gifts: { ...prev.gifts, enabled: !prev.gifts.enabled } }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${data.gifts.enabled ? "bg-[#1E1B17]" : "bg-[#CFC5B4]"}`}
          >
            <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-[#FFFDF9] transition-transform ${data.gifts.enabled ? "translate-x-5.5" : "translate-x-1"}`} />
          </button>
        </div>

        {data.gifts.enabled && (
          <div className="space-y-4">
            {data.gifts.bankAccounts.map((account, index) => (
              <div key={index} className="relative rounded-xl border border-[#E1D8C9] bg-[#FFFDF9] p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    const newAccounts = data.gifts.bankAccounts.filter((_, i) => i !== index);
                    setData((prev) => ({ ...prev, gifts: { ...prev.gifts, bankAccounts: newAccounts } }));
                  }}
                  aria-label="Hapus rekening"
                  className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6358] transition-colors hover:bg-[#EFE8DC] hover:text-red-600"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
                <div className="grid grid-cols-1 gap-3 pr-8 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Nama Bank / E-Wallet</Label>
                    <Input
                      value={account.bankName}
                      onChange={(e) => {
                        const newAccounts = [...data.gifts.bankAccounts];
                        newAccounts[index].bankName = e.target.value;
                        setData((prev) => ({ ...prev, gifts: { ...prev.gifts, bankAccounts: newAccounts } }));
                      }}
                      placeholder="BCA / Mandiri / GoPay"
                      className="h-10 rounded-xl border-[#E1D8C9] bg-[#F7F3EC]/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Atas Nama</Label>
                    <Input
                      value={account.accountHolder}
                      onChange={(e) => {
                        const newAccounts = [...data.gifts.bankAccounts];
                        newAccounts[index].accountHolder = e.target.value;
                        setData((prev) => ({ ...prev, gifts: { ...prev.gifts, bankAccounts: newAccounts } }));
                      }}
                      placeholder="Nama pemilik rekening"
                      className="h-10 rounded-xl border-[#E1D8C9] bg-[#F7F3EC]/40"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Nomor Rekening</Label>
                  <Input
                    value={account.accountNumber}
                    onChange={(e) => {
                      const newAccounts = [...data.gifts.bankAccounts];
                      newAccounts[index].accountNumber = e.target.value;
                      setData((prev) => ({ ...prev, gifts: { ...prev.gifts, bankAccounts: newAccounts } }));
                    }}
                    placeholder="1234567890"
                    className="h-10 rounded-xl border-[#E1D8C9] bg-[#F7F3EC]/40"
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl border-dashed border-[#CFC5B4] bg-[#FFFDF9] text-[#1E1B17] hover:bg-[#EFE8DC]"
              onClick={() => {
                setData((prev) => ({
                  ...prev,
                  gifts: { ...prev.gifts, bankAccounts: [...prev.gifts.bankAccounts, { bankName: "", accountHolder: "", accountNumber: "" }] },
                }));
              }}
            >
              <IconPlus className="mr-2 h-4 w-4" /> Tambah Rekening Baru
            </Button>
          </div>
        )}
        {renderExtraFields("fitur")}
      </section>

      {/* Turut Mengundang */}
      <section className="rounded-2xl border border-[#E1D8C9] bg-[#F7F3EC]/55 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFE8DC] text-[#8A6A2F]">
            <IconUsersGroup size={20} stroke={1.7} />
          </span>
          <div>
            <h3 className="font-serif text-xl font-medium text-[#1E1B17]">Turut Mengundang</h3>
            <p className="text-xs text-[#6B6358]">Daftar keluarga atau kerabat yang turut mengundang.</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Label Section</Label>
          <Input
            value={data.extendedFamily?.title || ""}
            onChange={(e) => setData((prev) => ({ ...prev, extendedFamily: { ...prev.extendedFamily!, title: e.target.value } }))}
            placeholder="Turut Mengundang / Kel. Besar"
            className="h-11 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]"
          />
        </div>

        <div className="space-y-2.5">
          <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Nama-nama Keluarga</Label>
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
                  className="h-10 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newMembers = data.extendedFamily!.members.filter((_, i) => i !== index);
                    setData((prev) => ({ ...prev, extendedFamily: { ...prev.extendedFamily!, members: newMembers } }));
                  }}
                  aria-label="Hapus anggota keluarga"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E1D8C9] bg-[#FFFDF9] text-[#6B6358] transition-colors hover:text-red-600"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-xl border-dashed border-[#CFC5B4] bg-[#FFFDF9] text-[#1E1B17] hover:bg-[#EFE8DC]"
              onClick={() => {
                setData((prev) => ({
                  ...prev,
                  extendedFamily: { ...prev.extendedFamily!, members: [...(prev.extendedFamily?.members || []), ""] },
                }));
              }}
            >
              <IconPlus className="mr-2 h-4 w-4" /> Tambah Nama
            </Button>
          </div>
        </div>
      </section>

      {/* Love Story */}
      <section className="rounded-2xl border border-[#E1D8C9] bg-[#F7F3EC]/55 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFE8DC] text-[#8A6A2F]">
            <IconHeartHandshake size={20} stroke={1.7} />
          </span>
          <div>
            <h3 className="font-serif text-xl font-medium text-[#1E1B17]">Perjalanan Cinta</h3>
            <p className="text-xs text-[#6B6358]">Ceritakan momen singkat pertemuan kalian hingga menuju pelaminan.</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Judul Cerita</Label>
          <Input
            value={data.story.title || ""}
            onChange={(e) => handleUpdate("story", "title", e.target.value)}
            placeholder="Awal Bertemu..."
            className="h-11 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6358]">Isi Cerita</Label>
          <Textarea
            value={data.story.content || ""}
            onChange={(e) => handleUpdate("story", "content", e.target.value)}
            rows={5}
            placeholder="Tuliskan kisah singkat perjalanan cinta kalian..."
            className="rounded-xl border-[#E1D8C9] bg-[#FFFDF9]"
          />
        </div>
      </section>
    </div>
  );
}
