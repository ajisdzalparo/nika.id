"use client";

import { useState } from "react";
import { IconCheck, IconMessageReply, IconStar } from "@tabler/icons-react";
import { toast } from "sonner";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_FEATURES,
  FEEDBACK_MESSAGE_MAX,
  FEEDBACK_MESSAGE_MIN,
  FEEDBACK_STATUSES,
  RATING_LABELS,
  labelOf,
  type FeedbackCategory,
  type FeedbackFeature,
  type FeedbackItem,
} from "@/lib/feedback-shared";

const PLACEHOLDERS: Record<FeedbackCategory, string> = {
  SARAN: "Contoh: Di editor, saya harus scroll jauh untuk menyimpan. Akan lebih enak kalau tombol simpan selalu terlihat.",
  MASALAH: "Ceritakan apa yang kamu lakukan, apa yang terjadi, dan apa yang seharusnya terjadi.",
  FITUR_BARU: "Contoh: Saya ingin bisa mengirim pengingat H-1 ke tamu yang belum RSVP.",
  PUJIAN: "Bagian mana yang paling membantu kamu?",
};

const STATUS_TONE: Record<string, string> = {
  BARU: "bg-[#EFE9DF] text-[#4A443B]",
  DITINJAU: "bg-[#F4EAD6] text-[#6E5426]",
  DIRENCANAKAN: "bg-[#F4EAD6] text-[#6E5426]",
  SELESAI: "bg-[#E3EEE4] text-[#2F5A37]",
  DITOLAK: "bg-[#EFE9DF] text-[#6B6358]",
};

