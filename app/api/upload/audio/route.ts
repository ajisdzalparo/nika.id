import { NextResponse } from "next/server";
import { apiErrorResponse, requireAnyAuth } from "@/lib/auth-helpers";
import { checkChatRateLimit, detectAudioMime } from "@/lib/chat-security";
import { uploadFile } from "@/lib/storage";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const AUDIO_EXT_MAP = {
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/webm": "webm",
} as const;

export async function POST(request: Request) {
  try {
    const session = await requireAnyAuth(request);

    if (!checkChatRateLimit(`upload:audio:${session.user.id}`, 15, 60_000)) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Terlalu banyak unggahan audio. Tunggu sebentar." },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `Ukuran file (${(file.size / 1024 / 1024).toFixed(2)}MB) melebihi batas 10MB` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Verify container/frame magic bytes and force canonical audio Content-Type
    const detectedMime = detectAudioMime(buffer);
    if (!detectedMime) {
      return NextResponse.json(
        { error: "Tipe file audio tidak valid. Gunakan MP3, WAV, OGG, M4A, atau WebM audio." },
        { status: 400 },
      );
    }

    const url = await uploadFile(`audio-${Date.now()}.${AUDIO_EXT_MAP[detectedMime]}`, buffer, detectedMime);
    return NextResponse.json({ url });
  } catch (error) {
    return apiErrorResponse(error, "Gagal mengunggah audio");
  }
}
