"use client";

import React, { useState } from "react";
import { IconSend, IconCheck, IconMail, IconHeartFilled } from "@tabler/icons-react";
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
    <section className="py-24 px-8 bg-[#FFF5F7] romantic-reveal border-t border-[#FCE2E6]">
      <div className="max-w-xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <IconMail className="w-8 h-8 mx-auto text-[#FFB7C5]" />
          <h2 className="text-4xl italic text-[#A67B7B]">RSVP</h2>
          <p className="text-sm italic text-[#8B7E7E]">Mohon konfirmasi kehadiran Anda.</p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-[#FCE2E6] relative">
          {sent ? (
            <div className="text-center py-12">
              <IconHeartFilled className="w-16 h-16 mx-auto text-[#FFB7C5] mb-6 animate-pulse" />
              <h3 className="text-3xl italic text-[#A67B7B] mb-2">Terima Kasih!</h3>
              <p className="text-[#8B7E7E] mb-8">Konfirmasi Anda telah kami terima.</p>
              <button onClick={() => setSent(false)} className="px-6 py-2 rounded-full border border-[#FFB7C5] text-[#A67B7B] text-xs font-bold uppercase tracking-widest hover:bg-[#FFF5F7]">
                Kirim Lagi
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#A67B7B]/70 pl-2">Nama</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap"
                  required
                  className="w-full px-6 py-3 rounded-full bg-[#FFF5F7] border-transparent focus:border-[#FFB7C5] focus:bg-white text-[#5A4B4B] placeholder:text-[#A67B7B]/30 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#A67B7B]/70 pl-2">Kehadiran</label>
                <div className="flex bg-[#FFF5F7] rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => setAttendance("HADIR")}
                    className={`flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${attendance === "HADIR" ? "bg-[#A67B7B] text-white shadow-md" : "text-[#A67B7B]/60 hover:text-[#A67B7B]"}`}
                  >
                    Hadir
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendance("TIDAK HADIR")}
                    className={`flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${attendance !== "HADIR" ? "bg-[#5A4B4B] text-white shadow-md" : "text-[#A67B7B]/60 hover:text-[#A67B7B]"}`}
                  >
                    Maaf
                  </button>
                </div>
              </div>

              {attendance === "HADIR" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[#A67B7B]/70 pl-2">Jumlah Tamu</label>
                  <div className="flex justify-between gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setGuests(n)}
                        className={`w-10 h-10 rounded-full border border-[#FCE2E6] flex items-center justify-center font-bold text-sm text-[#A67B7B] transition-all ${guests === n ? "bg-[#FFB7C5] text-white border-transparent" : "hover:bg-[#FFF5F7]"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[#A67B7B]/70 pl-2">Ucapan</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tuliskan sesuatu..."
                  rows={3}
                  className="w-full px-6 py-4 rounded-3xl bg-[#FFF5F7] border-transparent focus:border-[#FFB7C5] focus:bg-white text-[#5A4B4B] placeholder:text-[#A67B7B]/30 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full bg-[#A67B7B] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#8F6666] shadow-xl shadow-[#A67B7B]/20 transition-all disabled:opacity-70"
              >
                {loading ? "..." : "KIRIM KONFIRMASI"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
