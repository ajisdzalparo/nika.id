"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconCreditCard, IconCrown, IconExternalLink, IconLogout, IconMessageCircleHeart, IconPlus, IconSparkles, IconUserCircle } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/common/notification-bell";
import { usePortalUser } from "@/components/common/portal-user-context";
import { InvitationSwitcher, useActiveInvitationContext } from "@/components/user/active-invitation-context";
import { useSession } from "@/lib/auth-client";

const TITLES: Record<string, string> = {
  "/dashboard": "Beranda",
  "/undangan": "Daftar Undangan",
  "/editor": "Editor Undangan",
  "/desain-ai": "Desain AI",
  "/pilih-template": "Koleksi Template",
  "/manajemen-tamu": "Daftar Tamu",
  "/wa-blast": "WA Blast",
  "/buku-tamu": "RSVP & Ucapan",
  "/check-in": "Check-in Tamu",
  "/pengaturan": "Pengaturan",
  "/upgrade": "Paket",
  "/dompet": "Dompet",
  "/kanvas": "Kanvas Desain",
  "/kanvas/editor": "Kanvas Desain",
  "/mitra": "Mitra / Agency",
  "/masukan": "Masukan",
  "/admin/keuangan": "Keuangan",
  "/admin": "Beranda Admin",
  "/admin/templates": "Template",
  "/admin/users": "Pengguna",
  "/admin/moderasi": "Moderasi Ucapan",
  "/admin/transaksi": "Transaksi",
  "/admin/chat": "Customer Chat",
  "/admin/masukan": "Masukan Pengguna",
  "/admin/promo": "Kode Promo",
  "/admin/cms": "CMS Landing Page",
  "/admin/pengaturan-admin": "Pengaturan",
};

// false during SSR and hydration, true afterwards: keeps session-dependent UI out of the server HTML
// Preselects the feature on /masukan based on where the user opened it from
const FEEDBACK_FEATURE_BY_PATH: [string, string][] = [
  ["/editor", "EDITOR"],
  ["/desain-ai", "DESAIN"],
  ["/kanvas", "DESAIN"],
  ["/pilih-template", "DESAIN"],
  ["/manajemen-tamu", "TAMU"],
  ["/wa-blast", "TAMU"],
  ["/buku-tamu", "RSVP"],
  ["/check-in", "RSVP"],
  ["/upgrade", "PEMBAYARAN"],
  ["/mitra", "MITRA"],
  ["/dompet", "DOMPET"],
];

function feedbackHref(pathname: string) {
  const feature = FEEDBACK_FEATURE_BY_PATH.find(([p]) => pathname === p || pathname.startsWith(`${p}/`))?.[1];
  const params = new URLSearchParams({ dari: pathname });
  if (feature) params.set("fitur", feature);
  return `/masukan?${params.toString()}`;
}

const subscribe = () => () => {};
const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);

