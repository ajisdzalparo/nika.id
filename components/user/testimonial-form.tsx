"use client";

import { useState } from "react";
import { IconStarFilled } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Panel, PanelTitle } from "@/components/common/studio-ui";
import { TESTIMONIAL_MESSAGE_MAX, TESTIMONIAL_MESSAGE_MIN, TESTIMONIAL_STATUSES, type TestimonialRow } from "@/lib/testimonials-shared";

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-[#F5E8CA] text-[#6E4F1C]",
  APPROVED: "bg-[#E3EEE4] text-[#2F5A37]",
  REJECTED: "bg-[#EFE9DF] text-[#6B5F50]",
};

/** "Apa kata kalian": the couple's public testimonial. Every save goes back to admin review before it shows on the landing. */
export function TestimonialForm({ initial, defaultName }: { initial: TestimonialRow | null; defaultName: string }) {
  const [item, setItem] = useState(initial);
  const [editing, setEditing] = useState(!initial);
  const [displayName, setDisplayName] = useState(initial?.displayName ?? defaultName);
  const [city, setCity] = useState(initial?.city ?? "");
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [message, setMessage] = useState(initial?.message ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/testimonial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, city, rating, message }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || "Gagal mengirim testimoni");
      setItem({ ...d.item, createdAt: d.item.createdAt });
      setEditing(false);
      toast.success("Terima kasih! Testimoni kalian akan tampil setelah ditinjau tim kami.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim testimoni");
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = TESTIMONIAL_STATUSES.find((s) => s.id === item?.status)?.label;

  return (
    <Panel className="p-5 sm:p-6">
      <PanelTitle>Testimoni kalian</PanelTitle>
      <p className="-mt-1 mb-5 max-w-2xl text-sm text-[#6B5F50]">
        Ceritakan pengalaman kalian memakai SatuMoment. Setelah disetujui, testimoni tampil di halaman depan bagian &ldquo;Apa kata mereka&rdquo;.
      </p>

      {item && !editing ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-medium ${STATUS_TONE[item.status] ?? STATUS_TONE.PENDING}`}>{statusLabel}</span>
            <span className="flex gap-0.5 text-[#C9A24E]">
              {Array.from({ length: item.rating }, (_, i) => (
                <IconStarFilled key={i} size={14} />
              ))}
            </span>
          </div>
          <blockquote className="rounded-xl bg-[#FCF8F1] p-4 text-[15px] italic leading-relaxed text-[#40372B]">&ldquo;{item.message}&rdquo;</blockquote>
          <p className="text-sm text-[#6B5F50]">
            {item.displayName}
            {item.city ? ` · ${item.city}` : ""}
          </p>
          {item.status === "REJECTED" && item.adminNote && <p className="text-sm text-[#8A3B2A]">Catatan tim: {item.adminNote}</p>}
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
            Ubah testimoni
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-[#1F1A14]">
              Nama yang ditampilkan
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Contoh: Arif & Sarah" maxLength={60} required />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-[#1F1A14]">
              Kota (opsional)
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Contoh: Bandung" maxLength={40} />
            </label>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium text-[#1F1A14]">Penilaian</p>
            <div className="flex gap-1" role="radiogroup" aria-label="Penilaian">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} bintang`}
                  onClick={() => setRating(n)}
                  className={`flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-[#FBF3E0] ${n <= rating ? "text-[#C9A24E]" : "text-[#DDD5C7]"}`}
                >
                  <IconStarFilled size={22} />
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-1.5 text-sm font-medium text-[#1F1A14]">
            Cerita kalian
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={TESTIMONIAL_MESSAGE_MAX}
              placeholder="Bagian mana yang paling membantu? Apa kata tamu tentang undangannya?"
              required
            />
            <span className="block text-right text-xs font-normal text-[#8E8268]">
              {message.trim().length}/{TESTIMONIAL_MESSAGE_MAX}
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="gold" disabled={saving || message.trim().length < TESTIMONIAL_MESSAGE_MIN || displayName.trim().length < 2}>
              {saving ? "Mengirim..." : item ? "Kirim ulang untuk ditinjau" : "Kirim testimoni"}
            </Button>
            {item && (
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Batal
              </Button>
            )}
          </div>
        </form>
      )}
    </Panel>
  );
}
