"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconCheck, IconChevronDown, IconLoader2, IconMailHeart, IconPlus, IconSelector } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { PLAN_LIMITS, type PlanType } from "@/lib/limits";

export interface SwitchableInvitation {
  id: string;
  title: string;
  slug: string | null;
  plan: PlanType;
  isPublic: boolean;
}

interface ActiveInvitationContextValue {
  active: SwitchableInvitation;
  invitations: SwitchableInvitation[];
  switchingId: string | null;
  switchInvitation: (id: string) => Promise<void>;
  /** Remaining AI credits (plan + top-up); null when AI design is disabled. */
  aiCredits: number | null;
}

const ActiveInvitationContext = createContext<ActiveInvitationContextValue | null>(null);

const subscribe = () => () => {};
const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);

export function ActiveInvitationProvider({
  active,
  invitations,
  aiCredits = null,
  children,
}: {
  active: SwitchableInvitation;
  invitations: SwitchableInvitation[];
  aiCredits?: number | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const switchInvitation = async (id: string) => {
    if (id === active.id || switchingId) return;
    setSwitchingId(id);
    try {
      const res = await fetch("/api/user/invitations/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: id }),
      });
      if (!res.ok) {
        toast.error("Gagal mengganti undangan aktif");
        return;
      }
      const next = invitations.find((x) => x.id === id);
      toast.success(`Beralih ke "${next?.title ?? "Undangan"}"`);
      router.refresh();
    } catch {
      toast.error("Gagal mengganti undangan aktif");
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <ActiveInvitationContext.Provider value={{ active, invitations, switchingId, switchInvitation, aiCredits }}>
      {children}
    </ActiveInvitationContext.Provider>
  );
}

export function useActiveInvitationContext() {
  return useContext(ActiveInvitationContext);
}

function SwitcherMenuContent({ align = "start" }: { align?: "start" | "end" }) {
  const ctx = useActiveInvitationContext();
  if (!ctx) return null;
  const { active, invitations, switchInvitation } = ctx;

  return (
    <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-xl" align={align} sideOffset={4}>
      <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Pilih Undangan ({invitations.length})
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {invitations.map((inv) => {
        const isCurrent = inv.id === active.id;
        return (
          <DropdownMenuItem
            key={inv.id}
            onClick={() => switchInvitation(inv.id)}
            className="flex items-center justify-between gap-2 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#1A1510]">{inv.title}</p>
              <p className="truncate text-[11px] text-[#6B5F50]">
                /{inv.slug || "draft"} · {inv.plan === "FREE" ? "Pratinjau" : PLAN_LIMITS[inv.plan]?.name}
              </p>
            </div>
            {isCurrent && <IconCheck size={15} className="shrink-0 text-[#8A6424]" />}
          </DropdownMenuItem>
        );
      })}
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/undangan" className="flex items-center gap-2 text-xs font-medium text-[#8A6424]">
          <IconPlus size={14} /> Kelola / Buat Undangan Baru
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export function InvitationSwitcher({ compact = false }: { compact?: boolean }) {
  const hydrated = useHydrated();
  const ctx = useActiveInvitationContext();
  const { isMobile } = useSidebar();
  if (!ctx) return null;

  const { active, switchingId } = ctx;

  if (compact) {
    const compactBtn = (
      <button
        type="button"
        className="inline-flex h-9 max-w-48 items-center gap-1.5 rounded-full border border-[#E9DDC6] bg-white px-3.5 text-xs font-medium text-[#1F1A14] transition hover:border-[#8A6424]"
      >
        <span className="truncate">{active.title}</span>
        {switchingId ? (
          <IconLoader2 size={13} className="shrink-0 animate-spin text-[#8A6424]" />
        ) : (
          <IconChevronDown size={13} className="shrink-0 text-[#6B5F50]" />
        )}
      </button>
    );

    if (!hydrated) return compactBtn;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{compactBtn}</DropdownMenuTrigger>
        <SwitcherMenuContent align="start" />
      </DropdownMenu>
    );
  }

  const sidebarTrigger = (
    <SidebarMenuButton
      size="lg"
      tooltip={active.title}
      className="rounded-lg border border-[#E9DDC6] bg-[#FFFDF9] hover:bg-[#FCF8F1] data-[state=open]:bg-[#FCF8F1]"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#F5EDDD] text-[#8A6424]">
        <IconMailHeart size={17} stroke={1.7} />
      </span>
      <div className="grid flex-1 text-left leading-tight">
        <span className="truncate text-[13px] font-medium text-[#1F1A14]">{active.title}</span>
        <span className="truncate text-[11px] text-[#6B5F50]">/{active.slug || "draft"}</span>
      </div>
      {switchingId ? (
        <IconLoader2 className="ml-auto size-4 shrink-0 animate-spin text-[#8A6424]" />
      ) : (
        <IconSelector className="ml-auto size-4 shrink-0 text-[#8C8272]" />
      )}
    </SidebarMenuButton>
  );

  if (!hydrated) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>{sidebarTrigger}</SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{sidebarTrigger}</DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-xl"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={6}
          >
            <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Pilih Undangan ({ctx.invitations.length})
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ctx.invitations.map((inv) => {
              const isCurrent = inv.id === active.id;
              return (
                <DropdownMenuItem
                  key={inv.id}
                  onClick={() => ctx.switchInvitation(inv.id)}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#1A1510]">{inv.title}</p>
                    <p className="truncate text-[11px] text-[#6B5F50]">
                      /{inv.slug || "draft"} · {inv.plan === "FREE" ? "Pratinjau" : PLAN_LIMITS[inv.plan]?.name}
                    </p>
                  </div>
                  {isCurrent && <IconCheck size={15} className="shrink-0 text-[#8A6424]" />}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/undangan" className="flex items-center gap-2 text-xs font-medium text-[#8A6424]">
                <IconPlus size={14} /> Kelola / Buat Undangan Baru
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
