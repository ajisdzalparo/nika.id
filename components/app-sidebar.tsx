"use client";

import * as React from "react";
import { IconTemplate, IconDashboard, IconMessage, IconUser, IconTransactionDollar } from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";

const data = {
  user: {
    name: "Nika",
    email: "nika@nika.id",
    avatar: "/logo",
  },
  navMain: [
    {
      title: "Ringkasan",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Kelola Template",
      url: "/template",
      icon: IconTemplate,
    },
    {
      title: "Daftar User",
      url: "/user",
      icon: IconUser,
    },
    {
      title: "Moderasi Ucapan",
      url: "#",
      icon: IconMessage,
    },
    {
      title: "Transaksi",
      url: "#",
      icon: IconTransactionDollar,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="data-[slot=sidebar-menu-button]:p-1.5!" tooltip="nika.id">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex aspect-square size-28 items-center justify-center rounded-lg overflow-hidden">
                  <Image src="/logo-transparan.png" alt="Logo" width={120} height={120} />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  );
}
