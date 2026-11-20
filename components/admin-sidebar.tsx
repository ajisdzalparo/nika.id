"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconArrowLeft, IconCurrencyDollar, IconHome, IconMessage, IconSettings, IconTemplate, IconUsers, type Icon } from "@tabler/icons-react";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

const groups: { label: string; items: { title: string; url: string; icon: Icon }[] }[] = [
  {
    label: "Ringkasan",
    items: [{ title: "Beranda Admin", url: "/admin", icon: IconHome }],
  },
  {
    label: "Kelola",
    items: [
      { title: "Template", url: "/admin/templates", icon: IconTemplate },
      { title: "Pengguna", url: "/admin/users", icon: IconUsers },
      { title: "Moderasi Ucapan", url: "/admin/moderasi", icon: IconMessage },
      { title: "Transaksi", url: "/admin/transaksi", icon: IconCurrencyDollar },
    ],
  },
  {
    label: "Sistem",
    items: [{ title: "Pengaturan", url: "/admin/pengaturan-admin", icon: IconSettings }],
  },
];

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = {
    name: session?.user?.name || "Admin",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="nika.id admin" className="hover:bg-transparent">
              <Link href="/admin">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1E1B17] font-(family-name:--font-landing-display) text-lg italic text-[#F3EBDD]">n</span>
                <span className="flex items-baseline gap-2">
                  <span className="font-(family-name:--font-landing-display) text-[24px] font-semibold leading-none tracking-tight">
                    nika<span className="text-[#8A6A2F]">.id</span>
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[#8C8272]">Admin</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.18em] text-[#8C8272]">{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = item.url === "/admin" ? pathname === "/admin" : pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild tooltip={item.title} isActive={active} className="h-10 data-[active=true]:bg-[#1E1B17] data-[active=true]:font-normal data-[active=true]:text-[#F7F3EC]">
                        <Link href={item.url}>
                          <item.icon stroke={1.6} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ke dashboard user" className="h-10 text-[#6B6358]">
              <Link href="/dashboard">
                <IconArrowLeft stroke={1.6} />
                <span>Ke dashboard user</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
