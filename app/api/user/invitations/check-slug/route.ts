import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { isSlugTaken, RESERVED_SLUGS, sanitizeSlug } from "@/lib/active-invitation";

export async function GET(request: Request) {
  try {
    await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const rawSlug = searchParams.get("slug") ?? "";
    const excludeId = searchParams.get("excludeId") || undefined;

    const slug = sanitizeSlug(rawSlug);
    if (slug.length < 2) {
      return NextResponse.json({ slug, available: false, reason: "TOO_SHORT" });
    }
    if (RESERVED_SLUGS.has(slug)) {
      return NextResponse.json({ slug, available: false, reason: "RESERVED" });
    }
    const taken = await isSlugTaken(slug, excludeId);
    return NextResponse.json({
      slug,
      available: !taken,
      ...(taken ? { reason: "TAKEN" } : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
