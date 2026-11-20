import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_PORTAL_COOKIE, USER_PORTAL_COOKIE, buildRedirectUrl } from "@/lib/portal-constants";

const protectedRoutes = ["/dashboard", "/undangan", "/editor", "/pilih-template", "/desain-ai", "/buku-tamu", "/manajemen-tamu", "/pengaturan", "/upgrade"];
const adminRoutes = ["/admin", "/templates", "/users", "/moderasi", "/transaksi", "/pengaturan-admin"];
const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasUserPortal = Boolean(request.cookies.get(USER_PORTAL_COOKIE)?.value);
  const hasAdminPortal = Boolean(request.cookies.get(ADMIN_PORTAL_COOKIE)?.value);

  // Redirect authenticated user-portal users away from /login or /register
  if (authRoutes.some((route) => pathname.startsWith(route)) && hasUserPortal) {
    return NextResponse.redirect(buildRedirectUrl("/dashboard", request));
  }

  // Protect user routes using independent user portal cookie
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !hasUserPortal) {
    const loginUrl = buildRedirectUrl("/login", request);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
