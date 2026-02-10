"use client";

import * as React from "react";
import { IconDashboard, IconEdit, IconTemplate, IconBook, IconUsers, IconSettings } from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";

const data = {
  user: {
    name: "Budi & Ani",
    email: "budi@email.com",
    avatar: "/logo",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Editor Undangan",
      url: "/editor",
      icon: IconEdit,
    },
    {
      title: "Pilih Template",
      url: "/pilih-template",
      icon: IconTemplate,
    },
    {
      title: "Buku Tamu & RSVP",
      url: "/buku-tamu",
      icon: IconBook,
    },
    {
      title: "Manajemen Tamu",
      url: "/manajemen-tamu",
      icon: IconUsers,
    },
    {
      title: "Pengaturan",
      url: "/pengaturan",
      icon: IconSettings,
    },
  ],
};

import { useSession } from "@/lib/auth-client";

// ... (keep imports)

export function UserSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

  const user = session?.user
    ? {
        name: session.user.name || "User",
        email: session.user.email || "",
        avatar: session.user.image || "/logo",
      }
    : data.user;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="data-[slot=sidebar-menu-button]:p-1.5!" tooltip="nika.id">
              <Link href="/dashboard" className="flex items-center gap-2">
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
