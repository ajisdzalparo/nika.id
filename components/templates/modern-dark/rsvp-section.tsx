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
    <section className="py-24 px-6 bg-[#0F0F0F] text-white reveal-card border-t border-white/10">
      <div className="max-w-xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <IconMail className="w-8 h-8 mx-auto text-white opacity-50" />
          <h2 className="text-4xl font-black uppercase tracking-tighter">RSVP</h2>
          <p className="text-xs uppercase tracking-widest opacity-40">Please confirm your attendance</p>
        </div>

        <div className="bg-[#1A1A1A] p-8 md:p-12 rounded-[2rem] border border-white/10 relative overflow-hidden">
          {sent ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center mx-auto mb-6">
                <IconCheck size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase mb-2">Confirmed</h3>
              <p className="text-white/50 mb-8">We look forward to seeing you.</p>
              <button onClick={() => setSent(false)} className="text-xs font-bold uppercase tracking-widest border-b border-white pb-1 hover:opacity-50 transition-opacity">
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                  className="w-full bg-black/50 border-b border-white/20 px-0 py-4 text-xl font-bold focus:border-white focus:outline-none transition-colors placeholder:text-white/20"
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Attendance</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setAttendance("HADIR")}
                    className={`flex-1 py-4 border border-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${attendance === "HADIR" ? "bg-white text-black border-white" : "hover:bg-white/5"}`}
                  >
                    Attending
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendance("TIDAK HADIR")}
                    className={`flex-1 py-4 border border-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${attendance !== "HADIR" ? "bg-white text-black border-white" : "hover:bg-white/5"}`}
                  >
                    Departs
                  </button>
                </div>
              </div>

              {attendance === "HADIR" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Guests</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setGuests(n)}
                        className={`w-10 h-10 rounded-full border border-white/20 flex items-center justify-center font-bold text-sm transition-all ${guests === n ? "bg-white text-black" : "hover:bg-white/10"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Wishes</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write something..."
                  rows={2}
                  className="w-full bg-black/50 border-2 border-white/10 rounded-xl p-4 focus:border-white/40 focus:outline-none transition-colors placeholder:text-white/20 resize-none"
                />
              </div>

              <button type="submit" disabled={loading} className="w-full py-5 bg-white text-black font-black uppercase tracking-[0.2em] rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50">
                {loading ? "SENDING..." : "CONFIRM RSVP"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
