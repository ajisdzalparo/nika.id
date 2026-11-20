"use client";

import React, { useState } from "react";
import { IconCheck, IconSend } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";
import { invitationSlugFromPath, submitRsvp } from "@/lib/rsvp";
import { SectionHeader } from "../shared";

export function GuestMessageSection({ data }: { data: WeddingData }) {
  const [name, setName] = useState(
    data.guestName && data.guestName !== "Tamu Undangan" ? data.guestName : ""
  );
  const [attendance, setAttendance] = useState<"HADIR" | "TIDAK HADIR">("HADIR");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    const isPreview =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/preview/");
    const slug = isPreview ? "" : invitationSlugFromPath();
    try {
      if (slug) {
        await submitRsvp({ slug, name: name.trim(), attendance, message });
      }
      setSubmitted(true);
    } catch {
      setErrorMsg("Gagal mengirim ucapan. Silakan coba sesaat lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-xl space-y-10">
        <SectionHeader
          kicker="Konfirmasi &amp; Doa"
          title="Ucapan &amp; RSVP"
          subtitle="Tinggalkan doa restu sekaligus konfirmasi kehadiran Anda untuk membantu kami mempersiapkan acara."
        />

        {submitted ? (
          <div className="border border-[#DFD4C4] bg-[#FFFDF9] p-8 text-center shadow-[0_20px_50px_-32px_rgba(31,28,24,0.28)] sm:p-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#C8B08A] bg-[#FAF6F0] text-[#8C6D3F]">
              <IconCheck size={20} stroke={1.8} />
            </div>
            <h3 className="mt-5 font-serif text-2xl font-normal text-[#1F1C18]">
              Terima Kasih, {name}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#5D554B]">
              Konfirmasi kehadiran dan doa restu Anda telah kami catat dengan penuh
              rasa syukur.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setMessage("");
              }}
              className="mt-6 border border-[#D8CBB8] px-5 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#5D554B] transition-colors hover:border-[#1F1C18] hover:text-[#1F1C18]"
            >
              Kirim Ucapan Lain
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 border border-[#DFD4C4] bg-[#FFFDF9] p-7 shadow-[0_20px_50px_-32px_rgba(31,28,24,0.28)] sm:p-9"
          >
            <div>
              <label
                htmlFor="standard-rsvp-name"
                className="mb-2 block text-[11px] font-medium uppercase tracking-[0.2em] text-[#6B6257]"
              >
                Nama Lengkap
              </label>
              <input
                id="standard-rsvp-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tuliskan nama Anda"
                className="w-full border border-[#DDD2C2] bg-[#FAF6F0]/60 px-4 py-3 text-sm text-[#1F1C18] placeholder:text-[#A3988A] focus:border-[#9A7B4F] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.2em] text-[#6B6257]">
                Konfirmasi Kehadiran
              </span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "HADIR" as const, label: "InsyaAllah Hadir" },
                  { value: "TIDAK HADIR" as const, label: "Berhalangan Hadir" },
                ].map((opt) => {
                  const active = attendance === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAttendance(opt.value)}
                      className={`border px-3 py-3 text-xs font-medium transition-all ${
                        active
                          ? "border-[#1F1C18] bg-[#1F1C18] text-[#FAF6F0]"
                          : "border-[#DDD2C2] bg-[#FAF6F0]/50 text-[#5D554B] hover:border-[#B0915D]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="standard-rsvp-message"
                className="mb-2 block text-[11px] font-medium uppercase tracking-[0.2em] text-[#6B6257]"
              >
                Ucapan &amp; Doa
              </label>
              <textarea
                id="standard-rsvp-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Sampaikan doa restu untuk kedua mempelai..."
                className="w-full resize-none border border-[#DDD2C2] bg-[#FAF6F0]/60 px-4 py-3 text-sm text-[#1F1C18] placeholder:text-[#A3988A] focus:border-[#9A7B4F] focus:bg-white focus:outline-none"
              />
            </div>

            {errorMsg ? (
              <p className="text-xs text-red-700" role="alert">
                {errorMsg}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 bg-[#1F1C18] px-6 py-3.5 text-xs font-medium uppercase tracking-[0.22em] text-[#FAF6F0] transition-colors hover:bg-[#332E27] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <IconSend size={15} stroke={1.6} />
              {loading ? "Mengirim..." : "Kirim Ucapan"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
