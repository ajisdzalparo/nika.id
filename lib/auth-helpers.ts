import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "@/lib/auth";
import {
  ADMIN_PORTAL_COOKIE,
  USER_PORTAL_COOKIE,
  extractCookieFromHeader,
  replaceSessionCookieHeader,
  verifyPortalPayload,
} from "@/lib/portal-gate";
import { cookies, headers } from "next/headers";

export type PortalKind = "user" | "admin";

function inferPortal(request?: Request): PortalKind {
  if (!request) return "user";
  try {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/users") || pathname.startsWith("/admin")) {
      return "admin";
    }
  } catch {
    // ignore invalid URL
  }
  return "user";
}

export async function getSession(request?: Request, portal?: PortalKind): Promise<Session | null> {
  try {
    const resolvedPortal = portal ?? inferPortal(request);
    const cookieName = resolvedPortal === "admin" ? ADMIN_PORTAL_COOKIE : USER_PORTAL_COOKIE;

    let rawHeaderObj: Record<string, string>;
    let portalToken: string | undefined;

    if (request) {
      rawHeaderObj = Object.fromEntries(request.headers);
      portalToken = extractCookieFromHeader(request.headers.get("cookie"), cookieName);
    } else {
      const [hdrs, store] = await Promise.all([headers(), cookies()]);
      rawHeaderObj = Object.fromEntries(hdrs);
      portalToken = store.get(cookieName)?.value;
    }

    const payload = verifyPortalPayload(portalToken, resolvedPortal);
    if (!payload) return null;

    rawHeaderObj.cookie = replaceSessionCookieHeader(rawHeaderObj.cookie || "", payload.cookieName, payload.cookieValue);

    const session = await auth.api.getSession({
      headers: rawHeaderObj,
    });
    if (!session || session.session.id !== payload.sessionId) return null;

    return session;
  } catch {
    return null;
  }
}

export async function requireAuth(request?: Request) {
  const session = await getSession(request, "user");
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAnyAuth(request?: Request) {
  const session = (await getSession(request, "user")) ?? (await getSession(request, "admin"));
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin(request?: Request) {
  const session = await getSession(request, "admin");
  if (!session) {
    throw new Error("Unauthorized");
  }
  if (session.user.role?.toLowerCase() !== "admin") {
    throw new Error("Forbidden");
  }
  return session;
}

/** Shared HTTP error responder for API routes guarded by requireAuth / requireAdmin / requireAnyAuth. */
export function apiErrorResponse(error: unknown, fallbackMessage = "INTERNAL_SERVER_ERROR") {
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }
  console.error(`[API_ERROR] ${fallbackMessage}:`, error);
  return NextResponse.json({ error: "INTERNAL_SERVER_ERROR", message: fallbackMessage }, { status: 500 });
}
