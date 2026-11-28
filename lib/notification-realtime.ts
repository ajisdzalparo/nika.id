import { EventEmitter } from "node:events";

/**
 * In-process signal bus for notifications (same single-instance model as lib/chat-realtime.ts).
 * Carries only "something changed for this audience"; clients refetch the list, so nothing private rides the event.
 */
const g = globalThis as unknown as { __uyNotificationBus?: EventEmitter };
if (!g.__uyNotificationBus) {
  g.__uyNotificationBus = new EventEmitter();
  g.__uyNotificationBus.setMaxListeners(1000);
}
const bus = g.__uyNotificationBus;

type Audience = "USER" | "ADMIN" | "ALL_USERS";

export function emitNotificationChanged(audience: Audience, userId?: string | null) {
  if (audience === "ADMIN") bus.emit("admin");
  else if (audience === "ALL_USERS") bus.emit("all-users");
  else if (userId) bus.emit(`user:${userId}`);
}

/** Subscribe to changes visible to this viewer; returns the unsubscribe function. */
export function subscribeNotifications(portal: "admin" | "user", userId: string, handler: () => void): () => void {
  const channels = portal === "admin" ? ["admin"] : [`user:${userId}`, "all-users"];
  for (const c of channels) bus.on(c, handler);
  return () => {
    for (const c of channels) bus.off(c, handler);
  };
}
