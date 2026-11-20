import { getSession } from "@/lib/auth-helpers";
import { getTypingState, subscribeAdminInbox, subscribeThread, type ChatRealtimeEvent } from "@/lib/chat-realtime";
import { getOrCreateUserThread } from "@/lib/support-chat";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const portal = searchParams.get("portal") === "admin" ? "admin" : "user";
  const session = await getSession(request, portal);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (portal === "admin" && session.user.role?.toLowerCase() !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  let targetThreadId: string | null = null;
  if (portal === "user") {
    const { thread } = await getOrCreateUserThread(session.user.id);
    targetThreadId = thread.id;
  } else {
    targetThreadId = searchParams.get("threadId");
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (evt: ChatRealtimeEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${evt.type}\ndata: ${JSON.stringify(evt)}\n\n`));
        } catch {
          // stream already closed
        }
      };

      const unsub =
        portal === "admin"
          ? subscribeAdminInbox(send)
          : targetThreadId
            ? subscribeThread(targetThreadId, send)
            : () => {};

      // Send initial typing snapshot so newly opened UI immediately knows live typing state
      if (targetThreadId) {
        send({
          type: "typing",
          threadId: targetThreadId,
          ...getTypingState(targetThreadId),
        });
      }

      const pingTimer = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // ignore
        }
      }, 20_000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(pingTimer);
        unsub();
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      request.signal.addEventListener("abort", cleanup, { once: true });
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
