"use client";

import React, { useState } from "react";
import { IconCheck, IconMail } from "@tabler/icons-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function RSVPSection() {
  const [name, setName] = useState("");
  const [attendance, setAttendance] = useState("HADIR");
  const [guests, setGuests] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const slug = typeof window !== "undefined" ? window.location.pathname.replace("/", "") : "";
      if (!slug) {
        toast.error("Error");
        return;
      }

      await fetch("/api/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, type: "RSVP", guestName: name, attendance, guests: attendance === "HADIR" ? guests : 0 }),
      });

      if (message.trim()) {
        await fetch("/api/public/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, type: "MESSAGE", guestName: name, message }),
        });
      }
      setSent(true);
      toast.success("Sent!");
    } catch {
      toast.error("Error sending RSVP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 px-6 bg-[#FFFFFF] reveal-section border-t border-[#F9F5F0]">
      <div className="max-w-2xl mx-auto space-y-12 text-center">
        <div className="space-y-4">
          <IconMail className="w-10 h-10 mx-auto text-[#D4AF37]" />
          <h2 className="text-4xl font-light italic text-[#B8860B]">RSVP</h2>
          <div className="h-px w-24 bg-[#D4AF37] mx-auto opacity-30" />
          <p className="opacity-70">Kehadiran & doa Anda adalah anugerah bagi kami.</p>
        </div>

        <div className="bg-[#FFFDF9] p-10 md:p-14 rounded-[40px] shadow-2xl border border-[#D4AF37]/20 text-left">
          {sent ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 rounded-full bg-white border border-[#D4AF37] flex items-center justify-center mx-auto mb-6 text-[#D4AF37]">
                <IconCheck size={40} />
              </div>
              <h3 className="text-3xl font-light italic text-[#B8860B] mb-2">Terima Kasih</h3>
              <p className="opacity-60 mb-8">Konfirmasi Anda telah tersimpan.</p>
              <button onClick={() => setSent(false)} className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] border-b border-[#D4AF37] pb-1 hover:opacity-70">
                Kirim Lagi
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#B8860B]/70">Nama Tamu</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap"
                  required
                  className="w-full px-0 py-3 bg-transparent border-b border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-0 text-xl font-serif text-[#2C2C2C] placeholder:text-[#2C2C2C]/20 transition-all font-light"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#B8860B]/70">Konfirmasi</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setAttendance("HADIR")}
                    className={`flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${attendance === "HADIR" ? "bg-[#D4AF37] text-white shadow-lg" : "bg-[#F9F5F0] text-[#B8860B]/60 hover:bg-[#F0EBE7]"}`}
                  >
                    Hadir
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendance("TIDAK HADIR")}
                    className={`flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${attendance !== "HADIR" ? "bg-[#2C2C2C] text-white shadow-lg" : "bg-[#F9F5F0] text-[#B8860B]/60 hover:bg-[#F0EBE7]"}`}
                  >
                    Maaf, Tidak
                  </button>
                </div>
              </div>

              {attendance === "HADIR" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-[#B8860B]/70">Jumlah Tamu</label>
                  <select value={guests} onChange={(e) => setGuests(parseInt(e.target.value))} className="w-full px-4 py-3 bg-[#F9F5F0] rounded-xl border-none text-[#2C2C2C] focus:ring-[#D4AF37]">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} Orang
                      </option>
                    ))}
                  </select>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-[#B8860B]/70">Doa & Ucapan</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tuliskan sesuatu yang indah..."
                  rows={3}
                  className="w-full p-4 bg-[#F9F5F0] rounded-2xl border-none focus:ring-1 focus:ring-[#D4AF37] font-serif resize-none"
                />
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 bg-[#D4AF37] text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#B8860B] transition-all shadow-xl disabled:opacity-70">
                {loading ? "MENGIRIM..." : "KIRIM KONFIRMASI"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
