import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/music/defaults — public/user endpoint returning active default music tracks
export async function GET() {
  try {
    const items = await prisma.defaultMusic.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { id: true, title: true, artist: true, type: true, url: true },
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch default music:", error);
    return NextResponse.json({ items: [] });
  }
}
