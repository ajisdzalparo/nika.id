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
        "Halo! Saya asisten AI **UNDANGIN YUK**. Ada yang ingin ditanyakan soal harga paket, Desain AI, atau cara buat undangan digital?",
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

  const waHref = waLink(whatsapp, "Halo admin UNDANGIN YUK, saya mau tanya tentang undangan digital.");

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {open && (
        <div className="flex h-[510px] max-h-[calc(100vh-8rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[#DFD7C8] bg-[#FAF8F4] shadow-2xl sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 bg-[#15130F] px-4 py-3.5 text-[#FAF8F4]">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#C9A45C]">
                <IconMessageCircle size={16} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-tight">Asisten UNDANGIN YUK</p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-zinc-400">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A45C]" />
                  Tanya AI seputar layanan
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-[11px] font-medium text-emerald-200 transition hover:bg-emerald-500/25"
                >
                  <IconBrandWhatsapp size={14} /> WhatsApp Admin
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => toast("Nomor WhatsApp Admin belum diisi di Pengaturan Sistem Admin.")}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition hover:bg-white/20"
                >
                  <IconBrandWhatsapp size={14} /> WhatsApp Admin
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup chat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <IconX size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4 [scrollbar-width:thin]">
            {messages.map((m) => {
              const isUser = m.sender === "USER";
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <span className="mb-1 inline-flex items-center gap-1 px-1 text-[10px] font-medium text-[#7A7164]">
                    {isUser ? "Anda" : "Asisten AI"} · {m.time}
                  </span>
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-2xs ${
                      isUser
                        ? "rounded-br-sm bg-[#15130F] text-[#FAF8F4]"
                        : "rounded-bl-sm border border-[#E6DFD3] bg-white text-[#2E2A24]"
                    }`}
                  >
                    <ChatMessageText content={m.content} isUserBubble={isUser} />
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex items-center gap-1.5 text-xs text-[#6B6358]">
                <IconLoader2 size={13} className="animate-spin" />
                Asisten mengetik...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Starters */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-1.5 border-t border-[#EFEAE0] bg-white/80 px-3.5 py-2.5">
              {STARTERS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={sending}
                  onClick={() => sendMessage(q)}
                  className="rounded-full border border-[#DFD7C8] bg-white px-3 py-1 text-[11px] font-medium text-[#3F3A33] transition hover:border-[#8A6A2F] hover:text-[#15130F]"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-[#E6DFD3] bg-white px-3.5 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya harga, fitur, atau Desain AI..."
              className="h-10 flex-1 rounded-full border border-[#E1D8C9] bg-[#FAF8F4] px-4 text-xs text-[#15130F] placeholder:text-[#8C8272] focus:border-[#8A6A2F] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Kirim pesan"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#15130F] text-[#FAF8F4] transition hover:bg-[#2A261F] disabled:opacity-40"
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
        className="flex h-12 items-center gap-2 rounded-full bg-[#15130F] px-4 text-sm font-medium text-[#FAF8F4] shadow-lg ring-1 ring-white/10 transition hover:bg-[#2A261F]"
      >
        <IconMessageCircle size={18} className="text-[#C9A45C]" />
        <span>{open ? "Tutup Chat" : "Tanya AI"}</span>
      </button>
    </div>
  );
}
