import { ensureBucketExists } from "../lib/storage";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  console.log("Checking MinIO connection and bucket...");
  await ensureBucketExists();
  console.log("MinIO setup complete!");
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
