/**
 * Tiny in-process TTL cache for expensive reads on public pages (landing counters, testimonials).
 * Same single-instance model as lib/chat-realtime.ts. Concurrent callers share one in-flight promise,
 * and a failed load is not cached.
 */
type Entry = { expires: number; value: Promise<unknown> };

const g = globalThis as unknown as { __uyMemoCache?: Map<string, Entry> };
const store = (g.__uyMemoCache ??= new Map());

export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;
  const value = load();
  store.set(key, { expires: Date.now() + ttlMs, value });
  value.catch(() => store.delete(key));
  return value;
}

/** Drop cached entries whose key starts with `prefix` (e.g. after an admin approves a testimonial). */
export function invalidateCached(prefix: string) {
  for (const key of store.keys()) if (key.startsWith(prefix)) store.delete(key);
}
