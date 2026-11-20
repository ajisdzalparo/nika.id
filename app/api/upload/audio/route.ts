import { NextResponse } from "next/server";
import { requireAnyAuth } from "@/lib/auth-helpers";
import { uploadFile } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const session = await requireAnyAuth(request).catch((err) => {
      if (err.message === "Unauthorized") return "UNAUTHORIZED";
      if (err.message === "Forbidden") return "FORBIDDEN";
      throw err;
    });

    if (session === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    if (session === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate audio file types (MIME + extension fallback for browsers sending generic octet-stream)
    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/wave",
      "audio/x-wav",
      "audio/ogg",
      "audio/x-m4a",
      "audio/m4a",
      "audio/mp4",
      "audio/aac",
      "audio/webm",
    ];
    const allowedExt = /\.(mp3|wav|ogg|m4a|aac|webm)$/i;
    const contentType = file.type || "audio/mpeg";
    if (!allowedTypes.includes(file.type) && !allowedExt.test(file.name)) {
      return NextResponse.json({ error: `Tipe file ${file.type || "tidak dikenal"} tidak didukung. Gunakan MP3, WAV, OGG, M4A, atau AAC.` }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: `Ukuran file (${(file.size / 1024 / 1024).toFixed(2)}MB) melebihi batas 10MB` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to MinIO / S3
    const url = await uploadFile(file.name, buffer, contentType);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading audio:", error);
    
    // Check for specific storage errors if possible
    const errorMessage = error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";
    const status = (error instanceof Error && error.message === "Unauthorized") ? 401 : 500;
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status }
    );
  }
}

