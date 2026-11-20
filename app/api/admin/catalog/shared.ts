import { z } from "zod";
import { NextResponse } from "next/server";
import { AiThemeSchema } from "@/lib/ai-design/schema";
import { normalizeTheme } from "@/lib/ai-design/color";
import { templateRegistry } from "@/components/templates/registry";

export const CatalogInput = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,60}$/, "Slug hanya huruf kecil, angka, dan tanda hubung"),
  name: z.string().min(2).max(80),
  description: z.string().max(400).default(""),
  category: z.string().min(2).max(40),
  tier: z.enum(["Gratis", "Premium"]),
  kind: z.enum(["ENGINE", "CODE"]),
  theme: AiThemeSchema.nullable().optional(),
  componentSlug: z.string().nullable().optional(),
  thumbnail: z.string().url().nullable().optional().or(z.literal("")),
  referenceUrl: z.string().url().nullable().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

/** Turns validated input into Prisma data, enforcing kind-specific rules. */
export function toData(input: z.infer<typeof CatalogInput>) {
  if (input.kind === "ENGINE" && !input.theme) throw new Error("Tema wajib diisi untuk template mesin tema");
  if (input.kind === "CODE" && (!input.componentSlug || !templateRegistry[input.componentSlug])) throw new Error("Komponen template tidak ditemukan");
  return {
    ...input,
    theme: input.kind === "ENGINE" && input.theme ? normalizeTheme(input.theme) : undefined,
    componentSlug: input.kind === "CODE" ? input.componentSlug : null,
    thumbnail: input.thumbnail || null,
    referenceUrl: input.referenceUrl || null,
  };
}

export function errorResponse(error: unknown) {
  if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
    return NextResponse.json({ error: error.message.toUpperCase() }, { status: error.message === "Forbidden" ? 403 : 401 });
  }
  if (error instanceof z.ZodError) return NextResponse.json({ error: "INVALID_INPUT", message: error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
  if (error instanceof Error && error.message.startsWith("Tema") || (error instanceof Error && error.message.startsWith("Komponen"))) {
    return NextResponse.json({ error: "INVALID_INPUT", message: (error as Error).message }, { status: 400 });
  }
  if (typeof error === "object" && error && "code" in error && (error as { code: string }).code === "P2002") {
    return NextResponse.json({ error: "SLUG_TAKEN", message: "Slug sudah dipakai template lain" }, { status: 409 });
  }
  console.error("Catalog admin error:", error);
  return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message: "Terjadi kesalahan" }, { status: 500 });
}
