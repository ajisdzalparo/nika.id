import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/prisma";

export interface UpsertAdminOptions {
  email: string;
  password: string;
  name?: string;
  /** When false (auto-seed), keep any existing credential password and profile name intact. */
  overwritePassword?: boolean;
}

export type UpsertAdminStatus = "created" | "linked" | "updated" | "unchanged";

export async function upsertAdminAccount({
  email,
  password,
  name,
  overwritePassword = true,
}: UpsertAdminOptions): Promise<{ status: UpsertAdminStatus; email: string; role: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email admin tidak boleh kosong.");
  }
  if (password.length < 8) {
    throw new Error("Password admin minimal 8 karakter.");
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { accounts: true },
  });

  if (!existing) {
    const hashedPassword = await hashPassword(password);
    const created = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || "Super Admin",
        role: "admin",
        emailVerified: true,
      },
    });
    await prisma.account.create({
      data: {
        userId: created.id,
        accountId: created.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });
    return { status: "created", email: created.email, role: created.role };
  }

  let updated = false;
  const trimmedName = name?.trim();
  const shouldUpdateName = overwritePassword && Boolean(trimmedName) && existing.name !== trimmedName;

  if (existing.role.toLowerCase() !== "admin" || !existing.emailVerified || shouldUpdateName) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "admin",
        emailVerified: true,
        ...(shouldUpdateName ? { name: trimmedName } : {}),
      },
    });
    updated = true;
  }

  const credentialAccount = existing.accounts.find((acc) => acc.providerId === "credential");

  if (!credentialAccount) {
    const hashedPassword = await hashPassword(password);
    await prisma.account.create({
      data: {
        userId: existing.id,
        accountId: existing.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });
    return { status: "linked", email: existing.email, role: "admin" };
  }

  if (!credentialAccount.password || overwritePassword) {
    const hashedPassword = await hashPassword(password);
    await prisma.account.update({
      where: { id: credentialAccount.id },
      data: { password: hashedPassword },
    });
    return { status: "updated", email: existing.email, role: "admin" };
  }

  return { status: updated ? "updated" : "unchanged", email: existing.email, role: "admin" };
}

const globalForSeed = globalThis as unknown as {
  adminSeedDone?: boolean;
  adminSeedPromise?: Promise<void> | null;
};

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (error as { code?: unknown }).code === "P2021";
}

/**
 * Idempotent production/dev startup seed driven by SEED_ADMIN_EMAIL & SEED_ADMIN_PASSWORD.
 * Runs once per process; retries on the first auth request if tables weren't pushed yet at boot.
 */
export async function ensureAdminSeeded(): Promise<void> {
  if (globalForSeed.adminSeedDone) return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    globalForSeed.adminSeedDone = true;
    return;
  }

  if (password.length < 8) {
    console.warn("[seed-admin] SEED_ADMIN_PASSWORD minimal 8 karakter; auto-seed dilewati.");
    globalForSeed.adminSeedDone = true;
    return;
  }

  if (!globalForSeed.adminSeedPromise) {
    globalForSeed.adminSeedPromise = (async () => {
      try {
        const result = await upsertAdminAccount({
          email,
          password,
          name: process.env.SEED_ADMIN_NAME,
          overwritePassword: false,
        });
        globalForSeed.adminSeedDone = true;
        if (result.status !== "unchanged") {
          console.log(`[seed-admin] Admin ${result.status}: ${result.email}`);
        }
      } catch (error) {
        if (isMissingTableError(error)) {
          // Allow the first auth request to retry once `prisma db push` finishes on a fresh DB.
          console.warn("[seed-admin] Tabel database belum siap saat boot, akan dicoba lagi saat request auth.");
        } else {
          console.error("[seed-admin] Gagal auto-seed admin:", error);
        }
      } finally {
        globalForSeed.adminSeedPromise = null;
      }
    })();
  }

  await globalForSeed.adminSeedPromise;
}
