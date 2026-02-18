import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "USER_ID_REQUIRED" }, { status: 400 });
    }

    const result = await auth.api.impersonateUser({
      body: { userId },
      headers: request.headers,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Impersonation error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
