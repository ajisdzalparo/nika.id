"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconArrowLeft, IconCurrencyDollar, IconFileText, IconHeadset, IconHome, IconMessage, IconSettings, IconTemplate, IconUsers, type Icon } from "@tabler/icons-react";

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
      { title: "Customer Chat", url: "/admin/chat", icon: IconHeadset },
    ],
  },
  {
    label: "Sistem",
    items: [
      { title: "CMS Landing Page", url: "/admin/cms", icon: IconFileText },
      { title: "Pengaturan", url: "/admin/pengaturan-admin", icon: IconSettings },
    ],
  },
];

export function AdminSidebar({
  adminUser,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  adminUser?: { name: string; email: string; avatar: string };
}) {
  const pathname = usePathname();
  const user = adminUser ?? {
    name: "Admin",
    email: "",
    avatar: "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="UNDANGIN YUK Admin" className="hover:bg-transparent">
              <Link href="/admin" className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-mark.png"
                  alt="UNDANGIN YUK Admin"
                  className="hidden size-7 shrink-0 object-contain group-data-[collapsible=icon]:block"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="UNDANGIN YUK"
                  className="h-7 w-auto object-contain group-data-[collapsible=icon]:hidden"
                />
                <span className="rounded-full border border-[#DFD7C8] bg-[#F7F3EC] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#8A6A2F] group-data-[collapsible=icon]:hidden">
                  Admin
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
