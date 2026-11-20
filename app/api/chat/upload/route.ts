import { NextResponse } from "next/server";
import { requireAnyAuth } from "@/lib/auth-helpers";
import { checkChatRateLimit, detectRasterImageMime } from "@/lib/chat-security";
import { uploadFile } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const session = await requireAnyAuth(request);

    if (!checkChatRateLimit(`upload:${session.user.id}`, 15, 60_000)) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Terlalu banyak unggahan dalam waktu singkat. Tunggu sebentar." },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "NO_FILE", message: "Tidak ada file yang dipilih" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "FILE_TOO_LARGE", message: "Ukuran gambar maksimal 5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Strictly verify file magic bytes instead of trusting client MIME headers (prevents SVG/HTML XSS)
    const detectedMime = detectRasterImageMime(buffer);
    if (!detectedMime) {
      return NextResponse.json(
        { error: "INVALID_IMAGE", message: "Format file tidak valid. Hanya JPG, PNG, WebP, atau GIF yang diizinkan." },
        { status: 400 },
      );
    }

    const extMap: Record<typeof detectedMime, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
    };

    const url = await uploadFile(`chat-${Date.now()}.${extMap[detectedMime]}`, buffer, detectedMime);
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    console.error("[CHAT_UPLOAD_ERROR]", error);
    return NextResponse.json({ error: "UPLOAD_FAILED", message: "Gagal mengunggah gambar" }, { status: 500 });
  }
}
