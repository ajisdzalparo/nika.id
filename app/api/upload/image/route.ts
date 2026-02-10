import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Basic validation
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
    const filename = `${timestamp}-${safeFilename}`;

    // Save to public/thumbnails
    const uploadDir = path.join(process.cwd(), "public", "thumbnails");
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    const url = `/thumbnails/${filename}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
