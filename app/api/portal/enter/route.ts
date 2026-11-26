import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { bindUserReferrerFromCode, REFERRAL_COOKIE } from "@/lib/referral";
import {
  ADMIN_PORTAL_COOKIE,
  USER_PORTAL_COOKIE,
  buildRedirectUrl,
  extractCookieFromHeader,
  signPortalPayload,
  verifyPortalPayload,
} from "@/lib/portal-gate";
import { prisma } from "@/lib/prisma";

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

  const refCookie = extractCookieFromHeader(request.headers.get("cookie"), REFERRAL_COOKIE);
  if (refCookie) {
    await bindUserReferrerFromCode(session.user.id, refCookie).catch(() => {});
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

  const refCookie = extractCookieFromHeader(request.headers.get("cookie"), REFERRAL_COOKIE);
  if (refCookie) {
    await bindUserReferrerFromCode(session.user.id, refCookie).catch(() => {});
  }

  const res = NextResponse.json({ success: true, portal: "user" });
  res.cookies.set(
    USER_PORTAL_COOKIE,
    signPortalPayload({ portal: "user", sessionId: session.session.id, ...rawCookie }),
    COOKIE_OPTS,
  );
  return res;
}

// Logging out must end the session on the server too: deleting only the cookie would leave a copied
// session token usable until it expires.
async function revokePortalSession(request: Request, portal: "user" | "admin") {
  const cookieName = portal === "admin" ? ADMIN_PORTAL_COOKIE : USER_PORTAL_COOKIE;
  const payload = verifyPortalPayload(extractCookieFromHeader(request.headers.get("cookie"), cookieName), portal);
  if (!payload) return;
  await prisma.session.deleteMany({ where: { id: payload.sessionId } }).catch((error) => {
    console.error("[portal] failed to revoke session on logout", error);
  });
}

// DELETE /api/portal/enter?portal=user|admin — log out of that portal: revoke its server session and clear its cookie
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const portal = url.searchParams.get("portal");
  const portals: ("user" | "admin")[] = portal === "admin" ? ["admin"] : portal === "user" ? ["user"] : ["user", "admin"];
  await Promise.all(portals.map((p) => revokePortalSession(request, p)));
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
