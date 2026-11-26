/* eslint-disable @typescript-eslint/no-explicit-any */
import { IconClipboardCheck, IconGift, IconHeartHandshake, IconMusic, IconPlus, IconQuote, IconTrash, IconUsersGroup } from "@tabler/icons-react";
import { MusicSourcePicker } from "@/components/common/music-source-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/ui/select";
import { WeddingData } from "@/types/wedding";
import { QUOTE_PRESETS } from "@/lib/quote-presets";
import { Switch } from "@/components/ui/switch";

interface FiturSectionProps {
  data: WeddingData;
  setData: React.Dispatch<React.SetStateAction<WeddingData & { extra?: Record<string, string> }>>;
  handleUpdate: (section: "story" | "extra" | "music" | "quote", field: string, value: any) => void;
  renderExtraFields: (section: string) => React.ReactNode;
}

function QuoteEditor({ data, setData }: Pick<FiturSectionProps, "data" | "setData">) {
  const quote = data.quote ?? { text: QUOTE_PRESETS[0].text, source: QUOTE_PRESETS[0].source, enabled: true };
  const enabled = quote.enabled !== false;
  const presetId = QUOTE_PRESETS.find((p) => p.text === quote.text)?.id ?? "CUSTOM";
  const setQuote = (next: Partial<NonNullable<WeddingData["quote"]>>) => setData((prev) => ({ ...prev, quote: { ...quote, ...next } }));
  const groups = [...new Set(QUOTE_PRESETS.map((p) => p.group))];

  return (
    <section className="rounded-2xl border border-[#E9DDC6] bg-[#FCF8F1]/55 p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EDDD] text-[#8A6424]">
            <IconQuote size={20} stroke={1.7} />
          </span>
          <div>
            <h3 className="font-serif text-xl font-medium text-[#1F1A14]">Ayat / Kutipan Pembuka</h3>
            <p className="text-xs text-[#6B5F50]">Pilih ayat Al-Qur&apos;an, ayat Alkitab, kutipan umum, atau tulis sendiri.</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={(v) => setQuote({ enabled: v })} aria-label="Tampilkan kutipan" />
      </div>

      {enabled && (
        <>
          <label className="block space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B5F50]">Pilihan kutipan</span>
            <SelectField
              value={presetId}
              onChange={(e) => {
                const p = QUOTE_PRESETS.find((x) => x.id === e.target.value);
                if (p) setQuote({ text: p.text, source: p.source });
              }}
              aria-label="Pilihan kutipan"
              className="h-11"
            >
              {groups.map((g) => (
                <optgroup key={g} label={g}>
                  {QUOTE_PRESETS.filter((p) => p.group === g).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="CUSTOM">Tulis sendiri</option>
            </SelectField>
          </label>
          <label className="block space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B5F50]">Isi kutipan</span>
            <Textarea
              value={quote.text}
              onChange={(e) => setQuote({ text: e.target.value })}
              rows={4}
              placeholder="Tulis ayat atau kutipan yang berarti untuk kalian…"
              className="rounded-xl border-[#E9DDC6] bg-[#FFFDF9]"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B5F50]">Sumber (opsional)</span>
            <Input
              value={quote.source}
              onChange={(e) => setQuote({ source: e.target.value })}
              placeholder="QS. Ar-Rum: 21, Kejadian 2:24, atau kosongkan"
              className="h-11 rounded-xl border-[#E9DDC6] bg-[#FFFDF9]"
            />
          </label>
        </>
      )}
    </section>
  );
}

export function FiturSection({ data, setData, handleUpdate, renderExtraFields }: FiturSectionProps) {
  return (
    <div className="space-y-6">
      {/* Music Section */}
      <section className="rounded-2xl border border-[#E9DDC6] bg-[#FCF8F1]/55 p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EDDD] text-[#8A6424]">
              <IconMusic size={20} stroke={1.7} />
            </span>
            <div>
              <h3 className="font-serif text-xl font-medium text-[#1F1A14]">Musik Latar</h3>
              <p className="text-xs text-[#6B5F50]">Putar musik otomatis dari link YouTube atau file audio yang diunggah ke S3.</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(data.music?.enabled)}
            aria-label="Aktifkan musik latar"
            onClick={() => setData((prev) => ({ ...prev, music: { ...prev.music!, enabled: !prev.music?.enabled } }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${data.music?.enabled ? "bg-[#1F1A14]" : "bg-[#D9CBAE]"}`}
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

      {/* RSVP form options */}
      <section className="rounded-2xl border border-[#E9DDC6] bg-[#FCF8F1]/55 p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EDDD] text-[#8A6424]">
            <IconClipboardCheck size={20} stroke={1.7} />
          </span>
          <div>
            <h3 className="font-serif text-xl font-medium text-[#1F1A14]">Formulir RSVP</h3>
            <p className="text-xs text-[#6B5F50]">Atur apa yang diisi tamu saat konfirmasi kehadiran.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start justify-between gap-4 rounded-xl border border-[#E9DDC6] bg-[#FFFDF9] p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-[#1F1A14]">Minta nomor WhatsApp</p>
              <p className="text-xs leading-relaxed text-[#6B5F50]">Tampilkan kolom nomor WA agar tamu mudah dihubungi atau dikirim kartu QR.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={data.rsvp?.askPhone !== false}
              aria-label="Minta nomor WhatsApp tamu"
              onClick={() => setData((prev) => ({ ...prev, rsvp: { ...prev.rsvp, askPhone: prev.rsvp?.askPhone === false } }))}
              className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${data.rsvp?.askPhone !== false ? "bg-[#1F1A14]" : "bg-[#D9CBAE]"}`}
            >
              <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-[#FFFDF9] transition-transform ${data.rsvp?.askPhone !== false ? "translate-x-5.5" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="flex items-start justify-between gap-4 rounded-xl border border-[#E9DDC6] bg-[#FFFDF9] p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-[#1F1A14]">QR check-in pribadi setelah RSVP</p>
              <p className="text-xs leading-relaxed text-[#6B5F50]">Opsional untuk mode panitia: tamu mendapat QR pribadi setelah RSVP. (QR cetak meja tamu di menu Check-in Tamu selalu aktif otomatis.)</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(data.rsvp?.qrCheckIn)}
              aria-label="Aktifkan QR check-in tamu"
              onClick={() => setData((prev) => ({ ...prev, rsvp: { ...prev.rsvp, qrCheckIn: !prev.rsvp?.qrCheckIn } }))}
              className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${data.rsvp?.qrCheckIn ? "bg-[#1F1A14]" : "bg-[#D9CBAE]"}`}
            >
              <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-[#FFFDF9] transition-transform ${data.rsvp?.qrCheckIn ? "translate-x-5.5" : "translate-x-1"}`} />
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B5F50]">Maksimal tamu per RSVP</span>
            <SelectField
              value={String(data.rsvp?.maxGuests ?? 5)}
              onChange={(e) => setData((prev) => ({ ...prev, rsvp: { ...prev.rsvp, maxGuests: Number(e.target.value) } }))}
              className="h-11 rounded-xl border-[#E9DDC6] bg-[#FFFDF9]"
            >
              {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                <option key={n} value={String(n)}>
                  {n === 1 ? "1 orang (tanpa pendamping)" : `${n} orang`}
                </option>
              ))}
            </SelectField>
          </label>
          <label className="block space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B5F50]">Pertanyaan tambahan (opsional)</span>
            <Input
              value={data.rsvp?.question?.label ?? ""}
              onChange={(e) =>
                setData((prev) => ({ ...prev, rsvp: { ...prev.rsvp, question: { label: e.target.value, options: prev.rsvp?.question?.options ?? [] } } }))
              }
              placeholder="Contoh: Apakah ada alergi makanan?"
              maxLength={80}
              className="h-11 rounded-xl border-[#E9DDC6] bg-[#FFFDF9]"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B5F50]">Pilihan jawaban</span>
            <Input
              value={(data.rsvp?.question?.options ?? []).join(", ")}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  rsvp: { ...prev.rsvp, question: { label: prev.rsvp?.question?.label ?? "", options: e.target.value.split(",").map((o) => o.trimStart()).slice(0, 6) } },
                }))
              }
              placeholder="Tidak ada, Seafood, Kacang"
              className="h-11 rounded-xl border-[#E9DDC6] bg-[#FFFDF9]"
            />
            <span className="block text-[11px] text-[#8E8268]">Pisahkan dengan koma, maks. 6 pilihan.</span>
          </label>
        </div>
      </section>

      {/* Gift Section */}
      <section className="rounded-2xl border border-[#E9DDC6] bg-[#FCF8F1]/55 p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EDDD] text-[#8A6424]">
              <IconGift size={20} stroke={1.7} />
            </span>
            <div>
              <h3 className="font-serif text-xl font-medium text-[#1F1A14]">Kado Digital (Amplop)</h3>
              <p className="text-xs text-[#6B5F50]">Tampilkan nomor rekening atau e-wallet agar tamu mudah mengirim tanda kasih.</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(data.gifts.enabled)}
            aria-label="Aktifkan amplop digital"
            onClick={() => setData((prev) => ({ ...prev, gifts: { ...prev.gifts, enabled: !prev.gifts.enabled } }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${data.gifts.enabled ? "bg-[#1F1A14]" : "bg-[#D9CBAE]"}`}
          >
            <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-[#FFFDF9] transition-transform ${data.gifts.enabled ? "translate-x-5.5" : "translate-x-1"}`} />
          </button>
        </div>

        {data.gifts.enabled && (
          <div className="space-y-4">
            {data.gifts.bankAccounts.map((account, index) => (
              <div key={index} className="relative rounded-xl border border-[#E9DDC6] bg-[#FFFDF9] p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    const newAccounts = data.gifts.bankAccounts.filter((_, i) => i !== index);
                    setData((prev) => ({ ...prev, gifts: { ...prev.gifts, bankAccounts: newAccounts } }));
                  }}
                  aria-label="Hapus rekening"
                  className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg text-[#6B5F50] transition-colors hover:bg-[#F5EDDD] hover:text-red-600"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
                <div className="grid grid-cols-1 gap-3 pr-8 @md:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B5F50]">Nama Bank / E-Wallet</span>
                    <Input
                      value={account.bankName}
                      onChange={(e) => {
                        const newAccounts = [...data.gifts.bankAccounts];
                        newAccounts[index].bankName = e.target.value;
                        setData((prev) => ({ ...prev, gifts: { ...prev.gifts, bankAccounts: newAccounts } }));
                      }}
                      placeholder="BCA / Mandiri / GoPay"
                      className="h-10 rounded-xl border-[#E9DDC6] bg-[#FCF8F1]/40"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B5F50]">Atas Nama</span>
                    <Input
                      value={account.accountHolder}
                      onChange={(e) => {
                        const newAccounts = [...data.gifts.bankAccounts];
                        newAccounts[index].accountHolder = e.target.value;
                        setData((prev) => ({ ...prev, gifts: { ...prev.gifts, bankAccounts: newAccounts } }));
                      }}
                      placeholder="Nama pemilik rekening"
                      className="h-10 rounded-xl border-[#E9DDC6] bg-[#FCF8F1]/40"
                    />
                  </label>
                </div>
                <label className="block space-y-1.5">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B5F50]">Nomor Rekening</span>
                  <Input
                    value={account.accountNumber}
                    onChange={(e) => {
                      const newAccounts = [...data.gifts.bankAccounts];
                      newAccounts[index].accountNumber = e.target.value;
                      setData((prev) => ({ ...prev, gifts: { ...prev.gifts, bankAccounts: newAccounts } }));
                    }}
                    placeholder="1234567890"
                    className="h-10 rounded-xl border-[#E9DDC6] bg-[#FCF8F1]/40"
                  />
                </label>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl border-dashed border-[#D9CBAE] bg-[#FFFDF9] text-[#1F1A14] hover:bg-[#F5EDDD]"
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
      <section className="rounded-2xl border border-[#E9DDC6] bg-[#FCF8F1]/55 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EDDD] text-[#8A6424]">
            <IconUsersGroup size={20} stroke={1.7} />
          </span>
          <div>
            <h3 className="font-serif text-xl font-medium text-[#1F1A14]">Turut Mengundang</h3>
            <p className="text-xs text-[#6B5F50]">Daftar keluarga atau kerabat yang turut mengundang.</p>
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B5F50]">Label Section</span>
          <Input
            value={data.extendedFamily?.title || ""}
            onChange={(e) => setData((prev) => ({ ...prev, extendedFamily: { ...prev.extendedFamily!, title: e.target.value } }))}
            placeholder="Turut Mengundang / Kel. Besar"
            className="h-11 rounded-xl border-[#E9DDC6] bg-[#FFFDF9]"
          />
        </label>

        <div className="space-y-2.5">
          <Label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B5F50]">Nama-nama Keluarga</Label>
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
                  className="h-10 rounded-xl border-[#E9DDC6] bg-[#FFFDF9]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newMembers = data.extendedFamily!.members.filter((_, i) => i !== index);
                    setData((prev) => ({ ...prev, extendedFamily: { ...prev.extendedFamily!, members: newMembers } }));
                  }}
                  aria-label="Hapus anggota keluarga"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E9DDC6] bg-[#FFFDF9] text-[#6B5F50] transition-colors hover:text-red-600"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full rounded-xl border-dashed border-[#D9CBAE] bg-[#FFFDF9] text-[#1F1A14] hover:bg-[#F5EDDD]"
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

      {/* Opening quote: Islamic, Christian or general, or hidden */}
      <QuoteEditor data={data} setData={setData} />

      {/* Love Story */}
      <section className="rounded-2xl border border-[#E9DDC6] bg-[#FCF8F1]/55 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F5EDDD] text-[#8A6424]">
            <IconHeartHandshake size={20} stroke={1.7} />
          </span>
          <div>
            <h3 className="font-serif text-xl font-medium text-[#1F1A14]">Perjalanan Cinta</h3>
            <p className="text-xs text-[#6B5F50]">Ceritakan momen singkat pertemuan kalian hingga menuju pelaminan.</p>
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B5F50]">Judul Cerita</span>
          <Input
            value={data.story.title || ""}
            onChange={(e) => handleUpdate("story", "title", e.target.value)}
            placeholder="Awal Bertemu..."
            className="h-11 rounded-xl border-[#E9DDC6] bg-[#FFFDF9]"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B5F50]">Isi Cerita</span>
          <Textarea
            value={data.story.content || ""}
            onChange={(e) => handleUpdate("story", "content", e.target.value)}
            rows={5}
            placeholder="Tuliskan kisah singkat perjalanan cinta kalian..."
            className="rounded-xl border-[#E9DDC6] bg-[#FFFDF9]"
          />
        </label>
      </section>
    </div>
  );
}
