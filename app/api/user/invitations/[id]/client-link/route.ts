import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// POST /api/user/invitations/[id]/client-link — creates or rotates the client magic edit token
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.invitation.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, clientEditToken: true },
    });
    if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const rotate = body?.rotate === true;
    const token = !rotate && existing.clientEditToken ? existing.clientEditToken : crypto.randomBytes(16).toString("hex");
    const clientName = typeof body?.clientName === "string" ? body.clientName.trim().slice(0, 100) : undefined;
    const clientWhatsapp = typeof body?.clientWhatsapp === "string" ? body.clientWhatsapp.trim().slice(0, 25) : undefined;

    const updated = await prisma.invitation.update({
      where: { id: existing.id },
      data: {
        clientEditToken: token,
        ...(clientName !== undefined ? { clientName: clientName || null } : {}),
        ...(clientWhatsapp !== undefined ? { clientWhatsapp: clientWhatsapp || null } : {}),
      },
      select: { id: true, clientEditToken: true, clientName: true, clientWhatsapp: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return apiErrorResponse(error, "Gagal membuat link isi data klien");
  }
}

// DELETE /api/user/invitations/[id]/client-link — revokes the client magic edit link
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;

    const updated = await prisma.invitation.updateMany({
      where: { id, userId: session.user.id },
      data: { clientEditToken: null },
    });
    if (!updated.count) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, "Gagal menonaktifkan link klien");
  }
}
