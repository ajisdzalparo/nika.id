"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  IconHeadset,
  IconLoader2,
  IconMessageCircle,
  IconPhotoPlus,
  IconSend,
  IconX,
} from "@tabler/icons-react";
import { ChatMessageText } from "@/components/common/chat-message-text";
import { playChatSound } from "@/lib/sound";

interface ChatMsg {
  id: string;
  sender: string; // "USER" | "AI" | "ADMIN" | "SYSTEM"
  content: string;
  createdAt: string;
}

interface ChatThread {
  id: string;
  mode: string; // "AI" | "ADMIN"
  status?: string; // "OPEN" | "CLOSED"
  waitingInQueue?: boolean;
  queuePosition?: number | null;
}

const STARTERS = [
  "Info harga paket & upgrade",
  "Cara bayar & cek progress manual",
  "Cara pakai musik YouTube",
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function CustomerChatWidget() {
  const [open, setOpen] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [adminTyping, setAdminTyping] = useState(false);
  const [input, setInput] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const openRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTypingPingRef = useRef(0);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adminTypingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const loadChat = useCallback(async () => {
    try {
      const res = await fetch("/api/chat", { cache: "no-store" });
      if (!res.ok) return;
      const d = await res.json();
      if (d.thread) setThread(d.thread);
      if (Array.isArray(d.messages)) setMessages(d.messages);
    } catch {
      // silent
    }
  }, []);

  const pingTyping = useCallback((isTyping: boolean) => {
    fetch("/api/chat/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portal: "user", isTyping }),
    }).catch(() => {});
  }, []);

  // Keep SSE connected so incoming Admin replies chime & increment badge even when minimized
  useEffect(() => {
    loadChat();

    const es = new EventSource("/api/chat/stream?portal=user");

    es.addEventListener("message", (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data) as { message?: ChatMsg };
        const incoming = data.message;
        if (!incoming) return;

        let isNew = false;
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          isNew = true;
          return [...prev, incoming];
        });

        if (isNew && (incoming.sender === "ADMIN" || incoming.sender === "AI")) {
          playChatSound();
          if (!openRef.current) {
            setUnreadChat((c) => c + 1);
          }
        }
        if (isNew && incoming.sender === "ADMIN") {
          setThread((prev) => (prev ? { ...prev, waitingInQueue: false, queuePosition: null } : prev));
        }
      } catch {
        // ignore malformed event
      }
    });

    es.addEventListener("thread", (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data) as { mode?: string; status?: string };
        setThread((prev) =>
          prev
            ? { ...prev, mode: data.mode ?? prev.mode, status: data.status ?? prev.status }
            : prev,
        );
        loadChat();
      } catch {
        // ignore
      }
    });

    es.addEventListener("typing", (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data) as { adminTyping?: boolean };
        const isTyping = Boolean(data.adminTyping);
        setAdminTyping(isTyping);
        if (adminTypingClearRef.current) clearTimeout(adminTypingClearRef.current);
        if (isTyping) {
          adminTypingClearRef.current = setTimeout(() => setAdminTyping(false), 4000);
        }
      } catch {
        // ignore
      }
    });

    const fallback = setInterval(() => loadChat(), 25_000);

    return () => {
      es.close();
      clearInterval(fallback);
      if (adminTypingClearRef.current) clearTimeout(adminTypingClearRef.current);
    };
  }, [loadChat]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages, adminTyping, attachmentUrl]);

  const uploadChatImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/chat/upload", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.url) {
        toast.error(d.message || "Gagal mengunggah gambar");
        return;
      }
      setAttachmentUrl(d.url);
    } catch {
      toast.error("Gagal mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) uploadChatImage(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (file) {
      e.preventDefault();
      uploadChatImage(file);
    }
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    const hasText = val.trim().length > 0;
    if (!hasText) {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      lastTypingPingRef.current = 0;
      pingTyping(false);
      return;
    }

    const now = Date.now();
    if (now - lastTypingPingRef.current > 1500) {
      lastTypingPingRef.current = now;
      pingTyping(true);
    }
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => {
      pingTyping(false);
    }, 3000);
  };

  const sendAction = async (payload: Record<string, unknown>) => {
    setSending(true);
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    lastTypingPingRef.current = 0;
    pingTyping(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) {
        toast.error(d.message || "Gagal mengirim pesan");
        return;
      }
      if (d.thread) setThread(d.thread);
      if (Array.isArray(d.messages)) setMessages(d.messages);
    } catch {
      toast.error("Koneksi chat terputus.");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if ((!trimmed && !attachmentUrl) || sending || uploading) return;
    const nextAttachment = attachmentUrl;
    setInput("");
    setAttachmentUrl(null);
    await sendAction({ action: "SEND", content: trimmed, attachmentUrl: nextAttachment });
  };

  const isAdminMode = thread?.mode === "ADMIN";
  const isClosed = thread?.status === "CLOSED";
  const inQueue = isAdminMode && !isClosed && Boolean(thread?.waitingInQueue);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div className="flex h-[540px] max-h-[calc(100vh-5.5rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[#E9DDC6] bg-[#FCF8F1] shadow-2xl sm:w-[410px]">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 bg-[#1A1510] px-4 py-3.5 text-[#FCF8F1]">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#D9B56A]">
                {isAdminMode ? <IconHeadset size={16} /> : <IconMessageCircle size={16} />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-tight">
                  {isAdminMode ? "Admin Live Support" : "Asisten SatuMoment"}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-zinc-400">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      isClosed ? "bg-zinc-500" : adminTyping ? "animate-pulse bg-[#E6CB8A]" : "bg-[#D9B56A]"
                    }`}
                  />
                  {isClosed
                    ? "Sesi ditutup oleh admin"
                    : adminTyping
                      ? "Admin sedang mengetik..."
                      : inQueue
                        ? `Antrean Admin #${thread?.queuePosition ?? 1} · Menunggu`
                        : isAdminMode
                          ? "Admin terhubung"
                          : "Siap bantu · Bisa ke admin"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {!isClosed && (
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => sendAction({ action: isAdminMode ? "SWITCH_AI" : "CONNECT_ADMIN" })}
                  className="whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[#F5E8CA] transition hover:bg-white/20 disabled:opacity-50"
                >
                  {isAdminMode ? "Kembali ke AI" : "Hubungi Admin"}
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

          {/* Queue banner while waiting for admin */}
          {inQueue && (
            <div className="flex items-center justify-between gap-2 border-b border-[#E3CFA0] bg-[#FBF4E3] px-4 py-2 text-[11px] text-[#6E4F1C]">
              <span>Kamu berada di antrean #{thread?.queuePosition ?? 1}. Silakan tulis kendala atau kirim gambar dulu.</span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4 [scrollbar-width:thin]">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <IconLoader2 className="animate-spin text-[#8A6424]" />
              </div>
            ) : (
              messages.map((m) => {
                if (m.sender === "SYSTEM") {
                  return (
                    <div key={m.id} className="py-1 text-center">
                      <span className="inline-block rounded-full border border-[#E5DDD0] bg-[#EFE9DD] px-3 py-1 text-[11px] text-[#5E5446]">
                        {m.content}
                      </span>
                    </div>
                  );
                }

                const isUser = m.sender === "USER";
                const isAdminMsg = m.sender === "ADMIN";
                return (
                  <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    <span className="mb-1 inline-flex items-center gap-1 px-1 text-[10px] font-medium text-[#7A7164]">
                      {isUser ? (
                        "Anda"
                      ) : isAdminMsg ? (
                        <>
                          <IconHeadset size={11} className="text-[#8A6424]" /> Admin
                        </>
                      ) : (
                        <>
                          <IconMessageCircle size={11} className="text-[#8A6424]" /> Asisten AI
                        </>
                      )}
                      <span>· {formatTime(m.createdAt)}</span>
                    </span>
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-2xs ${
                        isUser
                          ? "rounded-br-sm bg-[#1A1510] text-[#FCF8F1]"
                          : isAdminMsg
                            ? "rounded-bl-sm border border-[#E3C77F] bg-[#FBF4E3] text-[#1A1510]"
                            : "rounded-bl-sm border border-[#EDE3CF] bg-white text-[#2E2A24]"
                      }`}
                    >
                      <ChatMessageText content={m.content} isUserBubble={isUser} />
                    </div>
                  </div>
                );
              })
            )}

            {adminTyping && (
              <div className="flex flex-col items-start">
                <span className="mb-1 inline-flex items-center gap-1 px-1 text-[10px] font-medium text-[#8A6424]">
                  <IconHeadset size={11} /> Admin sedang mengetik
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-[#E3C77F] bg-[#FBF4E3] px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8A6424] [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8A6424] [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8A6424] [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {sending && (
              <div className="flex items-center gap-1.5 text-xs text-[#6B5F50]">
                <IconLoader2 size={13} className="animate-spin" />
                {isAdminMode ? "Mengirim ke admin..." : "Asisten mengetik..."}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Session Closed Banner OR Quick Starters */}
          {isClosed ? (
            <div className="flex items-center justify-between gap-2 border-t border-[#EDE3CF] bg-[#F3EDE2] px-4 py-2.5">
              <p className="text-xs text-[#5E5446]">Sesi live chat ditutup admin.</p>
              <button
                type="button"
                disabled={sending}
                onClick={() => sendAction({ action: "REOPEN" })}
                className="rounded-full bg-[#1A1510] px-3 py-1 text-[11px] font-medium text-[#FCF8F1] hover:bg-[#2B241B]"
              >
                Mulai Sesi Baru
              </button>
            </div>
          ) : (
            !isAdminMode &&
            messages.length <= 2 && (
              <div className="flex flex-wrap gap-1.5 border-t border-[#F3EBDB] bg-white/80 px-3.5 py-2.5">
                {STARTERS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={sending}
                    onClick={() => sendAction({ action: "SEND", content: q })}
                    className="rounded-full border border-[#E9DDC6] bg-white px-3 py-1 text-[11px] font-medium text-[#40372B] transition hover:border-[#8A6424] hover:text-[#1A1510]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )
          )}

          {/* Pending Image Attachment Preview */}
          {attachmentUrl && (
            <div className="flex items-center justify-between gap-3 border-t border-[#F3EBDB] bg-[#FCF8F1] px-3.5 py-2">
              <div className="flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={attachmentUrl} alt="Pratinjau lampiran" className="h-11 w-11 rounded-lg border border-[#E9DDC6] object-cover" />
                <span className="text-xs font-medium text-[#5E5446]">Gambar siap dikirim</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachmentUrl(null)}
                aria-label="Hapus lampiran"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B5F50] hover:bg-[#F3EBDB] hover:text-[#1A1510]"
              >
                <IconX size={14} />
              </button>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-[#EDE3CF] bg-white px-3 py-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading || sending}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Lampirkan gambar"
              title="Lampirkan gambar (JPG, PNG, WebP, GIF)"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E9DDC6] bg-[#FCF8F1] text-[#5E5446] transition hover:border-[#8A6424] hover:text-[#1A1510] disabled:opacity-40"
            >
              {uploading ? <IconLoader2 size={16} className="animate-spin" /> : <IconPhotoPlus size={17} />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onPaste={handlePaste}
              onBlur={() => pingTyping(false)}
              placeholder={
                isClosed
                  ? "Kirim pesan untuk memulai sesi baru..."
                  : isAdminMode
                    ? "Tulis pesan atau tempel gambar..."
                    : "Tanya seputar undangan atau bayar..."
              }
              className="h-10 flex-1 rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-4 text-xs text-[#1A1510] placeholder:text-[#8C8272] focus:border-[#8A6424] focus:outline-none"
            />
            <button
              type="submit"
              disabled={(!input.trim() && !attachmentUrl) || sending || uploading}
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
        onClick={() => {
          setOpen((v) => !v);
          setUnreadChat(0);
        }}
        className="relative flex h-12 items-center gap-2 rounded-full bg-[#1A1510] px-4 text-sm font-medium text-[#FCF8F1] shadow-lg ring-1 ring-white/10 transition hover:bg-[#2B241B]"
      >
        {isAdminMode && !isClosed ? (
          <IconHeadset size={18} className="text-[#D9B56A]" />
        ) : (
          <IconMessageCircle size={18} className="text-[#D9B56A]" />
        )}
        <span>{open ? "Tutup Chat" : "Chat Bantuan"}</span>
        {!open && unreadChat > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D9B56A] px-1.5 text-[11px] font-semibold text-[#1A1510]">
            {unreadChat > 9 ? "9+" : unreadChat}
          </span>
        )}
      </button>
    </div>
  );
}
