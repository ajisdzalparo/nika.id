import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "../lib/prisma";

const [, , emailArg, passwordArg, nameArg] = process.argv;

async function main() {
  if (!emailArg || !passwordArg) {
    console.error("Usage: bun run scripts/set-admin.ts <email> <password> [name]");
    process.exit(1);
  }
  if (passwordArg.length < 8) {
    console.error("Password minimal 8 karakter.");
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  const hashedPassword = await hashPassword(passwordArg);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "admin", emailVerified: true, ...(nameArg ? { name: nameArg } : {}) },
    create: {
      email,
      name: nameArg || "Super Admin",
      role: "admin",
      emailVerified: true,
    },
  });

  await prisma.account.upsert({
    where: { providerId_accountId: { providerId: "credential", accountId: user.id } },
    update: { password: hashedPassword },
    create: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  console.log(`Admin siap digunakan: ${user.email} (role: ${user.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
