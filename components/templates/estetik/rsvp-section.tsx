"use client";

import React, { useState } from "react";
import { IconSend, IconCheck, IconMail } from "@tabler/icons-react";
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
        toast.error("Undangan tidak valid");
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
      toast.success("Konfirmasi kehadiran berhasil dikirim!");
    } catch {
      toast.error("Terjadi kesalahan, silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 px-6 bg-[#FDF8F5] estetik-reveal">
      <div className="max-w-2xl mx-auto text-center space-y-10">
        <div className="space-y-2">
          <IconMail className="w-8 h-8 mx-auto text-[#C4A484] opacity-50" />
          <h2 className="text-4xl italic text-[#4A403A]">RSVP & Wills</h2>
          <div className="h-px w-16 bg-[#C4A484] mx-auto opacity-30" />
          <p className="text-gray-500 font-sans mt-4">Mohon konfirmasi kehadiran Anda.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border-dashed border-2 border-[#C4A484]/20 text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FDF8F5] rounded-bl-[4rem] -mr-8 -mt-8 z-0" />

          {sent ? (
            <div className="text-center py-10 relative z-10">
              <div className="w-20 h-20 rounded-full bg-[#FDF8F5] text-[#C4A484] border-2 border-[#C4A484] flex items-center justify-center mx-auto mb-6">
                <IconCheck size={40} />
              </div>
              <h3 className="text-2xl font-serif text-[#4A403A] mb-2">Terima Kasih!</h3>
              <p className="text-gray-500 mb-8">Pesan Anda sangat berarti bagi kami.</p>
              <button onClick={() => setSent(false)} className="text-xs font-bold uppercase tracking-widest text-[#C4A484] hover:text-[#4A403A] underline transition-colors">
                Kirim lagi
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Nama</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#FDF8F5] border-transparent focus:border-[#C4A484] focus:bg-white focus:ring-0 transition-all font-serif text-[#4A403A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Kehadiran</label>
                <div className="flex gap-2">
                  {["HADIR", "TIDAK HADIR"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAttendance(opt)}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-widest transition-all ${attendance === opt ? "bg-[#C4A484] text-white shadow-lg" : "bg-[#FDF8F5] text-gray-400 hover:bg-[#F0EBE7]"}`}
                    >
                      {opt === "HADIR" ? "HADIR" : "MAAF"}
                    </button>
                  ))}
                </div>
              </div>

              {attendance === "HADIR" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Jumlah Tamu</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-[#FDF8F5] border-transparent focus:border-[#C4A484] focus:bg-white focus:ring-0 transition-all font-sans text-[#4A403A]"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num} Orang
                      </option>
                    ))}
                  </select>
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Ucapan</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Berikan doa terbaik Anda..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-[#FDF8F5] border-transparent focus:border-[#C4A484] focus:bg-white focus:ring-0 transition-all font-serif text-[#4A403A] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full bg-[#4A403A] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#C4A484]  transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Mengirim..."
                ) : (
                  <>
                    Kirim Ucapan <IconSend size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
