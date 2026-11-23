import "dotenv/config";
import { prisma } from "../lib/prisma";
import { upsertAdminAccount } from "../lib/seed-admin";

const [, , emailArg, passwordArg, nameArg] = process.argv;

async function main() {
  const fromCli = Boolean(emailArg || passwordArg);
  const email = emailArg ?? process.env.SEED_ADMIN_EMAIL;
  const password = passwordArg ?? process.env.SEED_ADMIN_PASSWORD;
  const name = nameArg ?? process.env.SEED_ADMIN_NAME;

  if (!email || !password) {
    console.error("Usage: bun run seed:admin <email> <password> [name]");
    console.error("Atau isi SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD di .env lalu jalankan `bun run seed:admin`.");
    process.exit(1);
  }

  const result = await upsertAdminAccount({
    email,
    password,
    name,
    overwritePassword: fromCli,
  });

  console.log(`Admin siap digunakan (${result.status}): ${result.email} (role: ${result.role})`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
