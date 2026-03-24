import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { uploadFile } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export async function POST(request: Request) {
  try {
    const session = await requireAuth(request).catch((err) => {
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

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `File type ${file.type} not allowed. Must be JPEG, PNG, WebP, GIF, or SVG` }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 5MB limit` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const url = await uploadFile(file.name, buffer, file.type);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading image:", error);

    // Check for specific storage errors if possible
    const errorMessage = error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 500;

    return NextResponse.json({ error: errorMessage }, { status });
  }
}
