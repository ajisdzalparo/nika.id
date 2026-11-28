import { getSession } from "@/lib/auth-helpers";
import { subscribeNotifications } from "@/lib/notification-realtime";

export const dynamic = "force-dynamic";

// GET /api/notifications/stream?portal=admin|user — SSE: sends `changed` whenever a notification for this viewer is created
export async function GET(request: Request) {
  const portal = new URL(request.url).searchParams.get("portal") === "admin" ? "admin" : "user";
  const session = await getSession(request, portal);
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (portal === "admin" && session.user.role?.toLowerCase() !== "admin") return new Response("Forbidden", { status: 403 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let unsub: () => void = () => {};
      const timers: { ping?: ReturnType<typeof setInterval> } = {};

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(timers.ping);
        unsub();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // The client is gone but no abort arrived: release the listener and timer instead of leaking them
          cleanup();
        }
      };

      unsub = subscribeNotifications(portal, session.user.id, () => write("event: changed\ndata: {}\n\n"));
      // Keeps proxies from closing an idle connection, and detects dead connections
      timers.ping = setInterval(() => write(": ping\n\n"), 25_000);
      request.signal.addEventListener("abort", cleanup, { once: true });
    },
    cancel() {
      // Reader cancelled (tab closed): the abort listener above usually runs too; cleanup is idempotent
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
