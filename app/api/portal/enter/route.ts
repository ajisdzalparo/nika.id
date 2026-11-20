import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  ADMIN_PORTAL_COOKIE,
  USER_PORTAL_COOKIE,
  buildRedirectUrl,
  extractCookieFromHeader,
  signPortalPayload,
} from "@/lib/portal-gate";

function safeNext(raw: string | null | undefined, fallback: string) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/admin")) {
    return fallback;
  }
  return raw;
}

const COOKIE_OPTS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
};

function readRawBetterAuthCookie(request: Request): { cookieName: string; cookieValue: string } | null {
  const header = request.headers.get("cookie");
  for (const name of ["__Secure-better-auth.session_token", "better-auth.session_token"]) {
    const val = extractCookieFromHeader(header, name);
    if (val) return { cookieName: name, cookieValue: val };
  }
  return null;
}

async function getRawBetterAuthSession(request: Request) {
  return auth.api.getSession({ headers: Object.fromEntries(request.headers) }).catch(() => null);
}

// GET /api/portal/enter?portal=user|admin&next=/dashboard — OAuth callback bridge
export async function GET(request: Request) {
  const url = new URL(request.url);
  const portal = url.searchParams.get("portal") === "admin" ? "admin" : "user";
  const next = safeNext(url.searchParams.get("next"), "/dashboard");

  const [session, rawCookie] = await Promise.all([getRawBetterAuthSession(request), Promise.resolve(readRawBetterAuthCookie(request))]);
  if (!session || !rawCookie) {
    return NextResponse.redirect(buildRedirectUrl(portal === "admin" ? "/admin/login" : "/login", request));
  }

  if (portal === "admin") {
    if (session.user.role?.toLowerCase() !== "admin") {
      const res = NextResponse.redirect(buildRedirectUrl("/admin/login?ditolak=1", request));
      res.cookies.delete(ADMIN_PORTAL_COOKIE);
      return res;
    }
    const res = NextResponse.redirect(buildRedirectUrl("/admin", request));
    res.cookies.set(
      ADMIN_PORTAL_COOKIE,
      signPortalPayload({ portal: "admin", sessionId: session.session.id, ...rawCookie }),
      COOKIE_OPTS,
    );
    return res;
  }

  const res = NextResponse.redirect(buildRedirectUrl(next, request));
  res.cookies.set(
    USER_PORTAL_COOKIE,
    signPortalPayload({ portal: "user", sessionId: session.session.id, ...rawCookie }),
    COOKIE_OPTS,
  );
  return res;
}

// POST /api/portal/enter { portal: "user" | "admin" } — capture session token into portal-specific cookie
export async function POST(request: Request) {
  const [session, rawCookie] = await Promise.all([getRawBetterAuthSession(request), Promise.resolve(readRawBetterAuthCookie(request))]);
  if (!session || !rawCookie) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const portal = body?.portal === "admin" ? "admin" : "user";

  if (portal === "admin") {
    if (session.user.role?.toLowerCase() !== "admin") {
      const res = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      res.cookies.delete(ADMIN_PORTAL_COOKIE);
      return res;
    }
    const res = NextResponse.json({ success: true, portal: "admin" });
    res.cookies.set(
      ADMIN_PORTAL_COOKIE,
      signPortalPayload({ portal: "admin", sessionId: session.session.id, ...rawCookie }),
      COOKIE_OPTS,
    );
    return res;
  }

  const res = NextResponse.json({ success: true, portal: "user" });
  res.cookies.set(
    USER_PORTAL_COOKIE,
    signPortalPayload({ portal: "user", sessionId: session.session.id, ...rawCookie }),
    COOKIE_OPTS,
  );
  return res;
}

// DELETE /api/portal/enter?portal=user|admin — clear only the specified portal's session cookie
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const portal = url.searchParams.get("portal");
  const res = NextResponse.json({ success: true });
  if (portal === "admin") {
    res.cookies.delete(ADMIN_PORTAL_COOKIE);
  } else if (portal === "user") {
    res.cookies.delete(USER_PORTAL_COOKIE);
  } else {
    res.cookies.delete(USER_PORTAL_COOKIE);
    res.cookies.delete(ADMIN_PORTAL_COOKIE);
  }
  return res;
}
