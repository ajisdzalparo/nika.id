export const USER_PORTAL_COOKIE = "uy_portal_user";
export const ADMIN_PORTAL_COOKIE = "uy_portal_admin";

/**
 * Resolves the public origin behind reverse proxies (Caddy/Cloudflare) where
 * Next.js standalone binds to 0.0.0.0:3000 and request.url reports 0.0.0.0:3000.
 */
export function buildRedirectUrl(path: string, request: Request): URL {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const hostHeader = request.headers.get("host")?.split(",")[0]?.trim();
  const rawHost = forwardedHost || (hostHeader && !hostHeader.startsWith("0.0.0.0") ? hostHeader : "");
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (rawHost) {
    const isLocal = rawHost.startsWith("localhost") || rawHost.startsWith("127.0.0.1");
    const proto = forwardedProto || (isLocal ? "http" : "https");
    return new URL(path, `${proto}://${rawHost}`);
  }

  const envOrigin = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envOrigin) {
    return new URL(path, envOrigin);
  }

  return new URL(path, request.url);
}
