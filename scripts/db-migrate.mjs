// Applies database migrations. Runs before the server starts in production (see Dockerfile)
// and locally via `bun run db:migrate`. Uses only the Prisma CLI (no generated client needed).
//
// Databases created earlier with `prisma db push` have tables but no (or only legacy) migration
// history. For those we sync to the baseline schema once (this fails instead of dropping data),
// record the baseline as applied, then `migrate deploy` applies the newer migrations.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

// Local runs read .env; in the container the variables come from the environment.
try {
  await import("dotenv/config");
} catch {
  /* dotenv not installed (production image) */
}

const require = createRequire(import.meta.url);
const prismaCli = require.resolve("prisma/build/index.js");

const SCHEMA = "prisma/schema.prisma";
const BASELINE_SCHEMA = "prisma/baseline.prisma";
const BASELINE = "20261123000000_baseline";

function prisma(args, { input, allowFail = false, quiet = false } = {}) {
  const res = spawnSync(process.execPath, [prismaCli, ...args], { encoding: "utf8", input, maxBuffer: 64 * 1024 * 1024 });
  const out = `${res.stdout ?? ""}${res.stderr ?? ""}`;
  if (!quiet) process.stdout.write(out);
  if (res.status !== 0 && !allowFail) throw new Error(`prisma ${args.join(" ")} failed`);
  return { ok: res.status === 0, out };
}

// Remove history rows of the archived pre-baseline migrations (prisma/migrations_legacy) and any
// failed baseline attempt (it fails on its first statement, so nothing was applied).
// Safe to run every start: a no-op once clean.
const CLEAN_HISTORY = `DO $$ BEGIN
  IF to_regclass('public."_prisma_migrations"') IS NOT NULL THEN
    DELETE FROM "_prisma_migrations" WHERE migration_name LIKE '20260210%';
    DELETE FROM "_prisma_migrations" WHERE migration_name = '${BASELINE}' AND finished_at IS NULL;
  END IF;
END $$;`;

// Decided in SQL (the CLI cannot return query results): raises NEEDS_BASELINE when the app's
// tables exist but the baseline is not recorded as successfully applied.
const CHECK_BASELINE = `DO $$
DECLARE recorded boolean := false;
BEGIN
  IF to_regclass('public."User"') IS NULL THEN RETURN; END IF;
  IF to_regclass('public."_prisma_migrations"') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL)'
      INTO recorded USING '${BASELINE}';
  END IF;
  IF NOT recorded THEN RAISE EXCEPTION 'NEEDS_BASELINE'; END IF;
END $$;`;

function needsBaseline() {
  const { ok, out } = prisma(["db", "execute", "--stdin", "--schema", SCHEMA], { input: CHECK_BASELINE, allowFail: true, quiet: true });
  if (ok) return false;
  if (out.includes("NEEDS_BASELINE")) return true;
  process.stdout.write(out);
  throw new Error("could not check the migration state");
}

function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  prisma(["db", "execute", "--stdin", "--schema", SCHEMA], { input: CLEAN_HISTORY });

  if (needsBaseline()) {
    console.log("[db-migrate] Existing database without baseline: syncing to the baseline schema (no data loss allowed)...");
    prisma(["db", "push", "--schema", BASELINE_SCHEMA, "--skip-generate"]);
    prisma(["migrate", "resolve", "--applied", BASELINE, "--schema", SCHEMA]);
    console.log("[db-migrate] Baseline recorded.");
  }

  prisma(["migrate", "deploy", "--schema", SCHEMA]);
}

try {
  main();
  console.log("[db-migrate] Database is up to date.");
} catch (error) {
  console.error("[db-migrate] Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
}
