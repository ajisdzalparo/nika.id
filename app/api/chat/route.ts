import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { emitThreadMessage, emitThreadState, setTypingState } from "@/lib/chat-realtime";
import { checkChatRateLimit, isOwnSafeChatImageUrl, sanitizeChatText } from "@/lib/chat-security";
import { createNotification } from "@/lib/notifications";
import {
  addSupportMessage,
  generateSupportAiReply,
  getOrCreateUserThread,
  getUserQueueInfo,
  setSupportThreadMode,
} from "@/lib/support-chat";
import type { PlanType } from "@/lib/limits";

export async function GET(request: Request) {
  try {
    const session = await getSession(request, "user");
    if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const { thread, messages } = await getOrCreateUserThread(session.user.id);
    const queue = await getUserQueueInfo(thread.id);
    return NextResponse.json({
      thread: {
        id: thread.id,
        mode: thread.mode,
        status: thread.status,
        lastMessageAt: thread.lastMessageAt,
        ...queue,
      },
      messages,
    });
  } catch (error) {
    console.error("[USER_CHAT_GET]", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request, "user");
    if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    if (!checkChatRateLimit(`chat:user:${session.user.id}`, 30, 60_000)) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Terlalu banyak pesan dalam waktu singkat. Coba sebentar lagi." },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : undefined;
    const { thread, messages } = await getOrCreateUserThread(session.user.id);
    const userName = session.user.name || session.user.email || "User";

    if (action === "CONNECT_ADMIN") {
      if (thread.mode !== "ADMIN" || thread.status !== "OPEN") {
        const sysMsg = await addSupportMessage({
          threadId: thread.id,
          sender: "SYSTEM",
          content: "Terhubung ke Admin Live Support. Pesan berikutnya langsung diteruskan ke admin.",
          nextMode: "ADMIN",
          nextStatus: "OPEN",
        });
        emitThreadState(thread.id, "ADMIN", "OPEN");
        emitThreadMessage(thread.id, sysMsg);
        await createNotification({
          audience: "ADMIN",
          type: "SYSTEM",
          title: "Antrean Live Chat Baru",
          message: `${userName} meminta terhubung langsung dengan admin.`,
          href: `/admin/chat?thread=${thread.id}`,
        });
      }
      const refreshed = await getOrCreateUserThread(session.user.id);
      const queue = await getUserQueueInfo(refreshed.thread.id);
      return NextResponse.json({ thread: { ...refreshed.thread, ...queue }, messages: refreshed.messages });
    }

    if (action === "SWITCH_AI") {
      if (thread.mode !== "AI" || thread.status !== "OPEN") {
        const sysMsg = await addSupportMessage({
          threadId: thread.id,
          sender: "SYSTEM",
          content: "Beralih kembali ke Asisten AI UNDANGIN YUK.",
          nextMode: "AI",
          nextStatus: "OPEN",
        });
        emitThreadState(thread.id, "AI", "OPEN");
        emitThreadMessage(thread.id, sysMsg);
      }
      const refreshed = await getOrCreateUserThread(session.user.id);
      const queue = await getUserQueueInfo(refreshed.thread.id);
      return NextResponse.json({ thread: { ...refreshed.thread, ...queue }, messages: refreshed.messages });
    }

    if (action === "REOPEN") {
      if (thread.status !== "OPEN") {
        const sysMsg = await addSupportMessage({
          threadId: thread.id,
          sender: "SYSTEM",
          content: "Sesi chat baru dimulai. Asisten AI siap membantu kembali.",
          nextMode: "AI",
          nextStatus: "OPEN",
        });
        emitThreadState(thread.id, "AI", "OPEN");
        emitThreadMessage(thread.id, sysMsg);
      }
      const refreshed = await getOrCreateUserThread(session.user.id);
      const queue = await getUserQueueInfo(refreshed.thread.id);
      return NextResponse.json({ thread: { ...refreshed.thread, ...queue }, messages: refreshed.messages });
    }

    const cleanText = typeof body?.content === "string" ? sanitizeChatText(body.content, 1500) : "";
    const hasAttachment = body?.attachmentUrl !== undefined && body?.attachmentUrl !== null && body?.attachmentUrl !== "";
    if (hasAttachment && !isOwnSafeChatImageUrl(body.attachmentUrl)) {
      return NextResponse.json(
        { error: "INVALID_ATTACHMENT", message: "Lampiran gambar tidak valid atau harus diunggah lewat aplikasi." },
        { status: 400 },
      );
    }
    const attachmentUrl = hasAttachment ? (body.attachmentUrl as string) : null;

    if (!cleanText && !attachmentUrl) {
      return NextResponse.json({ error: "EMPTY_MESSAGE", message: "Pesan atau gambar tidak boleh kosong" }, { status: 400 });
    }

    const storedContent = attachmentUrl
      ? cleanText
        ? `![Lampiran](${attachmentUrl})\n${cleanText}`
        : `![Lampiran](${attachmentUrl})`
      : cleanText;

    setTypingState(thread.id, "USER", false);

    // If user sends a message after session was closed, re-open cleanly in AI mode
    const effectiveMode = thread.status === "CLOSED" ? "AI" : thread.mode;
    if (thread.status === "CLOSED") {
      await setSupportThreadMode(thread.id, "AI", "OPEN");
      emitThreadState(thread.id, "AI", "OPEN");
    }

    const userMsg = await addSupportMessage({
      threadId: thread.id,
      sender: "USER",
      content: storedContent,
    });
    emitThreadMessage(thread.id, userMsg);

    if (effectiveMode === "ADMIN") {
      await createNotification({
        audience: "ADMIN",
        type: "SYSTEM",
        title: `Pesan chat baru · ${userName}`,
        message: attachmentUrl && !cleanText ? "Mengirim lampiran gambar." : cleanText.slice(0, 140),
        href: `/admin/chat?thread=${thread.id}`,
      });
    } else {
      const active = await getActiveInvitation(session.user.id);
      const { reply, suggestAdmin } = await generateSupportAiReply({
        userMessage: cleanText || "[lampiran gambar]",
        history: messages,
        userPlan: (active.plan ?? "FREE") as PlanType,
        invitationTitle: active.title,
      });

      const aiMsg = await addSupportMessage({
        threadId: thread.id,
        sender: "AI",
        content: reply,
      });
      emitThreadMessage(thread.id, aiMsg);

      if (suggestAdmin && body?.autoHandoff === true) {
        await setSupportThreadMode(thread.id, "ADMIN", "OPEN");
        emitThreadState(thread.id, "ADMIN", "OPEN");
        await createNotification({
          audience: "ADMIN",
          type: "SYSTEM",
          title: "Antrean Live Chat Baru",
          message: `${userName}: ${cleanText.slice(0, 120)}`,
          href: `/admin/chat?thread=${thread.id}`,
        });
      }
    }

    const refreshed = await getOrCreateUserThread(session.user.id);
    const queue = await getUserQueueInfo(refreshed.thread.id);
    return NextResponse.json({ thread: { ...refreshed.thread, ...queue }, messages: refreshed.messages });
  } catch (error) {
    console.error("[USER_CHAT_POST]", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
