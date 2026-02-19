import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { uploadFile } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate audio file types
    const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File must be an audio file (MP3, WAV, or OGG)" }, { status: 400 });
    }

    // Optional: Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to MinIO
    const url = await uploadFile(file.name, buffer, file.type);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading audio:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
