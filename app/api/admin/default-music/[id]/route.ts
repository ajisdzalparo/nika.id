import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

const PatchDefaultMusic = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  artist: z.string().trim().max(120).optional(),
  type: z.enum(["youtube", "upload"]).optional(),
  url: z.string().trim().url().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const parsed = PatchDefaultMusic.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
    const item = await prisma.defaultMusic.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: error.message.toUpperCase() }, { status: error.message === "Forbidden" ? 403 : 401 });
    }
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    await prisma.defaultMusic.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: error.message.toUpperCase() }, { status: error.message === "Forbidden" ? 403 : 401 });
    }
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
