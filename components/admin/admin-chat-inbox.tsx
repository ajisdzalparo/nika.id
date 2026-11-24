"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  IconClock,
  IconHeadset,
  IconLoader2,
  IconMessageCircle,
  IconPhotoPlus,
  IconPower,
  IconRefresh,
  IconSearch,
  IconSend,
  IconX,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatMessageText, formatChatPreview } from "@/components/common/chat-message-text";
import { playChatSound } from "@/lib/sound";

interface AdminThreadItem {
  id: string;
  userId: string;
  mode: string;
  status: string;
  lastMessageAt: string;
  waitingInQueue?: boolean;
  queuePosition?: number | null;
  requestedAdminAt?: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  messages?: Array<{ content: string; sender: string }>;
}

interface AdminChatMsg {
  id: string;
  threadId?: string;
  sender: string;
  content: string;
  createdAt: string;
}

type ThreadFilter = "ALL" | "QUEUE" | "LIVE" | "CLOSED";

const QUICK_REPLIES = [
  "Halo kak, ada yang bisa kami bantu?",
  "Pembayaran kakak sudah kami verifikasi dan paketnya sudah aktif ya.",
  "Silakan cek detailnya di menu /upgrade ya kak.",
];

function timeAgoShort(iso: string) {
  const diff = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diff < 60) return "Baru saja";
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m} mnt`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function AdminChatInbox({
  initialThreads,
  initialActiveId,
  initialMessages,
}: {
  initialThreads: AdminThreadItem[];
  initialActiveId: string | null;
  initialMessages: AdminChatMsg[];
}) {
  const [threads, setThreads] = useState<AdminThreadItem[]>(initialThreads);
  const [activeId, setActiveId] = useState<string | null>(initialActiveId);
  const [messages, setMessages] = useState<AdminChatMsg[]>(initialMessages);
  const [typingByThread, setTypingByThread] = useState<Record<string, boolean>>({});

  const [filter, setFilter] = useState<ThreadFilter>("ALL");
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(initialActiveId);
  const lastTypingPingRef = useRef(0);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userTypingClearTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const activeThread = threads.find((t) => t.id === activeId) ?? null;

  const queueThreads = useMemo(
    () =>
      threads
        .filter((t) => t.waitingInQueue && t.status !== "CLOSED")
        .sort((a, b) => (a.queuePosition ?? 999) - (b.queuePosition ?? 999)),
    [threads],
  );

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = threads.filter((t) => {
      if (filter === "QUEUE" && !(t.waitingInQueue && t.status !== "CLOSED")) return false;
      if (filter === "LIVE" && !(t.mode === "ADMIN" && !t.waitingInQueue && t.status !== "CLOSED")) return false;
      if (filter === "CLOSED" && t.status !== "CLOSED") return false;
      if (!q) return true;
      const name = (t.user?.name || "").toLowerCase();
      const email = (t.user?.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
    if (filter === "QUEUE") {
      return [...list].sort((a, b) => (a.queuePosition ?? 999) - (b.queuePosition ?? 999));
    }
    return list;
  }, [threads, filter, search]);

  const refresh = useCallback(async (targetId: string | null) => {
    try {
      const qs = targetId ? `?threadId=${encodeURIComponent(targetId)}` : "";
      const res = await fetch(`/api/admin/chat${qs}`, { cache: "no-store" });
      if (!res.ok) return;
      const d = await res.json();
      if (Array.isArray(d.threads)) setThreads(d.threads);
      if (d.activeThreadId && !targetId) setActiveId(d.activeThreadId);
      if (Array.isArray(d.messages)) setMessages(d.messages);
    } catch {
      // silent
    }
  }, []);

  const pingAdminTyping = useCallback((threadId: string | null, isTyping: boolean) => {
    if (!threadId) return;
    fetch("/api/chat/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portal: "admin", threadId, isTyping }),
    }).catch(() => {});
  }, []);

  // Realtime SSE listener across all threads
  useEffect(() => {
    const es = new EventSource("/api/chat/stream?portal=admin");

    es.addEventListener("message", (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data) as { threadId?: string; message?: AdminChatMsg };
        const incoming = data.message;
        const tid = data.threadId ?? incoming?.threadId;
        if (!incoming || !tid) return;

        if (incoming.sender === "USER") {
          playChatSound();
        }

        if (tid === activeIdRef.current) {
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        }

        setThreads((prev) => {
          const exists = prev.some((t) => t.id === tid);
          if (!exists) {
            refresh(activeIdRef.current);
            return prev;
          }
          const updated = prev.map((t) =>
            t.id === tid
              ? {
                  ...t,
                  lastMessageAt: incoming.createdAt,
                  messages: [{ content: incoming.content, sender: incoming.sender }],
                }
              : t,
          );
          return [...updated].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        });
      } catch {
        // ignore
      }
    });

    es.addEventListener("thread", () => {
      refresh(activeIdRef.current);
    });

    es.addEventListener("typing", (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data) as { threadId?: string; userTyping?: boolean };
        const tid = data.threadId;
        if (!tid) return;
        const isTyping = Boolean(data.userTyping);
        setTypingByThread((prev) => ({ ...prev, [tid]: isTyping }));
        if (userTypingClearTimers.current[tid]) clearTimeout(userTypingClearTimers.current[tid]);
        if (isTyping) {
          userTypingClearTimers.current[tid] = setTimeout(() => {
            setTypingByThread((prev) => ({ ...prev, [tid]: false }));
          }, 4000);
        }
      } catch {
        // ignore
      }
    });

    const fallback = setInterval(() => refresh(activeIdRef.current), 25_000);

    return () => {
      es.close();
      clearInterval(fallback);
    };
  }, [refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId, typingByThread, attachmentUrl]);

  const selectThread = async (id: string) => {
    if (activeId && activeId !== id) {
      pingAdminTyping(activeId, false);
    }
    setActiveId(id);
    await refresh(id);
  };

  const uploadAdminImage = async (file: File) => {
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
    if (file) uploadAdminImage(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (file) {
      e.preventDefault();
      uploadAdminImage(file);
    }
  };

  const handleReplyChange = (val: string) => {
    setReply(val);
    if (!activeId) return;
    if (!val.trim()) {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
      lastTypingPingRef.current = 0;
      pingAdminTyping(activeId, false);
      return;
    }
    const now = Date.now();
    if (now - lastTypingPingRef.current > 1500) {
      lastTypingPingRef.current = now;
      pingAdminTyping(activeId, true);
    }
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = setTimeout(() => {
      pingAdminTyping(activeId, false);
    }, 3000);
  };

  const handleAction = async (action: "RELEASE_AI" | "TAKEOVER" | "CLOSE_SESSION", overrideThreadId?: string) => {
    const tid = overrideThreadId ?? activeId;
    if (!tid || sending) return;
    setSending(true);
    pingAdminTyping(tid, false);
    if (overrideThreadId && overrideThreadId !== activeId) {
      setActiveId(overrideThreadId);
    }
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: tid, action }),
      });
      const d = await res.json();
      if (!res.ok) return toast.error(d.message || "Gagal memperbarui sesi");
      if (Array.isArray(d.messages)) setMessages(d.messages);
      if (Array.isArray(d.threads)) setThreads(d.threads);
      if (action === "CLOSE_SESSION") toast.success("Sesi live chat ditutup");
      if (action === "RELEASE_AI") toast.success("Sesi dikembalikan ke Asisten AI");
      if (action === "TAKEOVER") toast.success("Terhubung melayani user");
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || (!reply.trim() && !attachmentUrl) || sending || uploading) return;
    const text = reply.trim();
    const nextAttachment = attachmentUrl;
    setSending(true);
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    lastTypingPingRef.current = 0;
    pingAdminTyping(activeId, false);

    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeId, content: text, attachmentUrl: nextAttachment }),
      });
      const d = await res.json();
      if (!res.ok) return toast.error(d.message || "Gagal mengirim balasan");
      setReply("");
      setAttachmentUrl(null);
      if (Array.isArray(d.messages)) setMessages(d.messages);
      if (Array.isArray(d.threads)) setThreads(d.threads);
    } finally {
      setSending(false);
    }
  };

  const liveAdminCount = threads.filter((t) => t.mode === "ADMIN" && !t.waitingInQueue && t.status !== "CLOSED").length;
  const activeUserTyping = activeId ? Boolean(typingByThread[activeId]) : false;

  return (
    <div className="space-y-4">
      {/* Antrean Permintaan Hubungi Admin (FIFO Queue Strip) */}
      {queueThreads.length > 0 && (
        <div className="rounded-2xl border border-[#DFC793] bg-[#FBF4E3] p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8A6A2F] text-white">
                <IconClock size={14} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#15130F]">
                  Antrean Minta Hubungi Admin ({queueThreads.length})
                </p>
                <p className="text-xs text-[#6E5426]">Urutan paling awal berada di posisi #1</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFilter("QUEUE")}
              className="rounded-full border border-[#D4BC82] bg-white px-3 py-1 text-xs font-medium text-[#5C4620] hover:bg-[#FAF8F4]"
            >
              Tampilkan Antrean
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
            {queueThreads.map((q) => {
              const name = q.user?.name || q.user?.email || "User";
              return (
                <div
                  key={q.id}
                  className="flex shrink-0 items-center gap-3 rounded-xl border border-[#DFC793] bg-white px-3 py-2 shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => selectThread(q.id)}
                    className="flex items-center gap-2.5 text-left"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#15130F] text-[11px] font-semibold text-[#FAF8F4]">
                      #{q.queuePosition}
                    </span>
                    <div className="min-w-0">
                      <p className="max-w-36 truncate text-xs font-semibold text-[#15130F]">{name}</p>
                      <p className="text-[10px] text-[#6B6358]">
                        Menunggu · {timeAgoShort(q.requestedAdminAt || q.lastMessageAt)}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => handleAction("TAKEOVER", q.id)}
                    className="rounded-full bg-[#8A6A2F] px-3 py-1 text-[11px] font-medium text-white transition hover:bg-[#735724] disabled:opacity-50"
                  >
                    Layani
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Inbox Container */}
      <div className="grid min-h-[600px] overflow-hidden rounded-2xl border border-[#DFD7C8] bg-white shadow-xs lg:h-[calc(100vh-12rem)] lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Left Thread List */}
        <aside className="flex flex-col border-b border-[#EFEAE0] bg-[#FDFBF7] lg:border-b-0 lg:border-r">
          <div className="space-y-3 border-b border-[#EFEAE0] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#15130F]">Percakapan ({threads.length})</p>
              {queueThreads.length > 0 && (
                <span className="rounded-full border border-[#E3CFA0] bg-[#FBF3E0] px-2.5 py-0.5 text-[11px] font-semibold text-[#78571E]">
                  {queueThreads.length} Antre
                </span>
              )}
            </div>

            <div className="relative">
              <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8272]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="search"
                aria-label="Cari percakapan"
                placeholder="Cari nama atau email..."
                className="h-9 w-full rounded-xl border border-[#E1D8C9] bg-white pl-8 pr-3 text-xs text-[#15130F] placeholder:text-[#8C8272] focus:border-[#8A6A2F] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-4 gap-1">
              {(
                [
                  ["ALL", "Semua"],
                  ["QUEUE", `Antre (${queueThreads.length})`],
                  ["LIVE", `Live (${liveAdminCount})`],
                  ["CLOSED", "Selesai"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`rounded-lg px-1.5 py-1.5 text-[11px] font-medium transition ${
                    filter === key
                      ? "bg-[#15130F] text-[#FAF8F4]"
                      : "border border-[#E6DFD3] bg-white text-[#5E574D] hover:bg-[#FAF8F4]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 divide-y divide-[#EFEAE0] overflow-y-auto [scrollbar-width:thin]">
            {filteredThreads.length === 0 ? (
              <div className="px-4 py-14 text-center text-xs text-[#6B6358]">
                Tidak ada percakapan di filter ini.
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected = t.id === activeId;
                const isTyping = Boolean(typingByThread[t.id]);
                const lastMsg = t.messages?.[0];
                const name = t.user?.name || t.user?.email || "User";
                const isClosed = t.status === "CLOSED";
                const isQueued = Boolean(t.waitingInQueue && !isClosed);
                const isLiveAdmin = t.mode === "ADMIN" && !isQueued && !isClosed;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectThread(t.id)}
                    className={`flex w-full items-start gap-3 border-l-2 px-4 py-3.5 text-left transition hover:bg-[#F7F2E8]/70 ${
                      isSelected ? "border-[#8A6A2F] bg-[#F8F2E6]" : "border-transparent"
                    }`}
                  >
                    <Avatar className="h-9 w-9 shrink-0 border border-[#E6DFD3]">
                      <AvatarImage src={t.user?.image || undefined} alt={name} />
                      <AvatarFallback className="bg-[#EFE8DC] text-xs font-medium text-[#5C4620]">
                        {name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold text-[#15130F]">{name}</p>
                        <span className="shrink-0 text-[10px] text-[#8C8272]">{timeAgoShort(t.lastMessageAt)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-xs ${isTyping ? "font-medium text-[#8A6A2F]" : "text-[#6B6358]"}`}>
                          {isTyping ? "Sedang mengetik..." : lastMsg ? formatChatPreview(lastMsg.content) : t.user?.email}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isClosed
                              ? "bg-zinc-100 text-zinc-500"
                              : isQueued
                                ? "bg-[#15130F] text-[#F4EAD6]"
                                : isLiveAdmin
                                  ? "border border-[#DFC793] bg-[#FBF4E3] text-[#78571E]"
                                  : "border border-[#E6DFD3] bg-white text-[#5E574D]"
                          }`}
                        >
                          {isClosed
                            ? "Selesai"
                            : isQueued
                              ? `Antre #${t.queuePosition ?? 1}`
                              : isLiveAdmin
                                ? "Live"
                                : "AI"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Active Conversation */}
        <section className="flex min-h-0 flex-col bg-white">
          {activeThread ? (
            <>
              {/* Header */}
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFEAE0] bg-white px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0 border border-[#E6DFD3]">
                    <AvatarImage src={activeThread.user?.image || undefined} alt={activeThread.user?.name || "User"} />
                    <AvatarFallback className="bg-[#EFE8DC] text-xs font-medium text-[#5C4620]">
                      {(activeThread.user?.name || activeThread.user?.email || "U")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#15130F]">
                        {activeThread.user?.name || activeThread.user?.email}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          activeThread.status === "CLOSED"
                            ? "bg-zinc-100 text-zinc-600"
                            : activeThread.waitingInQueue
                              ? "bg-[#15130F] text-[#F4EAD6]"
                              : activeThread.mode === "ADMIN"
                                ? "border border-[#DFC793] bg-[#FBF4E3] text-[#78571E]"
                                : "border border-[#E6DFD3] bg-[#FAF8F4] text-[#5E574D]"
                        }`}
                      >
                        {activeThread.status === "CLOSED"
                          ? "Sesi Ditutup"
                          : activeThread.waitingInQueue
                            ? `Antrean #${activeThread.queuePosition ?? 1}`
                            : activeThread.mode === "ADMIN"
                              ? "Admin Live"
                              : "Asisten AI"}
                      </span>
                    </div>
                    <p className="truncate text-xs text-[#6B6358]">
                      {activeUserTyping ? (
                        <span className="font-medium text-[#8A6A2F]">Sedang mengetik...</span>
                      ) : (
                        activeThread.user?.email
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {activeThread.status === "CLOSED" ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAction("TAKEOVER")} disabled={sending}>
                      <IconRefresh size={14} className="mr-1.5" /> Buka Sesi Kembali
                    </Button>
                  ) : (
                    <>
                      {activeThread.waitingInQueue ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleAction("TAKEOVER")}
                          disabled={sending}
                          className="bg-[#8A6A2F] text-white hover:bg-[#735724]"
                        >
                          <IconHeadset size={14} className="mr-1.5" /> Layani Sekarang
                        </Button>
                      ) : activeThread.mode === "ADMIN" ? (
                        <Button type="button" variant="outline" size="sm" onClick={() => handleAction("RELEASE_AI")} disabled={sending}>
                          Kembalikan ke AI
                        </Button>
                      ) : (
                        <Button type="button" variant="outline" size="sm" onClick={() => handleAction("TAKEOVER")} disabled={sending}>
                          <IconHeadset size={14} className="mr-1.5" /> Ambil Alih
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction("CLOSE_SESSION")}
                        disabled={sending}
                        className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                      >
                        <IconPower size={14} className="mr-1.5" /> Tutup Sesi
                      </Button>
                    </>
                  )}
                </div>
              </header>

              {/* Messages Thread */}
              <div className="flex-1 space-y-4 overflow-y-auto bg-[#FAF8F4] px-5 py-5 [scrollbar-width:thin] sm:px-6">
                {messages.map((m) => {
                  if (m.sender === "SYSTEM") {
                    return (
                      <div key={m.id} className="py-1 text-center">
                        <span className="inline-block rounded-full border border-[#E5DDD0] bg-[#EFE9DD] px-3 py-1 text-[11px] text-[#5E574D]">
                          {m.content}
                        </span>
                      </div>
                    );
                  }

                  const isAdmin = m.sender === "ADMIN";
                  const isAi = m.sender === "AI";
                  return (
                    <div key={m.id} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                      <span className="mb-1 inline-flex items-center gap-1 px-1 text-[10px] font-medium text-[#7A7164]">
                        {isAdmin ? "Admin (Anda)" : isAi ? "Asisten AI" : activeThread.user?.name || "User"} · {formatClock(m.createdAt)}
                      </span>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-2xs ${
                          isAdmin
                            ? "rounded-br-sm bg-[#15130F] text-[#FAF8F4]"
                            : isAi
                              ? "rounded-bl-sm border border-[#E6DFD3] bg-white text-[#2E2A24]"
                              : "rounded-bl-sm border border-[#DFC793] bg-[#FBF4E3] text-[#15130F]"
                        }`}
                      >
                        <ChatMessageText content={m.content} isUserBubble={isAdmin} />
                      </div>
                    </div>
                  );
                })}

                {activeUserTyping && (
                  <div className="flex flex-col items-start">
                    <span className="mb-1 px-1 text-[10px] font-medium text-[#8A6A2F]">
                      {activeThread.user?.name || "User"} sedang mengetik
                    </span>
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-[#DFC793] bg-[#FBF4E3] px-4 py-3">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8A6A2F] [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8A6A2F] [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8A6A2F] [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Pending Image Preview */}
              {attachmentUrl && (
                <div className="flex items-center justify-between gap-3 border-t border-[#EFEAE0] bg-[#FAF8F4] px-4 py-2">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={attachmentUrl} alt="Pratinjau lampiran" className="h-11 w-11 rounded-lg border border-[#E1D8C9] object-cover" />
                    <span className="text-xs font-medium text-[#5E574D]">Gambar siap dikirim</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachmentUrl(null)}
                    aria-label="Hapus lampiran"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#6B6358] hover:bg-[#EFEAE0] hover:text-[#15130F]"
                  >
                    <IconX size={14} />
                  </button>
                </div>
              )}

              {/* Quick Replies + Composer */}
              <div className="border-t border-[#EFEAE0] bg-white px-4 py-3">
                {activeThread.status !== "CLOSED" && (
                  <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                    {QUICK_REPLIES.map((qr) => (
                      <button
                        key={qr}
                        type="button"
                        onClick={() => handleReplyChange(qr)}
                        className="shrink-0 rounded-full border border-[#E6DFD3] bg-[#FAF8F4] px-3 py-1 text-[11px] text-[#4E473E] transition hover:border-[#8A6A2F] hover:text-[#15130F]"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSend} className="flex items-center gap-2">
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
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E1D8C9] bg-[#FAF8F4] text-[#5E574D] transition hover:border-[#8A6A2F] hover:text-[#15130F] disabled:opacity-40"
                  >
                    {uploading ? <IconLoader2 size={16} className="animate-spin" /> : <IconPhotoPlus size={17} />}
                  </button>
                  <input
                    type="text"
                    aria-label="Tulis balasan"
                    value={reply}
                    onChange={(e) => handleReplyChange(e.target.value)}
                    onPaste={handlePaste}
                    onBlur={() => pingAdminTyping(activeId, false)}
                    placeholder={
                      activeThread.status === "CLOSED"
                        ? "Kirim pesan untuk membuka kembali sesi..."
                        : "Balas langsung sebagai admin atau tempel gambar..."
                    }
                    className="h-10 flex-1 rounded-full border border-[#E1D8C9] bg-[#FAF8F4] px-4 text-sm text-[#15130F] placeholder:text-[#8C8272] focus:border-[#8A6A2F] focus:outline-none"
                  />
                  <Button
                    type="submit"
                    disabled={(!reply.trim() && !attachmentUrl) || sending || uploading}
                    className="h-10 rounded-full bg-[#15130F] px-5 text-[#FAF8F4] hover:bg-[#2A261F]"
                  >
                    {sending ? <IconLoader2 size={16} className="animate-spin" /> : <IconSend size={16} className="mr-1.5" />}
                    Kirim
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-[#6B6358]">
              <IconMessageCircle size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Pilih percakapan di sebelah kiri untuk membalas user.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
