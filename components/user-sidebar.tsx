"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconArrowUpRight, IconBook, IconBrandWhatsapp, IconBrush, IconScan, IconBuildingStore, IconEdit, IconHome, IconListDetails, IconPalette, IconSettings, IconTemplate, IconUsers, type Icon, IconWallet, IconMessageCircleHeart, IconTicket, IconChartBar } from "@tabler/icons-react";

import { NavUser } from "@/components/nav-user";
import { InvitationSwitcher, useActiveInvitationContext } from "@/components/user/active-invitation-context";
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
import { FEATURE_STATUS_BADGE, featureForPath, type FeatureStatusMap } from "@/lib/features";
import { SIDEBAR_NAV_ITEM_CLASS } from "@/components/common/sidebar-styles";

type NavGroup = { label: string; items: { title: string; url: string; icon: Icon }[] };

const groups: NavGroup[] = [
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
      { title: "WA Blast", url: "/wa-blast", icon: IconBrandWhatsapp },
      { title: "RSVP & Ucapan", url: "/buku-tamu", icon: IconBook },
      { title: "Check-in Tamu", url: "/check-in", icon: IconScan },
    ],
  },
];

/** Regular user: account items plus an entry to apply for the Mitra program */
const userGroups: NavGroup[] = [
  ...groups,
  {
    label: "Akun",
    items: [
      { title: "Dompet & Referral", url: "/dompet", icon: IconWallet },
      { title: "Pengaturan", url: "/pengaturan", icon: IconSettings },
      { title: "Kirim Masukan", url: "/masukan", icon: IconMessageCircleHeart },
      { title: "Gabung jadi Mitra", url: "/mitra", icon: IconBuildingStore },
    ],
  },
];

/** Client account made by a mitra: same menu as a regular user, without Mitra-only entries */
const clientGroups: NavGroup[] = [
  ...groups,
  {
    label: "Akun",
    items: [
      { title: "Dompet & Referral", url: "/dompet", icon: IconWallet },
      { title: "Pengaturan", url: "/pengaturan", icon: IconSettings },
      { title: "Kirim Masukan", url: "/masukan", icon: IconMessageCircleHeart },
    ],
  },
];

/**
 * Admin-approved mitra: the business first (clients, quota, sales), then the tools for the ONE client
 * invitation being worked on, labelled with its title so it is clear whose invitation is being edited.
 * "Beranda" and "Daftar Undangan" are the couple's views and are left out; Dashboard Mitra lists the clients.
 */
const mitraGroups = (clientTitle: string): NavGroup[] => [
  {
    label: "Bisnis Mitra",
    items: [
      { title: "Klien & Undangan", url: "/mitra", icon: IconBuildingStore },
      { title: "Laporan Penjualan", url: "/mitra/laporan", icon: IconChartBar },
      { title: "Kuota & Paket", url: "/upgrade?pilih=mitra", icon: IconTicket },
      { title: "Dompet", url: "/dompet", icon: IconWallet },
    ],
  },
  {
    label: `Klien · ${clientTitle}`,
    items: [
      { title: "Editor Undangan", url: "/editor", icon: IconEdit },
      { title: "Desain AI", url: "/desain-ai", icon: IconPalette },
      { title: "Kanvas Desain", url: "/kanvas", icon: IconBrush },
      { title: "Koleksi Template", url: "/pilih-template", icon: IconTemplate },
      { title: "Daftar Tamu", url: "/manajemen-tamu", icon: IconUsers },
      { title: "WA Blast", url: "/wa-blast", icon: IconBrandWhatsapp },
      { title: "RSVP & Ucapan", url: "/buku-tamu", icon: IconBook },
      { title: "Check-in Tamu", url: "/check-in", icon: IconScan },
    ],
  },
  {
    label: "Akun",
    items: [
      { title: "Pengaturan", url: "/pengaturan", icon: IconSettings },
      { title: "Kirim Masukan", url: "/masukan", icon: IconMessageCircleHeart },
    ],
  },
];

export function UserSidebar({
  portalUser,
  activePlan,
  featureStatuses,
  mitra,
  client = false,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  portalUser?: { name: string; email: string; avatar: string };
  activePlan?: PlanType;
  /** From the admin feature settings: drives the Segera / Perbaikan badges */
  featureStatuses?: FeatureStatusMap;
  /** Set only for an admin-approved mitra account */
  mitra?: { quota: number } | null;
  /** Client account created by a mitra */
  client?: boolean;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const plan = activePlan ?? (((session?.user as { plan?: PlanType } | undefined)?.plan ?? "FREE") as PlanType);
  const limits = getPlanLimits(plan);
  const activeTitle = useActiveInvitationContext()?.active.title ?? "Undangan";

  const user = portalUser ?? {
    name: session?.user?.name || "Pengguna",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "",
  };

  const renderedGroups = mitra ? mitraGroups(activeTitle) : client ? clientGroups : userGroups;
  const activeNavPath = React.useMemo(() => {
    const basePaths = renderedGroups.flatMap((g) => g.items.map((i) => i.url.split("?")[0]));
    return (
      basePaths
        .filter((base) => pathname === base || pathname.startsWith(`${base}/`))
        .sort((a, b) => b.length - a.length)[0] ?? null
    );
  }, [renderedGroups, pathname]);

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
        {renderedGroups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.18em] text-[#8E8268]">{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const baseUrl = item.url.split("?")[0];
                  const feature = featureForPath(baseUrl);
                  const badge = feature && featureStatuses ? FEATURE_STATUS_BADGE[featureStatuses[feature]] : null;
                  const isActive = activeNavPath === baseUrl;
                  return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild tooltip={item.title} isActive={isActive} className={SIDEBAR_NAV_ITEM_CLASS}>
                      <Link href={item.url}>
                        <item.icon stroke={1.6} />
                        <span className="truncate">{item.title}</span>
                        {badge && (
                          <span className="ml-auto rounded-full bg-[#F6EEDF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8A6424] group-data-[collapsible=icon]:hidden">
                            {badge}
                          </span>
                        )}
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

      <SidebarFooter className="gap-3">
        {!client && (
        <Link
          href={mitra ? "/upgrade?pilih=mitra" : "/upgrade"}
          className="group relative block overflow-hidden rounded-2xl bg-[#1A1510] p-4 text-[#F6EEDD] transition-transform hover:-translate-y-0.5 group-data-[collapsible=icon]:hidden"
        >
          <span aria-hidden className="uy-lattice-light pointer-events-none absolute inset-0" />
          <p className="relative text-[11px] uppercase tracking-[0.18em] text-[#D9B56A]">{mitra ? "Kuota Mitra" : "Paket"}</p>
          <p className="relative mt-1 font-(family-name:--font-landing-display) text-2xl">{mitra ? `${mitra.quota} undangan` : limits.name}</p>
          <p className="relative mt-2 flex items-center gap-1 text-sm text-[#E6CB86]">
            {mitra ? "Tambah kuota" : plan === "EKSKLUSIF" ? "Lihat detail paket" : plan === "FREE" ? "Aktifkan paket" : "Tingkatkan paket"}{" "}
            <IconArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </p>
        </Link>
        )}
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
