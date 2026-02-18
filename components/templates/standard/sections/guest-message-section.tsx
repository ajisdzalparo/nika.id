"use client";

import React, { useState } from "react";
import { IconSend, IconCheck, IconHeartHandshake } from "@tabler/icons-react";

export function GuestMessageSection() {
  const [name, setName] = useState("");
  const [attendance, setAttendance] = useState("hadir");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setLoading(true);
    try {
      // Improved slug extraction: handle both server and client side if needed,
      // though this component is likely client-side only.
      // Using window directly as it was in the original, but safe-guarded.
      const slug = typeof window !== "undefined" ? window.location.pathname.replace("/", "") : "";

      if (!slug) {
        console.error("Slug not found");
        return;
      }

      await fetch("/api/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, guestName: name, attendance, message }),
      });
      setSent(true);
      setName("");
      setMessage("");
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 px-6 bg-[#FBF7F4]">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mx-auto">
            <IconHeartHandshake size={32} className="text-rose-500" />
          </div>
          <h2 className="text-3xl font-serif italic text-gray-900">Ucapan &amp; Doa</h2>
          <p className="text-sm text-gray-500">Kirim ucapan dan doa untuk kedua mempelai</p>
        </div>
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="max-w-lg mx-auto">
            {sent ? (
              <div className="text-center py-8 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <IconCheck size={32} className="text-green-600" />
                </div>
                <p className="text-lg font-semibold text-gray-800">Terima kasih atas ucapannya! 💕</p>
                <button onClick={() => setSent(false)} className="mt-4 text-sm text-gray-500 underline">
                  Kirim ucapan lagi
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Anda"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kehadiran</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "hadir", label: "Hadir" },
                      { value: "tidak", label: "Tidak Hadir" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAttendance(opt.value)}
                        className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${attendance === opt.value ? "border-pink-400 bg-pink-50 text-pink-600" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ucapan</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tulis ucapan untuk mempelai..."
                    required
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none transition-all text-sm resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-pink-200 transition-all disabled:opacity-60"
                >
                  <IconSend size={16} />
                  {loading ? "Mengirim..." : "Kirim Ucapan"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
