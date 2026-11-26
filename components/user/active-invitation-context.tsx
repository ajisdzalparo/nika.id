"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconCheck, IconChevronDown, IconLoader2, IconMailHeart, IconPlus, IconSearch, IconSelector } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  clientName?: string | null;
  weddingDate?: string | null;
}

interface ActiveInvitationContextValue {
  active: SwitchableInvitation;
  invitations: SwitchableInvitation[];
  switchingId: string | null;
  switchInvitation: (id: string) => Promise<void>;
  /** Remaining AI credits (plan + top-up); null when AI design is disabled. */
  aiCredits: number | null;
  isMitra: boolean;
}

const ActiveInvitationContext = createContext<ActiveInvitationContextValue | null>(null);

const subscribe = () => () => {};
const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);

const shortDateFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function ActiveInvitationProvider({
  active,
  invitations,
  aiCredits = null,
  isMitra = false,
  children,
}: {
  active: SwitchableInvitation;
  invitations: SwitchableInvitation[];
  aiCredits?: number | null;
  /** Mitra manage client invitations from /mitra, not the couple's /undangan list */
  isMitra?: boolean;
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
    <ActiveInvitationContext.Provider value={{ active, invitations, switchingId, switchInvitation, aiCredits, isMitra }}>
      {children}
    </ActiveInvitationContext.Provider>
  );
}

export function useActiveInvitationContext() {
  return useContext(ActiveInvitationContext);
}

