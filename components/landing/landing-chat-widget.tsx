"use client";

import { waLink } from "@/lib/phone";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  IconBrandWhatsapp,
  IconLoader2,
  IconMessageCircle,
  IconSend,
  IconX,
} from "@tabler/icons-react";
import { ChatMessageText } from "@/components/common/chat-message-text";
import { playChatSound } from "@/lib/sound";

interface PublicMsg {
  id: string;
  sender: "USER" | "AI";
  content: string;
  time: string;
}

const STARTERS = [
  "Info harga paket",
  "Cara buat undangan",
  "Fitur apa saja yang didapat?",
];

function nowClock() {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function LandingChatWidget({ whatsapp }: { whatsapp: string | null }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<PublicMsg[]>(() => [
    {
      id: "welcome",
      sender: "AI",
      content:
        "Halo! Saya asisten AI **SatuMoment**. Ada yang ingin ditanyakan soal harga paket, Desain AI, atau cara buat undangan digital?",
      time: nowClock(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages, sending]);

  const sendMessage = async (text: string) => {
    const clean = text.trim();
    if (!clean || sending) return;

    const userMsg: PublicMsg = {
      id: `u-${Date.now()}`,
      sender: "USER",
      content: clean,
      time: nowClock(),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setSending(true);

    try {
      const res = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: clean,
          history: messages.map((m) => ({ sender: m.sender, content: m.content })),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.reply) {
        toast.error(d.message || "Gagal membalas pesan. Coba sebentar lagi.");
        return;
      }
      playChatSound();
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: "AI",
          content: d.reply,
          time: nowClock(),
        },
      ]);
    } catch {
      toast.error("Koneksi chat terganggu. Coba lagi ya.");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  const waHref = waLink(whatsapp, "Halo admin SatuMoment, saya mau tanya tentang undangan digital.");

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {open && (
        <div className="flex h-[510px] max-h-[calc(100vh-8rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[#E9DDC6] bg-[#FCF8F1] shadow-2xl sm:w-[400px]">
          {/* Header */}
          <div className="relative flex items-center justify-between gap-3 overflow-hidden bg-[#1A1510] px-4 py-3.5 text-[#F6EEDD]">
            <div aria-hidden className="uy-lattice-light pointer-events-none absolute inset-0 opacity-70" />
            <div className="relative flex min-w-0 items-center gap-3">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#1F1A14] shadow-[0_6px_16px_-6px_rgba(217,181,106,.7)]" style={{ background: "linear-gradient(120deg, #B8903F 0%, #E6CB86 45%, #C9A24E 70%, #A8823A 100%)" }}>
                <IconMessageCircle size={18} stroke={1.8} />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#1A1510] bg-emerald-400" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-(family-name:--font-landing-display) text-[15px] leading-tight sm:text-base">Asisten SatuMoment</p>
                <p className="mt-0.5 truncate text-[11px] text-[#CDBF9F]">Online · siap membantu</p>
              </div>
            </div>

            <div className="relative flex shrink-0 items-center gap-1">
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Chat admin lewat WhatsApp"
                  title="Chat admin lewat WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D9B56A]/40 text-[#D9B56A] transition hover:bg-[#D9B56A] hover:text-[#1A1510]"
                >
                  <IconBrandWhatsapp size={18} />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => toast("Nomor WhatsApp Admin belum diisi di Pengaturan Sistem Admin.")}
                  aria-label="Chat admin lewat WhatsApp"
                  title="Chat admin lewat WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-[#CDBF9F] transition hover:bg-white/10"
                >
                  <IconBrandWhatsapp size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup chat"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#CDBF9F] transition hover:bg-white/10 hover:text-white"
              >
                <IconX size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4">
            {messages.map((m) => {
              const isUser = m.sender === "USER";
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <span className="mb-1 inline-flex items-center gap-1 px-1 text-[10px] font-medium text-[#7E7262]">
                    {isUser ? "Anda" : "Asisten AI"} · {m.time}
                  </span>
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-2xs ${
                      isUser
                        ? "rounded-br-sm bg-[#1A1510] text-[#FCF8F1]"
                        : "rounded-bl-sm border border-[#EDE2CC] bg-white text-[#2B251D]"
                    }`}
                  >
                    <ChatMessageText content={m.content} isUserBubble={isUser} />
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex items-center gap-1.5 text-xs text-[#6B5F50]">
                <IconLoader2 size={13} className="animate-spin" />
                Asisten mengetik...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions stay available for the whole chat: wrapped at the start, one scrollable row once the conversation is going */}
          <div className={`flex gap-1.5 border-t border-[#F3EADA] bg-white/80 px-3.5 py-2.5 ${messages.length <= 2 ? "flex-wrap" : "overflow-x-auto [scrollbar-width:none]"}`}>
            {STARTERS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={sending}
                onClick={() => sendMessage(q)}
                className="flex min-h-8 shrink-0 items-center whitespace-nowrap rounded-full border border-[#E9DDC6] bg-white px-3 text-[11px] font-medium text-[#463C2F] transition hover:border-[#8A6424] hover:text-[#1A1510] disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-[#EDE2CC] bg-white px-3.5 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya harga, fitur, atau Desain AI..."
              className="h-10 flex-1 rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-4 text-xs text-[#1A1510] placeholder:text-[#A89470] focus:border-[#8A6424] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Kirim pesan"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1A1510] text-[#FCF8F1] transition hover:bg-[#2B241B] disabled:opacity-40"
            >
              <IconSend size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Launcher Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 items-center gap-2 rounded-full bg-[#1A1510] px-4 text-sm font-medium text-[#FCF8F1] shadow-lg ring-1 ring-white/10 transition hover:bg-[#2B241B]"
      >
        <IconMessageCircle size={18} className="text-[#D9B56A]" />
        <span>{open ? "Tutup Chat" : "Tanya AI"}</span>
      </button>
    </div>
  );
}
