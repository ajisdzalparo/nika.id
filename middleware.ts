import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_PORTAL_COOKIE, USER_PORTAL_COOKIE, buildRedirectUrl } from "@/lib/portal-constants";

const protectedRoutes = ["/dashboard", "/undangan", "/editor", "/pilih-template", "/desain-ai", "/kanvas", "/buku-tamu", "/manajemen-tamu", "/pengaturan", "/upgrade", "/dompet", "/mitra", "/masukan"];
const adminRoutes = ["/admin", "/templates", "/users", "/moderasi", "/transaksi", "/pengaturan-admin"];
const authRoutes = ["/login", "/register"];

function withReferralCookie(res: NextResponse, refCode: string | null) {
  if (refCode) {
    res.cookies.set("uy_ref", refCode, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const rawRef = searchParams.get("ref")?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16) ?? "";
  const refCode = rawRef.length >= 3 ? rawRef : null;

  const hasUserPortal = Boolean(request.cookies.get(USER_PORTAL_COOKIE)?.value);
  const hasAdminPortal = Boolean(request.cookies.get(ADMIN_PORTAL_COOKIE)?.value);

  // Redirect authenticated user-portal users away from /login or /register
  if (authRoutes.some((route) => pathname.startsWith(route)) && hasUserPortal) {
    return withReferralCookie(NextResponse.redirect(buildRedirectUrl("/dashboard", request)), refCode);
  }

  // Protect user routes using independent user portal cookie
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !hasUserPortal) {
    const loginUrl = buildRedirectUrl("/login", request);
    loginUrl.searchParams.set("from", pathname);
    return withReferralCookie(NextResponse.redirect(loginUrl), refCode);
  }

  // Admin area has its own login page and independent admin portal cookie
  if (pathname === "/admin/login") return NextResponse.next();
  if (pathname.startsWith("/admin") && !hasAdminPortal) {
    return NextResponse.redirect(buildRedirectUrl("/admin/login", request));
  }

  // Protect other legacy admin paths
  if (adminRoutes.some((route) => pathname.startsWith(route)) && !hasAdminPortal) {
    return NextResponse.redirect(buildRedirectUrl("/admin/login", request));
  }

  return withReferralCookie(NextResponse.next(), refCode);
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
