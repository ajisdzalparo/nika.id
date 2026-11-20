import { NextResponse } from "next/server";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";
import { emitThreadMessage, emitThreadState, setTypingState } from "@/lib/chat-realtime";
import { checkChatRateLimit, isOwnSafeChatImageUrl, sanitizeChatText } from "@/lib/chat-security";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import {
  addSupportMessage,
  getThreadMessagesForAdmin,
  listAllAdminThreads,
  setSupportThreadMode,
} from "@/lib/support-chat";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("threadId");

    const threads = await listAllAdminThreads();
    const activeThreadId = threadId && threads.some((t) => t.id === threadId) ? threadId : threads[0]?.id ?? null;
    const messages = activeThreadId ? await getThreadMessagesForAdmin(activeThreadId) : [];

    return NextResponse.json({ threads, activeThreadId, messages });
  } catch (error) {
    return apiErrorResponse(error, "Gagal memuat chat");
  }
}

export async function POST(request: Request) {
  try {
    const adminSession = await requireAdmin(request);

    if (!checkChatRateLimit(`chat:admin:${adminSession.user.id}`, 60, 60_000)) {
      return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const threadId = typeof body?.threadId === "string" ? body.threadId : "";
    if (!threadId) return NextResponse.json({ error: "THREAD_REQUIRED" }, { status: 400 });

    const threads = await listAllAdminThreads();
    const target = threads.find((t) => t.id === threadId);
    if (!target) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    if (body?.action === "RELEASE_AI") {
      setTypingState(threadId, "ADMIN", false);
      const sysMsg = await addSupportMessage({
        threadId,
        sender: "SYSTEM",
        content: "Admin telah menyelesaikan sesi — Asisten AI kembali aktif membantu.",
        nextMode: "AI",
        nextStatus: "OPEN",
      });
      emitThreadState(threadId, "AI", "OPEN");
      emitThreadMessage(threadId, sysMsg);
      const [messages, nextThreads] = await Promise.all([getThreadMessagesForAdmin(threadId), listAllAdminThreads()]);
      return NextResponse.json({ messages, threads: nextThreads, mode: "AI", status: "OPEN" });
    }

    if (body?.action === "TAKEOVER") {
      const sysMsg = await addSupportMessage({
        threadId,
        sender: "SYSTEM",
        content: "Admin bergabung ke percakapan.",
        nextMode: "ADMIN",
        nextStatus: "OPEN",
      });
      emitThreadState(threadId, "ADMIN", "OPEN");
      emitThreadMessage(threadId, sysMsg);
      const [messages, nextThreads] = await Promise.all([getThreadMessagesForAdmin(threadId), listAllAdminThreads()]);
      return NextResponse.json({ messages, threads: nextThreads, mode: "ADMIN", status: "OPEN" });
    }

    if (body?.action === "CLOSE_SESSION") {
      setTypingState(threadId, "ADMIN", false);
      const sysMsg = await addSupportMessage({
        threadId,
        sender: "SYSTEM",
        content: "Sesi live chat ditutup oleh admin. Kirim pesan baru kapan saja jika masih butuh bantuan.",
        nextMode: "AI",
        nextStatus: "CLOSED",
      });
      emitThreadState(threadId, "AI", "CLOSED");
      emitThreadMessage(threadId, sysMsg);

      await createNotification({
        audience: "USER",
        userId: target.userId,
        type: "SYSTEM",
        title: "Sesi live chat selesai",
        message: "Admin menutup sesi chat. Terima kasih sudah menghubungi UNDANGIN YUK.",
        href: "/dashboard",
      });

      const [messages, nextThreads] = await Promise.all([getThreadMessagesForAdmin(threadId), listAllAdminThreads()]);
      return NextResponse.json({ messages, threads: nextThreads, mode: "AI", status: "CLOSED" });
    }

    const cleanText = typeof body?.content === "string" ? sanitizeChatText(body.content, 1500) : "";
    const hasAttachment = body?.attachmentUrl !== undefined && body?.attachmentUrl !== null && body?.attachmentUrl !== "";
    if (hasAttachment && !isOwnSafeChatImageUrl(body.attachmentUrl)) {
      return NextResponse.json(
        { error: "INVALID_ATTACHMENT", message: "Lampiran gambar tidak valid." },
        { status: 400 },
      );
    }
    const attachmentUrl = hasAttachment ? (body.attachmentUrl as string) : null;

    if (!cleanText && !attachmentUrl) {
      return NextResponse.json({ error: "EMPTY_MESSAGE" }, { status: 400 });
    }

    const storedContent = attachmentUrl
      ? cleanText
        ? `![Lampiran](${attachmentUrl})\n${cleanText}`
        : `![Lampiran](${attachmentUrl})`
      : cleanText;

    setTypingState(threadId, "ADMIN", false);
    await setSupportThreadMode(threadId, "ADMIN", "OPEN");
    const adminMsg = await addSupportMessage({
      threadId,
      sender: "ADMIN",
      content: storedContent,
      nextMode: "ADMIN",
      nextStatus: "OPEN",
    });

    emitThreadState(threadId, "ADMIN", "OPEN");
    emitThreadMessage(threadId, adminMsg);

    const userRow = await prisma.user.findUnique({ where: { id: target.userId }, select: { id: true } });
    if (userRow) {
      await createNotification({
        audience: "USER",
        userId: userRow.id,
        type: "SYSTEM",
        title: "Balasan baru dari Admin",
        message: attachmentUrl && !cleanText ? "Admin mengirim gambar." : cleanText.slice(0, 140),
        href: "/dashboard",
      });
    }

    const [messages, nextThreads] = await Promise.all([getThreadMessagesForAdmin(threadId), listAllAdminThreads()]);
    return NextResponse.json({ messages, threads: nextThreads, mode: "ADMIN", status: "OPEN" });
  } catch (error) {
    return apiErrorResponse(error, "Gagal memproses chat admin");
  }
}
