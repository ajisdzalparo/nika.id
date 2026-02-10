import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    // 1. Verify that the requester is an admin
    await requireAdmin(request);

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "USER_ID_REQUIRED" }, { status: 400 });
    }

    // 2. Use Better Auth admin API to impersonate
    // Note: Better Auth admin plugin must be enabled in lib/auth.ts
    const result = await auth.api.impersonateUser({
      body: {
        userId: userId,
      },
      headers: request.headers,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Impersonation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message }, { status: 500 });
  }
}
