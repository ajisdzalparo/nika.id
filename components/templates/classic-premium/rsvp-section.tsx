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

      // 1. Submit RSVP
      const rsvpResponse = await fetch("/api/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          type: "RSVP",
          guestName: name,
          attendance,
          guests: attendance === "HADIR" ? guests : 0,
        }),
      });

      if (!rsvpResponse.ok) throw new Error("Gagal mengirim konfirmasi kehadiran");

      // 2. Submit Message if exists
      if (message.trim()) {
        const msgResponse = await fetch("/api/public/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            type: "MESSAGE",
            guestName: name,
            message,
          }),
        });

        if (!msgResponse.ok) console.error("Gagal mengirim ucapan");
      }

      setSent(true);
      toast.success("Konfirmasi kehadiran berhasil dikirim!");
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan, silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 px-6 bg-[#FDF8F5] premium-section">
      <div className="max-w-2xl mx-auto text-center space-y-10">
        <div className="space-y-2">
          <IconMail className="w-8 h-8 mx-auto text-[#C4A484] opacity-50" />
          <h2 className="text-4xl italic text-[#4A403A]">RSVP & Ucapan</h2>
          <div className="h-px w-16 bg-[#C4A484] mx-auto opacity-30" />
          <p className="text-gray-500 font-sans mt-4">Kehadiran Anda adalah kehormatan bagi kami.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-[#C4A484]/20 text-left">
          {sent ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 rounded-full bg-[#FDF8F5] border border-[#C4A484]/30 flex items-center justify-center mx-auto mb-6">
                <IconCheck size={40} className="text-[#C4A484]" />
              </div>
              <h3 className="text-2xl font-serif text-[#4A403A] mb-2">Terima Kasih!</h3>
              <p className="text-gray-500 mb-8">Konfirmasi kehadiran dan ucapan Anda telah kami terima.</p>
              <button
                onClick={() => {
                  setSent(false);
                  setName("");
                  setMessage("");
                  setAttendance("HADIR");
                }}
                className="text-xs font-bold uppercase tracking-widest text-[#C4A484] hover:text-[#4A403A] transition-colors"
              >
                Kirim lagi
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[#FDF8F5] border-transparent focus:border-[#C4A484] focus:bg-white focus:ring-0 transition-all font-serif text-[#4A403A] placeholder:font-sans placeholder:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Konfirmasi Kehadiran</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "HADIR", label: "Hadir" },
                    { value: "TIDAK HADIR", label: "Berhalangan" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAttendance(opt.value)}
                      className={`py-3 px-4 rounded-lg text-sm font-bold tracking-wide transition-all ${attendance === opt.value ? "bg-[#4A403A] text-white shadow-lg" : "bg-[#FDF8F5] text-gray-400 hover:bg-[#F0EBE7]"}`}
                    >
                      {opt.label}
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
                    className="w-full px-4 py-3 rounded-lg bg-[#FDF8F5] border-transparent focus:border-[#C4A484] focus:bg-white focus:ring-0 transition-all font-sans text-[#4A403A]"
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
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Ucapan & Doa</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tuliskan duka cita... eh salah, sukacita Anda di sini :)"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-[#FDF8F5] border-transparent focus:border-[#C4A484] focus:bg-white focus:ring-0 transition-all font-serif text-[#4A403A] placeholder:font-sans placeholder:text-gray-300 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full bg-[#C4A484] text-white font-bold text-sm uppercase tracking-widest hover:bg-[#B39371] hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Mengirim..."
                ) : (
                  <>
                    Kirim Konfirmasi <IconSend size={16} />
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
