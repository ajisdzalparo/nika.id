"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconArrowUpRight, IconBook, IconEdit, IconHome, IconListDetails, IconPalette, IconSettings, IconTemplate, IconUsers, type Icon } from "@tabler/icons-react";

import { NavUser } from "@/components/nav-user";
import { InvitationSwitcher } from "@/components/user/active-invitation-context";
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
      { title: "Daftar Undangan", url: "/undangan", icon: IconListDetails },
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

export function UserSidebar({
  portalUser,
  activePlan,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  portalUser?: { name: string; email: string; avatar: string };
  activePlan?: PlanType;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const plan = activePlan ?? (((session?.user as { plan?: PlanType } | undefined)?.plan ?? "FREE") as PlanType);
  const limits = getPlanLimits(plan);

  const user = portalUser ?? {
    name: session?.user?.name || "Pengguna",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="UNDANGIN YUK" className="hover:bg-transparent">
              <Link href="/dashboard" className="flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-mark.png"
                  alt="UNDANGIN YUK"
                  className="hidden size-7 shrink-0 object-contain group-data-[collapsible=icon]:block"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="UNDANGIN YUK"
                  className="h-8 w-auto object-contain group-data-[collapsible=icon]:hidden"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <InvitationSwitcher />
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
            {plan === "EKSKLUSIF" ? "Lihat detail paket" : plan === "FREE" ? "Aktifkan paket" : "Tingkatkan paket"} <IconArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </p>
        </Link>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
