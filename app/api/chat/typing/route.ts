import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { setTypingState } from "@/lib/chat-realtime";
import { checkChatRateLimit } from "@/lib/chat-security";
import { getOrCreateUserThread } from "@/lib/support-chat";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const portal = body?.portal === "admin" ? "admin" : "user";
    const session = await getSession(request, portal);

    if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    if (portal === "admin" && session.user.role?.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    if (!checkChatRateLimit(`typing:${portal}:${session.user.id}`, 90, 60_000)) {
      return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    const isTyping = Boolean(body?.isTyping);
    let threadId = typeof body?.threadId === "string" ? body.threadId.trim() : "";

    if (portal === "user") {
      const { thread } = await getOrCreateUserThread(session.user.id);
      threadId = thread.id;
    }

    if (!/^[a-zA-Z0-9_-]{8,64}$/.test(threadId)) {
      return NextResponse.json({ error: "THREAD_REQUIRED" }, { status: 400 });
    }

    setTypingState(threadId, portal === "admin" ? "ADMIN" : "USER", isTyping);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
