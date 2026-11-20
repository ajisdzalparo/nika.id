import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth-helpers";
import { USER_PORTAL_COOKIE, signPortalPayload } from "@/lib/portal-gate";

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

    const res = NextResponse.json({ success: true, result });
    const sessionObj = (result as { session?: { id?: string; token?: string } } | null)?.session;
    if (sessionObj?.id && sessionObj?.token) {
      const cookieName = process.env.NODE_ENV === "production" ? "__Secure-better-auth.session_token" : "better-auth.session_token";
      res.cookies.set(
        USER_PORTAL_COOKIE,
        signPortalPayload({ portal: "user", sessionId: sessionObj.id, cookieName, cookieValue: sessionObj.token }),
        {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7,
        },
      );
    }
    return res;
  } catch (error) {
    console.error("Impersonation error:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
