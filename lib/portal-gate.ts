import crypto from "crypto";
import { ADMIN_PORTAL_COOKIE, USER_PORTAL_COOKIE, buildRedirectUrl } from "./portal-constants";

export { ADMIN_PORTAL_COOKIE, USER_PORTAL_COOKIE, buildRedirectUrl };

export interface PortalPayload {
  portal: "user" | "admin";
  sessionId: string;
  cookieName: string;
  cookieValue: string;
}

// Portal cookies carry the Better Auth session token, so they are encrypted (AES-256-GCM), not just signed:
// a copied cookie value no longer reveals the token. GCM's auth tag also rejects any tampered cookie.
const TOKEN_PREFIX = "v2";

let cachedKey: Buffer | null = null;
function key(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new Error("BETTER_AUTH_SECRET is required");
    console.warn("[portal-gate] BETTER_AUTH_SECRET is not set; using an insecure development key");
  }
  cachedKey = crypto.createHash("sha256").update(`portal-gate:${secret || "dev-only-portal-gate"}`).digest();
  return cachedKey;
}

export function signPortalPayload(payload: PortalPayload): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [TOKEN_PREFIX, iv.toString("base64url"), data.toString("base64url"), tag.toString("base64url")].join(".");
}

export function verifyPortalPayload(token: string | undefined | null, portal: "user" | "admin"): PortalPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  // Older signed-only cookies are rejected, so those sessions simply log in again once
  if (parts.length !== 4 || parts[0] !== TOKEN_PREFIX) return null;
  try {
    const [, ivRaw, dataRaw, tagRaw] = parts;
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivRaw, "base64url"));
    decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
    const json = Buffer.concat([decipher.update(Buffer.from(dataRaw, "base64url")), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(json) as PortalPayload;
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
