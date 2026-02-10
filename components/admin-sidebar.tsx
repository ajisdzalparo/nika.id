"use client";

import * as React from "react";
import { IconDashboard, IconTemplate, IconUser, IconMessage, IconSettings, IconCurrencyDollar } from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";

const data = {
  user: {
    name: "Admin",
    email: "admin@nika.id",
    avatar: "/logo",
  },
  navMain: [
    {
      title: "Dashboard Overview",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Template Forge",
      url: "/admin/templates",
      icon: IconTemplate,
    },
    {
      title: "User Management",
      url: "/admin/users",
      icon: IconUser,
    },
    {
      title: "Moderasi Ucapan",
      url: "/admin/moderasi",
      icon: IconMessage,
    },
    {
      title: "Transaksi",
      url: "/admin/transaksi",
      icon: IconCurrencyDollar,
    },
    {
      title: "Pengaturan Sistem",
      url: "/admin/pengaturan-admin",
      icon: IconSettings,
    },
  ],
};

import { useSession } from "@/lib/auth-client";

// ... (keep imports)

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

  const user = session?.user
    ? {
        name: session.user.name || "Admin",
        email: session.user.email || "",
        avatar: session.user.image || "/logo",
      }
    : data.user;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="data-[slot=sidebar-menu-button]:p-1.5!" tooltip="nika.id Admin">
              <Link href="/admin" className="flex items-center gap-2">
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
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
