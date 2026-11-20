import { NextResponse } from "next/server";
import { checkChatRateLimit, sanitizeChatText } from "@/lib/chat-security";
import { generateSupportAiReply } from "@/lib/support-chat";

export async function POST(request: Request) {
  try {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkChatRateLimit(`public-chat:${clientIp}`, 20, 60_000)) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Terlalu banyak pertanyaan. Silakan tunggu sebentar." },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawMsg = typeof body?.message === "string" ? body.message : "";
    const message = sanitizeChatText(rawMsg, 800);
    if (!message) {
      return NextResponse.json({ error: "EMPTY_MESSAGE", message: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    const rawHistory = Array.isArray(body?.history) ? body.history : [];
    const safeHistory = rawHistory
      .slice(-8)
      .filter(
        (m: unknown): m is { sender: string; content: string } =>
          Boolean(m) &&
          typeof m === "object" &&
          ((m as { sender?: unknown }).sender === "USER" || (m as { sender?: unknown }).sender === "AI") &&
          typeof (m as { content?: unknown }).content === "string",
      )
      .map((m: { sender: string; content: string }) => ({
        sender: m.sender,
        content: sanitizeChatText(m.content, 800),
      }));

    const { reply } = await generateSupportAiReply({
      userMessage: message,
      history: safeHistory,
      userPlan: "FREE",
      invitationTitle: "Pengunjung Landing Page",
      isPublicVisitor: true,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[PUBLIC_CHAT_POST]", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
