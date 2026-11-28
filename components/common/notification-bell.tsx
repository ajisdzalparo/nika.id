"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { playNotificationSound } from "@/lib/sound";
import {
  IconBell,
  IconCheck,
  IconMessageCircle,
  IconPalette,
  IconReceipt,
  IconUsers,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotificationItem } from "@/lib/notifications";

function timeAgo(iso: string) {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return "Baru saja";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case "TEMPLATE":
      return <IconPalette size={15} className="text-[#8A6424]" />;
    case "TRANSACTION":
      return <IconReceipt size={15} className="text-emerald-700" />;
    case "RSVP":
      return <IconUsers size={15} className="text-sky-700" />;
    default:
      return <IconMessageCircle size={15} className="text-amber-700" />;
  }
}

export function NotificationBell({ portal }: { portal: "admin" | "user" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevTopIdRef = useRef<string | null>(null);
  const prevUnreadRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?portal=${portal}`, { cache: "no-store" });
      if (!res.ok) return;
      const d = await res.json();
      if (Array.isArray(d.items)) {
        setItems(d.items);
        if (d.items[0]?.id) prevTopIdRef.current = d.items[0].id;
      }
      if (typeof d.unreadCount === "number") {
        setUnreadCount(d.unreadCount);
        prevUnreadRef.current = d.unreadCount;
      }
    } catch {
      // silent background refresh
    }
  }, [portal]);

  useEffect(() => {
    let active = true;
    const sync = () => {
      fetch(`/api/notifications?portal=${portal}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!active || !d) return;
          const nextItems = Array.isArray(d.items) ? (d.items as NotificationItem[]) : null;
          const nextUnread = typeof d.unreadCount === "number" ? d.unreadCount : null;
          const nextTopId = nextItems?.[0]?.id ?? null;

          if (
            prevUnreadRef.current !== null &&
            nextUnread !== null &&
            (nextUnread > prevUnreadRef.current || (nextTopId && nextTopId !== prevTopIdRef.current && nextUnread > 0))
          ) {
            playNotificationSound();
          }

          if (nextItems) {
            setItems(nextItems);
            prevTopIdRef.current = nextTopId;
          }
          if (nextUnread !== null) {
            setUnreadCount(nextUnread);
            prevUnreadRef.current = nextUnread;
          }
        })
        .catch(() => {});
    };

    // Push, no polling: the server sends `changed` over SSE when a notification for this viewer is created.
    // `open` also fires after an automatic reconnect, so anything sent while disconnected is fetched then.
    // The first load doesn't wait for the stream: if SSE is blocked or refused, the bell still shows its list.
    sync();
    const es = new EventSource(`/api/notifications/stream?portal=${portal}`);
    let opened = false;
    // The first `open` follows the load above; only a later one (a reconnect) needs to catch up
    es.addEventListener("open", () => {
      if (opened) sync();
      opened = true;
    });
    es.addEventListener("changed", sync);
    return () => {
      active = false;
      es.close();
    };
  }, [portal]);

  const markRead = async (id?: string) => {
    try {
      const res = await fetch(`/api/notifications?portal=${portal}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { all: true }),
      });
      if (!res.ok) return;
      const d = await res.json();
      if (Array.isArray(d.items)) setItems(d.items);
      if (typeof d.unreadCount === "number") setUnreadCount(d.unreadCount);
    } catch {
      // ignore
    }
  };

  const handleOpenItem = async (item: NotificationItem) => {
    if (!item.read) {
      await markRead(item.id);
    }
    setOpen(false);
    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) load();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifikasi"
          className="relative h-9 w-9 rounded-full text-[#4E473E] hover:bg-[#EEE2C9] hover:text-[#1A1510]"
        >
          <IconBell size={19} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#B45309] px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-[#FCF8F1]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <DropdownMenuLabel className="flex items-center gap-1.5 p-0 text-sm font-semibold">
            Notifikasi
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#F5E8CA] px-2 py-0.5 text-[10px] font-semibold text-[#6E4F1C]">
                {unreadCount} baru
              </span>
            )}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markRead()}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#8A6424] hover:underline"
            >
              <IconCheck size={13} /> Tandai dibaca
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />
        <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <IconBell size={22} className="mx-auto text-zinc-300" />
              <p className="mt-2 text-xs text-zinc-500">Belum ada notifikasi saat ini.</p>
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleOpenItem(item)}
                className={`flex w-full items-start gap-3 px-3.5 py-3 text-left transition hover:bg-[#FCF8F1] ${
                  !item.read ? "bg-[#FBF7EE]" : "bg-white"
                }`}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3EDE2]">
                  <TypeIcon type={item.type} />
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-[#1A1510]">{item.title}</p>
                    <span className="shrink-0 text-[10px] text-zinc-400">{timeAgo(item.createdAt)}</span>
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-zinc-600">{item.message}</p>
                </div>
                {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#8A6424]" />}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