interface SiteHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function SiteHeader({ user: userProp }: SiteHeaderProps) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const router = useRouter();
  const { data: session } = useSession();
  const portalUser = usePortalUser();
  const isAdminRoute = pathname.startsWith("/admin");
  const user = userProp ?? portalUser ?? (hydrated && !isAdminRoute ? session?.user : undefined);
  const activeInvCtx = useActiveInvitationContext();
  const slug = activeInvCtx?.active.slug ?? (session?.user as { invitationSlug?: string } | undefined)?.invitationSlug;
  const activeShareReady = activeInvCtx ? activeInvCtx.active.isPublic && activeInvCtx.active.plan !== "FREE" : true;
  const previewHref = slug ? `/${slug}${!activeShareReady ? "?preview=1" : ""}` : null;
  const title = TITLES[pathname] ?? (pathname.startsWith("/admin/templates") ? "Template" : isAdminRoute ? "Admin" : "Beranda");
  const initials = (user?.name || "N").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const logout = async () => {
    await fetch(`/api/portal/enter?portal=${isAdminRoute ? "admin" : "user"}`, { method: "DELETE" }).catch(() => {});
    router.replace(isAdminRoute ? "/admin/login" : "/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 flex h-(--header-height) shrink-0 items-center gap-2 border-b border-[#E9DDC6] bg-[#FCF8F1]/90 backdrop-blur-sm transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-8">
        <SidebarTrigger className="-ml-2 size-10 md:-ml-1 md:size-7" />
        <Separator orientation="vertical" className="mx-2 bg-[#E9DDC6] data-[orientation=vertical]:h-4" />
        <h1 className="min-w-0 truncate whitespace-nowrap text-[15px] font-medium text-[#1F1A14]">{title}</h1>
        {hydrated && !isAdminRoute && (activeInvCtx?.invitations.length ?? 0) > 1 && (
          <div className="ml-2 hidden md:block">
            <InvitationSwitcher compact />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {hydrated && !isAdminRoute && activeInvCtx && activeInvCtx.aiCredits !== null && (
            <Link
              href="/upgrade?pilih=kredit#kredit-ai"
              title="Kredit Desain AI · klik untuk top-up"
              className="flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#E9DDC6] bg-white/70 pl-3 pr-1 text-[13px] text-[#1F1A14] transition hover:border-[#CDBF9F]"
            >
              <IconSparkles size={15} className="text-[#8A6424]" />
              <span className="tabular-nums font-medium">{activeInvCtx.aiCredits}</span>
              <span className="hidden text-[#6B5F50] xl:inline">kredit</span>
              <span className="ml-1 flex h-7 items-center gap-0.5 rounded-full bg-[#F5E8CA] px-2 text-xs font-medium text-[#8A6424]">
                <IconPlus size={12} stroke={2.5} />
                <span className="hidden sm:inline">Top up</span>
              </span>
            </Link>
          )}
          {hydrated && !isAdminRoute && activeInvCtx && activeInvCtx.active.plan !== "EKSKLUSIF" && (
            <Button asChild size="sm" className="uy-sheen hidden h-9 shrink-0 gap-1.5 whitespace-nowrap rounded-full bg-[linear-gradient(120deg,#B8903F_0%,#E6CB86_45%,#C9A24E_70%,#A8823A_100%)] px-3.5 text-[13px] font-semibold text-[#1F1A14] hover:brightness-105 sm:flex">
              <Link href="/upgrade">
                <IconCrown size={15} />
                {activeInvCtx.active.plan === "FREE" ? "Pilih paket" : "Upgrade paket"}
              </Link>
            </Button>
          )}
          {hydrated && previewHref && !isAdminRoute && (
            <Button asChild variant="ghost" size="sm" className="hidden h-9 gap-1.5 rounded-full text-[#6B5F50] hover:bg-[#EEE2C9] hover:text-[#1F1A14] xl:flex">
              <Link href={previewHref} target="_blank">
                {activeShareReady ? "Lihat undangan" : "Pratinjau undangan"} <IconExternalLink size={15} />
              </Link>
            </Button>
          )}
          {hydrated && <NotificationBell portal={isAdminRoute ? "admin" : "user"} />}
          {hydrated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0" aria-label="Menu akun">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.image || undefined} alt={user?.name || "Akun"} />
                    <AvatarFallback className="bg-[#EEE2C9] text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || (isAdminRoute ? "Admin" : "Pengguna")}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href={isAdminRoute ? "/admin/pengaturan-admin" : "/pengaturan"}>
                      <IconUserCircle className="mr-2 size-4" />
                      {isAdminRoute ? "Pengaturan sistem" : "Pengaturan akun"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={isAdminRoute ? "/admin/transaksi" : "/upgrade"}>
                      <IconCreditCard className="mr-2 size-4" />
                      {isAdminRoute ? "Verifikasi transaksi" : "Paket & pembayaran"}
                    </Link>
                  </DropdownMenuItem>
                  {!isAdminRoute && (
                    <DropdownMenuItem asChild>
                      <Link href={feedbackHref(pathname)}>
                        <IconMessageCircleHeart className="mr-2 size-4" />
                        Kirim masukan
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <IconLogout className="mr-2 size-4" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0" aria-label="Menu akun">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-[#EEE2C9] text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
