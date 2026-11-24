"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconArrowUpRight, IconBook, IconBrandWhatsapp, IconBrush, IconScan, IconBuildingStore, IconEdit, IconHome, IconListDetails, IconPalette, IconSettings, IconTemplate, IconUsers, type Icon, IconWallet, IconMessageCircleHeart } from "@tabler/icons-react";

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
import { BrandLogo } from "@/components/common/brand-logo";

const groups: { label: string; items: { title: string; url: string; icon: Icon; badge?: string }[] }[] = [
  {
    label: "Undangan",
    items: [
      { title: "Beranda", url: "/dashboard", icon: IconHome },
      { title: "Daftar Undangan", url: "/undangan", icon: IconListDetails },
      { title: "Editor Undangan", url: "/editor", icon: IconEdit },
      { title: "Desain AI", url: "/desain-ai", icon: IconPalette },
      { title: "Kanvas Desain", url: "/kanvas", icon: IconBrush },
      { title: "Koleksi Template", url: "/pilih-template", icon: IconTemplate },
    ],
  },
  {
    label: "Tamu",
    items: [
      { title: "Daftar Tamu", url: "/manajemen-tamu", icon: IconUsers },
      { title: "WA Blast", url: "/wa-blast", icon: IconBrandWhatsapp, badge: "Segera" },
      { title: "RSVP & Ucapan", url: "/buku-tamu", icon: IconBook },
      { title: "Check-in Tamu", url: "/check-in", icon: IconScan },
    ],
  },
  {
    label: "Akun & Bisnis",
    items: [
      { title: "Mitra / Agency", url: "/mitra", icon: IconBuildingStore },
      { title: "Dompet & Referral", url: "/dompet", icon: IconWallet },
      { title: "Pengaturan", url: "/pengaturan", icon: IconSettings },
      { title: "Kirim Masukan", url: "/masukan", icon: IconMessageCircleHeart },
    ],
  },
];

export function UserSidebar({
  portalUser,
  activePlan,
  aiDesignEnabled = true,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  portalUser?: { name: string; email: string; avatar: string };
  activePlan?: PlanType;
  aiDesignEnabled?: boolean;
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
            <SidebarMenuButton asChild size="lg" tooltip="SatuMoment" className="hover:bg-transparent">
              <Link href="/dashboard" className="flex items-center">
                <BrandLogo variant="symbol" className="hidden size-7 shrink-0 group-data-[collapsible=icon]:block" />
                <BrandLogo className="h-8 group-data-[collapsible=icon]:hidden" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <InvitationSwitcher />
      </SidebarHeader>

      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.18em] text-[#8E8268]">{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items
                  .filter((item) => aiDesignEnabled || item.url !== "/desain-ai")
                  .map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}className="relative h-10 rounded-xl transition-colors hover:bg-[#EEE2C9]/70 data-[active=true]:bg-[#1F1A14] data-[active=true]:font-medium data-[active=true]:text-[#F6EEDD] data-[active=true]:shadow-[0_8px_18px_-12px_rgba(26,21,16,.7)] data-[active=true]:before:absolute data-[active=true]:before:inset-y-2.5 data-[active=true]:before:left-0 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-[linear-gradient(180deg,#E6CB86,#B8903F)] [&[data-active=true]>svg]:text-[#D9B56A]">
                      <Link href={item.url}>
                        <item.icon stroke={1.6} />
                        <span className="truncate">{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto rounded-full bg-[#F6EEDF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8A6424] group-data-[collapsible=icon]:hidden">
                            {item.badge}
                          </span>
                        )}
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
        <Link href="/upgrade" className="group relative block overflow-hidden rounded-2xl bg-[#1A1510] p-4 text-[#F6EEDD] transition-transform hover:-translate-y-0.5 group-data-[collapsible=icon]:hidden">
          <span aria-hidden className="uy-lattice-light pointer-events-none absolute inset-0" />
          <p className="relative text-[11px] uppercase tracking-[0.18em] text-[#D9B56A]">Paket</p>
          <p className="relative mt-1 font-(family-name:--font-landing-display) text-2xl">{limits.name}</p>
          <p className="relative mt-2 flex items-center gap-1 text-sm text-[#E6CB86]">
            {plan === "EKSKLUSIF" ? "Lihat detail paket" : plan === "FREE" ? "Aktifkan paket" : "Tingkatkan paket"} <IconArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </p>
        </Link>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
