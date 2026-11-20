import { EventEmitter } from "node:events";

export type ChatRealtimeEvent =
  | {
      type: "message";
      threadId: string;
      message: {
        id: string;
        threadId: string;
        sender: string;
        content: string;
        createdAt: string;
      };
    }
  | {
      type: "thread";
      threadId: string;
      mode: string;
      status: string;
    }
  | {
      type: "typing";
      threadId: string;
      userTyping: boolean;
      adminTyping: boolean;
    };

interface ChatGlobalStore {
  bus: EventEmitter;
  typing: Map<string, { userUntil: number; adminUntil: number }>;
}

const g = globalThis as unknown as { __uyChatRealtime?: ChatGlobalStore };

if (!g.__uyChatRealtime) {
  const bus = new EventEmitter();
  bus.setMaxListeners(300);
  g.__uyChatRealtime = {
    bus,
    typing: new Map(),
  };
}

const store = g.__uyChatRealtime;

export function getTypingState(threadId: string): { userTyping: boolean; adminTyping: boolean } {
  const rec = store.typing.get(threadId);
  if (!rec) return { userTyping: false, adminTyping: false };
  const now = Date.now();
  return {
    userTyping: rec.userUntil > now,
    adminTyping: rec.adminUntil > now,
  };
}

export function setTypingState(threadId: string, who: "USER" | "ADMIN", isTyping: boolean) {
  const prev = store.typing.get(threadId) ?? { userUntil: 0, adminUntil: 0 };
  const next = { ...prev };
  const until = isTyping ? Date.now() + 3500 : 0;
  if (who === "USER") next.userUntil = until;
  else next.adminUntil = until;
  store.typing.set(threadId, next);

  const event: ChatRealtimeEvent = {
    type: "typing",
    threadId,
    ...getTypingState(threadId),
  };
  store.bus.emit(`thread:${threadId}`, event);
  store.bus.emit("admin:all", event);
}

export function emitThreadMessage(
  threadId: string,
  message: { id: string; threadId: string; sender: string; content: string; createdAt: Date | string },
) {
  const payload: ChatRealtimeEvent = {
    type: "message",
    threadId,
    message: {
      id: message.id,
      threadId: message.threadId,
      sender: message.sender,
      content: message.content,
      createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt,
    },
  };
  store.bus.emit(`thread:${threadId}`, payload);
  store.bus.emit("admin:all", payload);
}

export function emitThreadState(threadId: string, mode: string, status: string) {
  const payload: ChatRealtimeEvent = {
    type: "thread",
    threadId,
    mode,
    status,
  };
  store.bus.emit(`thread:${threadId}`, payload);
  store.bus.emit("admin:all", payload);
}

export function subscribeThread(threadId: string, handler: (evt: ChatRealtimeEvent) => void): () => void {
  const channel = `thread:${threadId}`;
  store.bus.on(channel, handler);
  return () => {
    store.bus.off(channel, handler);
  };
}

export function subscribeAdminInbox(handler: (evt: ChatRealtimeEvent) => void): () => void {
  store.bus.on("admin:all", handler);
  return () => {
    store.bus.off("admin:all", handler);
  };
}
