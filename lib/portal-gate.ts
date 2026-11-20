import crypto from "crypto";

export const USER_PORTAL_COOKIE = "uy_portal_user";
export const ADMIN_PORTAL_COOKIE = "uy_portal_admin";

export interface PortalPayload {
  portal: "user" | "admin";
  sessionId: string;
  cookieName: string;
  cookieValue: string;
}

function secret() {
  return process.env.BETTER_AUTH_SECRET || "undangin-yuk-portal-gate";
}

function hmac(encoded: string): string {
  return crypto.createHmac("sha256", secret()).update(encoded).digest("hex");
}

export function signPortalPayload(payload: PortalPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${hmac(encoded)}`;
}

export function verifyPortalPayload(token: string | undefined | null, portal: "user" | "admin"): PortalPayload | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = hmac(encoded);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as PortalPayload;
    if (parsed.portal !== portal || !parsed.sessionId || !parsed.cookieName || !parsed.cookieValue) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function extractCookieFromHeader(cookieHeader: string | null | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

export function replaceSessionCookieHeader(cookieHeader: string, cookieName: string, cookieValue: string): string {
  const filtered = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("better-auth.session_token=") && !p.startsWith("__Secure-better-auth.session_token="));
  filtered.push(`${cookieName}=${encodeURIComponent(cookieValue)}`);
  return filtered.join("; ");
}
