import { NextResponse } from "next/server";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";
import { getLandingContent, resetLandingContent, saveLandingContent } from "@/lib/landing-content";
import { LandingContentSchema } from "@/lib/landing-content-shared";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const content = await getLandingContent();
    return NextResponse.json({ content });
  } catch (error) {
    return apiErrorResponse(error, "Gagal memuat konten CMS");
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => ({}));

    if (body?.reset === true) {
      const content = await resetLandingContent();
      return NextResponse.json({ content });
    }

    const parsed = LandingContentSchema.safeParse(body?.content);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message || "Format tulisan CMS tidak valid",
        },
        { status: 400 },
      );
    }

    const content = await saveLandingContent(parsed.data);
    return NextResponse.json({ content });
  } catch (error) {
    return apiErrorResponse(error, "Gagal menyimpan konten CMS");
  }
}
