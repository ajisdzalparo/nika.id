import { redirect } from "next/navigation";
import { IconTools } from "@tabler/icons-react";
import { UserSidebar } from "@/components/user-sidebar";
import { PortalUserProvider } from "@/components/common/portal-user-context";
import { ActiveInvitationProvider, type SwitchableInvitation } from "@/components/user/active-invitation-context";
import { CustomerChatWidget } from "@/components/user/customer-chat-widget";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation, listUserInvitations } from "@/lib/active-invitation";
import type { PlanType } from "@/lib/limits";
import { shellTokens, studioClass } from "@/lib/studio";
import { isAiDesignEnabled, isMaintenanceMode } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/api/portal/exit?portal=user");

  const [active, allInvitations, maintenance, aiDesignEnabled] = await Promise.all([
    getActiveInvitation(session.user.id),
    listUserInvitations(session.user.id),
    isMaintenanceMode(),
    isAiDesignEnabled(),
  ]);

  if (maintenance) {
    return (
      <div className={`${studioClass} flex min-h-screen items-center justify-center bg-[#FAF8F4] px-4`}>
        <div className="max-w-md space-y-4 rounded-2xl border border-[#E6DFD3] bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4EAD6] text-[#8A6A2F]">
            <IconTools size={22} />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A6A2F]">Pemeliharaan Sistem</p>
          <h1 className="font-serif text-3xl font-medium text-[#15130F]">Sedang dalam pembaruan</h1>
          <p className="text-sm leading-relaxed text-[#5E574D]">
            Kami sedang melakukan pemeliharaan sistem sementara agar layanan UNDANGIN YUK semakin optimal. Silakan coba muat ulang beberapa saat lagi.
          </p>
        </div>
      </div>
    );
  }

  const switchableList: SwitchableInvitation[] = allInvitations.map((inv) => ({
    id: inv.id,
    title: inv.title,
    slug: inv.slug,
    plan: (inv.plan ?? "FREE") as PlanType,
    isPublic: inv.isPublic,
  }));

  const activeItem: SwitchableInvitation = {
    id: active.id,
    title: active.title,
    slug: active.slug,
    plan: (active.plan ?? "FREE") as PlanType,
    isPublic: active.isPublic,
  };

  return (
    <PortalUserProvider
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    >
      <ActiveInvitationProvider active={activeItem} invitations={switchableList}>
        <SidebarProvider style={shellTokens} className={`${studioClass} bg-[#F1ECE3]`}>
          <UserSidebar
            variant="inset"
            portalUser={{
              name: session.user.name || "Pengguna",
              email: session.user.email || "",
              avatar: session.user.image || "",
            }}
            activePlan={activeItem.plan}
            aiDesignEnabled={aiDesignEnabled}
          />
          <SidebarInset className="bg-[#F7F3EC]">
            {children}
            <CustomerChatWidget />
          </SidebarInset>
        </SidebarProvider>
      </ActiveInvitationProvider>
    </PortalUserProvider>
  );
}
