import { NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const slug = formData.get("slug") as string;
    const name = formData.get("name") as string;

    if (!file || !slug || !name) {
      return NextResponse.json({ error: "File, slug, and name are required" }, { status: 400 });
    }

    // 1. Save the file to components/templates
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize slug to be safe for filename
    const safeSlug = slug.replace(/[^a-zA-Z0-9-_]/g, "");
    const filename = `${safeSlug}.tsx`;
    const templatesDir = path.join(process.cwd(), "components", "templates");
    const filePath = path.join(templatesDir, filename);

    await writeFile(filePath, buffer);

    // 2. Update registry.ts
    const registryPath = path.join(templatesDir, "registry.ts");
    let registryContent = await readFile(registryPath, "utf-8");

    // Check if entry already exists to avoid duplication
    if (!registryContent.includes(`"${safeSlug}":`)) {
      // We inject the new entry before the closing brace of the object
      // This is a simple string manipulation - in a real CI this might be AST based
      const newEntry = `  "${safeSlug}": {
    name: "${name}",
    component: lazy(() => import("./${safeSlug}")),
  },`;

      // Find the last closing brace and insert before it
      const lastBraceIndex = registryContent.lastIndexOf("};");
      if (lastBraceIndex !== -1) {
        registryContent = registryContent.substring(0, lastBraceIndex) + newEntry + "\n" + registryContent.substring(lastBraceIndex);

        await writeFile(registryPath, registryContent);
      }
    }

    return NextResponse.json({ success: true, message: "File uploaded and registered" });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
