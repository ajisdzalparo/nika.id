import { NextResponse } from "next/server";
import { apiErrorResponse, requireAnyAuth } from "@/lib/auth-helpers";
import { checkChatRateLimit, detectRasterImageMime } from "@/lib/chat-security";
import { uploadFile } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const IMAGE_EXT_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
} as const;

export async function POST(request: Request) {
  try {
    const session = await requireAnyAuth(request);

    if (!checkChatRateLimit(`upload:image:${session.user.id}`, 30, 60_000)) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Terlalu banyak unggahan gambar. Tunggu sebentar." },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 5MB limit` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Inspect magic bytes rather than trusting client MIME / filename (blocks SVG/HTML XSS)
    const detectedMime = detectRasterImageMime(buffer);
    if (!detectedMime) {
      return NextResponse.json(
        { error: "Format gambar tidak valid. Hanya JPEG, PNG, WebP, dan GIF yang diizinkan." },
        { status: 400 },
      );
    }

    const url = await uploadFile(`img-${Date.now()}.${IMAGE_EXT_MAP[detectedMime]}`, buffer, detectedMime);
    return NextResponse.json({ url });
  } catch (error) {
    return apiErrorResponse(error, "Gagal mengunggah gambar");
  }
}
