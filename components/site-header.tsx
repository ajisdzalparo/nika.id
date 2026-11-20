"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconCreditCard, IconExternalLink, IconLogout, IconUserCircle } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/common/notification-bell";
import { InvitationSwitcher, useActiveInvitationContext } from "@/components/user/active-invitation-context";
import { useSession } from "@/lib/auth-client";

const TITLES: Record<string, string> = {
  "/dashboard": "Beranda",
  "/undangan": "Daftar Undangan",
  "/editor": "Editor Undangan",
  "/desain-ai": "Desain AI",
  "/pilih-template": "Koleksi Template",
  "/manajemen-tamu": "Daftar Tamu",
  "/buku-tamu": "RSVP & Ucapan",
  "/pengaturan": "Pengaturan",
  "/upgrade": "Paket",
  "/admin": "Beranda Admin",
  "/admin/templates": "Template",
  "/admin/users": "Pengguna",
  "/admin/moderasi": "Moderasi Ucapan",
  "/admin/transaksi": "Transaksi",
  "/admin/chat": "Customer Chat",
  "/admin/pengaturan-admin": "Pengaturan",
};

// false during SSR and hydration, true afterwards: keeps session-dependent UI out of the server HTML
const subscribe = () => () => {};
const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);

interface SiteHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function SiteHeader({ user: userProp }: SiteHeaderProps) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const router = useRouter();
  const { data: session } = useSession();
  const user = userProp ?? (hydrated ? session?.user : undefined);
  const activeInvCtx = useActiveInvitationContext();
  const isAdminRoute = pathname.startsWith("/admin");
  const slug = activeInvCtx?.active.slug ?? (session?.user as { invitationSlug?: string } | undefined)?.invitationSlug;
  const activeShareReady = activeInvCtx ? activeInvCtx.active.isPublic && activeInvCtx.active.plan !== "FREE" : true;
  const previewHref = slug ? `/${slug}${!activeShareReady ? "?preview=1" : ""}` : null;
  const title = TITLES[pathname] ?? (pathname.startsWith("/admin/templates") ? "Template" : isAdminRoute ? "Admin" : "Dashboard");
  const initials = (user?.name || "N").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const logout = async () => {
    await fetch(`/api/portal/enter?portal=${isAdminRoute ? "admin" : "user"}`, { method: "DELETE" }).catch(() => {});
    router.replace(isAdminRoute ? "/admin/login" : "/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-[#E1D8C9] bg-[#F7F3EC]/90 backdrop-blur-sm transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-8">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 bg-[#E1D8C9] data-[orientation=vertical]:h-4" />
        <h1 className="text-[15px] font-medium text-[#1E1B17]">{title}</h1>
        {hydrated && !isAdminRoute && (activeInvCtx?.invitations.length ?? 0) > 1 && (
          <div className="ml-2 hidden md:block">
            <InvitationSwitcher compact />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {hydrated && previewHref && !isAdminRoute && (
            <Button asChild variant="ghost" size="sm" className="hidden h-9 gap-1.5 rounded-full text-[#6B6358] hover:bg-[#E6DECF] hover:text-[#1E1B17] sm:flex">
              <Link href={previewHref} target="_blank">
                {activeShareReady ? "Lihat undangan" : "Pratinjau undangan"} <IconExternalLink size={15} />
              </Link>
            </Button>
          )}
          {hydrated && <NotificationBell portal={isAdminRoute ? "admin" : "user"} />}
          {hydrated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0" aria-label="Menu akun">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.image || undefined} alt={user?.name || "Akun"} />
                    <AvatarFallback className="bg-[#E6DECF] text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || (isAdminRoute ? "Admin" : "Pengguna")}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href={isAdminRoute ? "/admin/pengaturan-admin" : "/pengaturan"}>
                      <IconUserCircle className="mr-2 size-4" />
                      {isAdminRoute ? "Pengaturan sistem" : "Pengaturan akun"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={isAdminRoute ? "/admin/transaksi" : "/upgrade"}>
                      <IconCreditCard className="mr-2 size-4" />
                      {isAdminRoute ? "Verifikasi transaksi" : "Paket & pembayaran"}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <IconLogout className="mr-2 size-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0" aria-label="Menu akun">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-[#E6DECF] text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
