import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

const CreateDefaultMusic = z.object({
  title: z.string().trim().min(1, "Judul lagu wajib diisi").max(120),
  artist: z.string().trim().max(120).optional().default(""),
  type: z.enum(["youtube", "upload"]),
  url: z.string().trim().url("URL musik tidak valid"),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const items = await prisma.defaultMusic.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: error.message.toUpperCase() }, { status: error.message === "Forbidden" ? 403 : 401 });
    }
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const parsed = CreateDefaultMusic.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_INPUT", message: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }
    const item = await prisma.defaultMusic.create({ data: parsed.data });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: error.message.toUpperCase() }, { status: error.message === "Forbidden" ? 403 : 401 });
    }
    console.error("Create default music error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