const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${
        active ? "border-[#1E1B17] bg-[#1E1B17] text-[#F7F3EC]" : "border-[#DDD5C7] bg-[#FFFDF9] text-[#3F3A33] hover:border-[#B8AD9A]"
      }`}
    >
      {children}
    </button>
  );
}

export function FeedbackForm({
  initialItems,
  initialFeature,
  fromPath,
}: {
  initialItems: FeedbackItem[];
  initialFeature?: FeedbackFeature;
  fromPath?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [category, setCategory] = useState<FeedbackCategory>("SARAN");
  const [feature, setFeature] = useState<FeedbackFeature | null>(initialFeature ?? null);
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const trimmed = message.trim();
  const canSubmit = Boolean(feature) && trimmed.length >= FEEDBACK_MESSAGE_MIN && !busy;
  const shownRating = hoverRating ?? rating;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      const res = await fetch("/api/user/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, feature, rating, message: trimmed, pagePath: fromPath ?? null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Masukan gagal dikirim. Coba lagi.");
        return;
      }
      setItems((prev) => [{ ...data.item, createdAt: data.item.createdAt, repliedAt: data.item.repliedAt }, ...prev]);
      setMessage("");
      setRating(null);
      setSent(true);
      toast.success("Terima kasih! Masukanmu sudah kami terima.");
    } catch {
      toast.error("Masukan gagal dikirim. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
      <form onSubmit={submit} className="space-y-8 rounded-2xl border border-[#E1D8C9] bg-[#FFFDF9] p-5 sm:p-7">
        {sent && (
          <div className="flex items-start gap-3 rounded-xl border border-[#DFD2BC] bg-[#F5EFE3] px-4 py-3 text-sm text-[#5C4620]" role="status">
            <IconCheck size={18} className="mt-0.5 shrink-0" />
            <p>Masukanmu sudah masuk. Kalau ada balasan atau statusnya berubah, kamu akan dapat notifikasi. Mau menambahkan yang lain? Isi lagi di bawah.</p>
          </div>
        )}

        <fieldset className="space-y-3">
          <legend className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">1 · Jenis masukan</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {FEEDBACK_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={category === c.id}
                className={`min-h-11 rounded-xl border px-4 py-3 text-left transition-colors ${
                  category === c.id ? "border-[#8A6A2F] bg-[#FBF6EC] ring-1 ring-[#8A6A2F]/30" : "border-[#E6DFD3] bg-white hover:border-[#CFC5B4]"
                }`}
              >
                <span className="block text-[15px] font-medium text-[#1E1B17]">{c.label}</span>
                <span className="mt-0.5 block text-[13px] text-[#6B6358]">{c.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">2 · Tentang fitur apa?</legend>
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_FEATURES.map((f) => (
              <Chip key={f.id} active={feature === f.id} onClick={() => setFeature(f.id)}>
                {f.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        {category !== "FITUR_BARU" && (
          <fieldset className="space-y-3">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">
              3 · Seberapa puas dengan fitur ini? <span className="normal-case tracking-normal text-[#7D7468]">(opsional)</span>
            </legend>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex" onMouseLeave={() => setHoverRating(null)} role="radiogroup" aria-label="Nilai kepuasan">
                {[1, 2, 3, 4, 5].map((n) => {
                  const filled = shownRating !== null && n <= shownRating;
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} dari 5 · ${RATING_LABELS[n]}`}
                      onClick={() => setRating(rating === n ? null : n)}
                      onMouseEnter={() => setHoverRating(n)}
                      className="flex h-11 w-11 items-center justify-center text-[#8A6A2F]"
                    >
                      {/* One element whose fill changes: swapping icons on hover could drop the click (and taps on phones) */}
                      <IconStar
                        size={24}
                        stroke={1.5}
                        fill={filled ? "currentColor" : "none"}
                        className={`pointer-events-none transition-colors ${filled ? "text-[#8A6A2F]" : "text-[#CFC5B4]"}`}
                      />

                    </button>
                  );
                })}
              </div>
              <span className="text-sm text-[#6B6358]">{shownRating ? RATING_LABELS[shownRating] : "Belum dinilai"}</span>
            </div>
          </fieldset>
        )}

        <div className="space-y-3">
          <label htmlFor="feedback-message" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">
            {category === "FITUR_BARU" ? "3" : "4"} · Ceritakan masukanmu
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, FEEDBACK_MESSAGE_MAX))}
            rows={6}
            placeholder={PLACEHOLDERS[category]}
            className="w-full rounded-xl border border-[#DDD5C7] bg-[#FAF8F4] px-4 py-3 text-[16px] leading-relaxed text-[#1E1B17] outline-none placeholder:text-[#A59B8C] focus:border-[#8A6A2F]"
          />
          <div className="flex justify-between text-xs text-[#7D7468]">
            <span>{trimmed.length > 0 && trimmed.length < FEEDBACK_MESSAGE_MIN ? `Minimal ${FEEDBACK_MESSAGE_MIN} karakter` : "Jangan tulis password atau data rekening di sini."}</span>
            <span className="tabular-nums">
              {message.length}/{FEEDBACK_MESSAGE_MAX}
            </span>
          </div>
        </div>

        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-[#EFEAE0] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-[#6B6358]">{!feature ? "Pilih fiturnya dulu supaya masukan sampai ke orang yang tepat." : "Dibaca langsung oleh tim UNDANGIN YUK."}</p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-11 shrink-0 rounded-full bg-[#1E1B17] px-6 text-sm font-medium text-[#F7F3EC] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Mengirim..." : "Kirim masukan"}
          </button>
        </div>
      </form>

      <aside className="space-y-4">
        <h2 className="font-serif text-2xl text-[#1E1B17]">Masukan kamu</h2>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#D6CBB8] p-5 text-[15px] leading-relaxed text-[#6B6358]">
            Belum ada masukan. Semua yang kamu kirim akan muncul di sini, lengkap dengan status dan balasan dari tim kami.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.id} className="space-y-3 rounded-2xl border border-[#E1D8C9] bg-[#FFFDF9] p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2.5 py-1 font-medium ${STATUS_TONE[it.status] ?? STATUS_TONE.BARU}`}>{labelOf(FEEDBACK_STATUSES, it.status)}</span>
                  <span className="text-[#6B6358]">
                    {labelOf(FEEDBACK_CATEGORIES, it.category)} · {labelOf(FEEDBACK_FEATURES, it.feature)}
                  </span>
                </div>
                <p className="line-clamp-4 whitespace-pre-line text-[15px] leading-relaxed text-[#1E1B17]">{it.message}</p>
                {it.adminReply && (
                  <div className="flex gap-2.5 rounded-xl bg-[#F5EFE3] p-3 text-sm leading-relaxed text-[#3F3A33]">
                    <IconMessageReply size={16} className="mt-0.5 shrink-0 text-[#8A6A2F]" />
                    <p className="whitespace-pre-line">{it.adminReply}</p>
                  </div>
                )}
                <p className="text-xs text-[#7D7468]">
                  {dateFmt.format(new Date(it.createdAt))}
                  {it.rating ? ` · ${it.rating}/5` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