/** Searchable picker dialog used for Mitra accounts or anyone managing > 5 invitations. */
function SearchableInvitationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const ctx = useActiveInvitationContext();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "FREE">("ALL");

  const invitations = useMemo(() => ctx?.invitations ?? [], [ctx?.invitations]);
  const paidCount = useMemo(() => invitations.filter((i) => i.plan !== "FREE").length, [invitations]);
  const freeCount = invitations.length - paidCount;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invitations.filter((inv) => {
      if (statusFilter === "PAID" && inv.plan === "FREE") return false;
      if (statusFilter === "FREE" && inv.plan !== "FREE") return false;
      if (!q) return true;
      return (
        inv.title.toLowerCase().includes(q) ||
        (inv.clientName ?? "").toLowerCase().includes(q) ||
        (inv.slug ?? "").toLowerCase().includes(q)
      );
    });
  }, [invitations, query, statusFilter]);

  if (!ctx) return null;
  const { active, switchingId, switchInvitation, isMitra } = ctx;

  const handleSelect = async (id: string) => {
    if (id === active.id) {
      onOpenChange(false);
      return;
    }
    await switchInvitation(id);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setQuery("");
          setStatusFilter("ALL");
        }
      }}
    >
      <DialogContent className="gap-0 overflow-hidden border-[#EDE3CF] bg-[#FFFDF9] p-0 sm:max-w-lg sm:rounded-2xl">
        <DialogHeader className="border-b border-[#F3EBDB] px-5 pb-4 pt-5">
          <DialogTitle className="font-(family-name:--font-landing-display) text-2xl font-normal text-[#1F1A14]">
            {isMitra ? "Pilih Undangan Klien" : "Pilih Undangan"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#6B5F50]">
            {isMitra
              ? "Cari berdasarkan nama klien, judul acara, atau slug untuk langsung bekerja di undangan tersebut."
              : "Pilih undangan yang ingin dikelola sekarang."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 border-b border-[#F3EBDB] bg-[#FCF8F1]/70 px-5 py-3.5">
          <label className="flex h-10 items-center gap-2 rounded-full border border-[#E6D5B2] bg-white px-3.5 focus-within:border-[#8A6424]">
            <IconSearch size={15} className="shrink-0 text-[#8E8268]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isMitra ? "Cari nama klien, judul, atau slug…" : "Cari judul atau slug…"}
              aria-label="Cari undangan"
              autoFocus
              className="w-full min-w-0 bg-transparent text-sm text-[#1F1A14] outline-none placeholder:text-[#8E8268]"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["ALL", `Semua (${invitations.length})`],
                ["PAID", `Aktif (${paidCount})`],
                ["FREE", `Pratinjau (${freeCount})`],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setStatusFilter(k)}
                className={`h-8 rounded-full px-3 text-xs font-medium transition ${
                  statusFilter === k
                    ? "bg-[#1F1A14] text-[#F6EEDD]"
                    : "border border-[#E9DDC6] bg-white text-[#5E5446] hover:border-[#8A6424] hover:text-[#1F1A14]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <ul className="max-h-[340px] divide-y divide-[#F3EBDB] overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-[#6B5F50]">
              Tidak ada undangan yang cocok dengan pencarian &ldquo;{query}&rdquo;.
            </li>
          ) : (
            filtered.map((inv) => {
              const isCurrent = inv.id === active.id;
              const isPaid = inv.plan !== "FREE";
              const isLoading = switchingId === inv.id;
              return (
                <li key={inv.id}>
                  <button
                    type="button"
                    disabled={Boolean(switchingId)}
                    onClick={() => void handleSelect(inv.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left transition ${
                      isCurrent ? "bg-[#F7F0E1]" : "hover:bg-[#FCF8F1]"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium text-[#1F1A14]">{inv.title}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isPaid
                              ? "border border-[#E6D5B2] bg-white text-[#5C431A]"
                              : "bg-[#F6EEDF] text-[#8A6424]"
                          }`}
                        >
                          {isPaid ? PLAN_LIMITS[inv.plan]?.name : "Pratinjau"}
                        </span>
                      </div>
                      <p className="truncate text-xs text-[#6B5F50]">
                        {inv.clientName ? `${inv.clientName} · ` : ""}/{inv.slug || "draft"}
                        {inv.weddingDate ? ` · ${shortDateFmt.format(new Date(inv.weddingDate))}` : ""}
                      </p>
                    </div>
                    {isLoading ? (
                      <IconLoader2 size={16} className="shrink-0 animate-spin text-[#8A6424]" />
                    ) : isCurrent ? (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1F1A14] text-[#F6EEDD]">
                        <IconCheck size={13} stroke={2.5} />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="border-t border-[#F3EBDB] bg-[#FCF8F1] px-5 py-3">
          <Link
            href={isMitra ? "/mitra" : "/undangan"}
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-[#E6D5B2] bg-white px-4 text-xs font-medium text-[#8A6424] transition hover:border-[#8A6424] hover:text-[#1F1A14]"
          >
            <IconPlus size={14} /> {isMitra ? "Kelola semua klien / buat undangan klien baru" : "Kelola / buat undangan baru"}
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SwitcherMenuContent({
  align = "start",
  side,
  sideOffset = 4,
}: {
  align?: "start" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}) {
  const ctx = useActiveInvitationContext();
  if (!ctx) return null;
  const { active, invitations, switchInvitation } = ctx;

  return (
    <DropdownMenuContent
      className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-xl"
      side={side}
      align={align}
      sideOffset={sideOffset}
    >
      <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Pilih Undangan ({invitations.length})
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <div className="max-h-72 overflow-y-auto">
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
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href={ctx.isMitra ? "/mitra" : "/undangan"} className="flex items-center gap-2 text-xs font-medium text-[#8A6424]">
          <IconPlus size={14} /> {ctx.isMitra ? "Kelola klien / undangan klien baru" : "Kelola / Buat Undangan Baru"}
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export function InvitationSwitcher({ compact = false }: { compact?: boolean }) {
  const hydrated = useHydrated();
  const ctx = useActiveInvitationContext();
  const { isMobile } = useSidebar();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!ctx) return null;

  const { active, switchingId, isMitra, invitations } = ctx;
  // Mitra accounts (and any account with >5 invitations) get a searchable dialog picker instead of an unbounded dropdown
  const useSearchablePicker = isMitra || invitations.length > 5;

  if (compact) {
    const compactBtn = (
      <button
        type="button"
        onClick={useSearchablePicker ? () => setPickerOpen(true) : undefined}
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
    if (useSearchablePicker) {
      return (
        <>
          {compactBtn}
          <SearchableInvitationDialog open={pickerOpen} onOpenChange={setPickerOpen} />
        </>
      );
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{compactBtn}</DropdownMenuTrigger>
        <SwitcherMenuContent align="start" />
      </DropdownMenu>
    );
  }

  const sidebarSubtitle = isMitra && active.clientName ? active.clientName : `/${active.slug || "draft"}`;

  const sidebarTrigger = (
    <SidebarMenuButton
      size="lg"
      tooltip={active.title}
      onClick={useSearchablePicker ? () => setPickerOpen(true) : undefined}
      className="rounded-lg border border-[#E9DDC6] bg-[#FFFDF9] hover:bg-[#FCF8F1] data-[state=open]:bg-[#FCF8F1]"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#F5EDDD] text-[#8A6424]">
        <IconMailHeart size={17} stroke={1.7} />
      </span>
      <div className="grid flex-1 text-left leading-tight">
        <span className="truncate text-[13px] font-medium text-[#1F1A14]">{active.title}</span>
        <span className="truncate text-[11px] text-[#6B5F50]">{sidebarSubtitle}</span>
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

  if (useSearchablePicker) {
    return (
      <>
        <SidebarMenu>
          <SidebarMenuItem>{sidebarTrigger}</SidebarMenuItem>
        </SidebarMenu>
        <SearchableInvitationDialog open={pickerOpen} onOpenChange={setPickerOpen} />
      </>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{sidebarTrigger}</DropdownMenuTrigger>
          <SwitcherMenuContent side={isMobile ? "bottom" : "right"} align="start" sideOffset={6} />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
