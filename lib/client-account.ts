import crypto from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Readable temporary password (no look-alike characters) the mitra passes to the client. */
function temporaryPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(10);
  let out = "";
  for (const b of bytes) out += chars[b % chars.length];
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}

/**
 * Gives a mitra's client their own login for one invitation. An existing account with that email is
 * linked as-is; otherwise a verified account is created with a temporary password (shown once to the mitra).
 */
export async function addClientAccount(input: { invitationId: string; ownerId: string; email: string; name: string }) {
  const email = input.email.trim().toLowerCase();
  let user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true, email: true } });
  if (user?.id === input.ownerId) throw new ClientAccountError("Email ini milik akun Mitra Anda sendiri.");

  let tempPassword: string | null = null;
  if (!user) {
    const ctx = await auth.$context;
    tempPassword = temporaryPassword();
    const created = await ctx.internalAdapter.createUser({ email, name: input.name, emailVerified: true }, { method: "admin" });
    await ctx.internalAdapter.linkAccount({
      userId: created.id,
      providerId: "credential",
      accountId: created.id,
      password: await ctx.password.hash(tempPassword),
    });
    await prisma.user.update({ where: { id: created.id }, data: { accountType: "CLIENT" } });
    user = { id: created.id, email };
  }

  await prisma.invitationMember.upsert({
    where: { invitationId_userId: { invitationId: input.invitationId, userId: user.id } },
    create: { invitationId: input.invitationId, userId: user.id, role: "CLIENT" },
    update: {},
  });
  return { userId: user.id, email: user.email, tempPassword };
}

export class ClientAccountError extends Error {}
