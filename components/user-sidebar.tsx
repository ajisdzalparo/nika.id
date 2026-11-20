"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconArrowUpRight, IconBook, IconEdit, IconHome, IconPalette, IconSettings, IconTemplate, IconUsers, type Icon } from "@tabler/icons-react";

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
import { getPlanLimits, type PlanType } from "@/lib/limits";

const groups: { label: string; items: { title: string; url: string; icon: Icon }[] }[] = [
  {
    label: "Undangan",
    items: [
      { title: "Beranda", url: "/dashboard", icon: IconHome },
      { title: "Editor Undangan", url: "/editor", icon: IconEdit },
      { title: "Desain AI", url: "/desain-ai", icon: IconPalette },
      { title: "Koleksi Template", url: "/pilih-template", icon: IconTemplate },
    ],
  },
  {
    label: "Tamu",
    items: [
      { title: "Daftar Tamu", url: "/manajemen-tamu", icon: IconUsers },
      { title: "RSVP & Ucapan", url: "/buku-tamu", icon: IconBook },
    ],
  },
  {
    label: "Akun",
    items: [{ title: "Pengaturan", url: "/pengaturan", icon: IconSettings }],
  },
];

export function UserSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const plan = ((session?.user as { plan?: PlanType } | undefined)?.plan ?? "FREE") as PlanType;
  const limits = getPlanLimits(plan);

  const user = {
    name: session?.user?.name || "Pengguna",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="nika.id" className="hover:bg-transparent">
              <Link href="/dashboard">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1E1B17] font-(family-name:--font-landing-display) text-lg italic text-[#F3EBDD]">n</span>
                <span className="font-(family-name:--font-landing-display) text-[24px] font-semibold leading-none tracking-tight">
                  nika<span className="text-[#8A6A2F]">.id</span>
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
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url} className="h-10 data-[active=true]:bg-[#1E1B17] data-[active=true]:text-[#F7F3EC] data-[active=true]:font-normal">
                      <Link href={item.url}>
                        <item.icon stroke={1.6} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-3">
        <Link href="/upgrade" className="group block rounded-xl border border-[#E1D8C9] bg-[#F7F3EC] p-4 transition-colors hover:border-[#C9A45C] group-data-[collapsible=icon]:hidden">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8C8272]">Paket</p>
          <p className="mt-1 font-(family-name:--font-landing-display) text-xl">{limits.name}</p>
          <p className="mt-2 flex items-center gap-1 text-sm text-[#8A6A2F]">
            {plan === "GOLD" ? "Lihat detail paket" : "Tingkatkan paket"} <IconArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </p>
        </Link>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
