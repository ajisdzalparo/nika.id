import { NextResponse } from "next/server";
import { ADMIN_PORTAL_COOKIE, USER_PORTAL_COOKIE, buildRedirectUrl } from "@/lib/portal-constants";

// GET /api/portal/exit?portal=user|admin — clears stale/invalid portal cookie and sends to that portal's login
export async function GET(request: Request) {
  const url = new URL(request.url);
  const portal = url.searchParams.get("portal") === "admin" ? "admin" : "user";
  const target = portal === "admin" ? "/admin/login" : "/login";

  const res = NextResponse.redirect(buildRedirectUrl(target, request));
  res.cookies.delete(portal === "admin" ? ADMIN_PORTAL_COOKIE : USER_PORTAL_COOKIE);
  return res;
}
