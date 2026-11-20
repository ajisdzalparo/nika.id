"use client";

import { useSyncExternalStore } from "react";
import { IconCreditCard, IconDotsVertical, IconLogout, IconUserCircle } from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

const emptySubscribe = () => () => {};
const useHydrated = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();

  const handleLogout = async () => {
    const isAdmin = pathname.startsWith("/admin");
    await fetch(`/api/portal/enter?portal=${isAdmin ? "admin" : "user"}`, { method: "DELETE" }).catch(() => {});
    router.replace(isAdmin ? "/admin/login" : "/login");
    router.refresh();
  };

  const triggerButton = (
    <SidebarMenuButton size="lg" className="border border-sidebar-border rounded-lg data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="rounded-lg bg-[#E6DECF] text-xs">{user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        <span className="text-muted-foreground truncate text-xs">{user.email}</span>
      </div>
      <IconDotsVertical className="ml-auto size-4" />
    </SidebarMenuButton>
  );

  if (!hydrated) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>{triggerButton}</SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-[#E6DECF] text-xs">{user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={pathname.startsWith("/admin") ? "/admin/pengaturan-admin" : "/pengaturan"}>
                  <IconUserCircle />
                  {pathname.startsWith("/admin") ? "Pengaturan sistem" : "Pengaturan akun"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={pathname.startsWith("/admin") ? "/admin/transaksi" : "/upgrade"}>
                  <IconCreditCard />
                  {pathname.startsWith("/admin") ? "Verifikasi transaksi" : "Paket & pembayaran"}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <IconLogout />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
