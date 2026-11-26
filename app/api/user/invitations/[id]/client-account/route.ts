import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { addClientAccount, ClientAccountError } from "@/lib/client-account";
import { prisma } from "@/lib/prisma";

const AddSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email klien tidak valid").max(120),
  name: z.string().trim().min(2, "Nama klien minimal 2 karakter").max(80),
});

/** The invitation must belong to the caller, and the caller must be an approved mitra. */
async function ownedByMitra(invitationId: string, userId: string) {
  const [owner, inv] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { accountType: true } }),
    prisma.invitation.findFirst({ where: { id: invitationId, userId }, select: { id: true, title: true } }),
  ]);
  if (owner?.accountType !== "AGENCY") return { error: NextResponse.json({ error: "NOT_MITRA", message: "Hanya akun Mitra yang bisa membuat akun klien." }, { status: 403 }) };
  if (!inv) return { error: NextResponse.json({ error: "NOT_FOUND", message: "Undangan tidak ditemukan." }, { status: 404 }) };
  return { inv };
}

// GET — client accounts that can open this invitation
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const check = await ownedByMitra(id, session.user.id);
    if (check.error) return check.error;
    const members = await prisma.invitationMember.findMany({
      where: { invitationId: id },
      orderBy: { createdAt: "asc" },
      select: { userId: true, createdAt: true, user: { select: { name: true, email: true } } },
    });
    return NextResponse.json({
      members: members.map((m) => ({ userId: m.userId, name: m.user.name, email: m.user.email, createdAt: m.createdAt.toISOString() })),
    });
  } catch (error) {
    return apiErrorResponse(error, "Gagal memuat akun klien");
  }
}

// POST — create (or link) the client's own login for this invitation
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const check = await ownedByMitra(id, session.user.id);
    if (check.error) return check.error;
    const parsed = AddSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }
    const result = await addClientAccount({ invitationId: id, ownerId: session.user.id, ...parsed.data });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ClientAccountError) return NextResponse.json({ error: "INVALID", message: error.message }, { status: 400 });
    return apiErrorResponse(error, "Gagal membuat akun klien");
  }
}

// DELETE ?userId= — remove a client's access (their account stays)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(request);
    const { id } = await params;
    const check = await ownedByMitra(id, session.user.id);
    if (check.error) return check.error;
    const userId = new URL(request.url).searchParams.get("userId") ?? "";
    await prisma.invitationMember.deleteMany({ where: { invitationId: id, userId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, "Gagal mencabut akses klien");
  }
}
