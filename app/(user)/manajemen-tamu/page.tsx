import Link from "next/link";
import { redirect } from "next/navigation";
import { IconBrandWhatsapp } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { InvitationSwitcher } from "@/components/user/active-invitation-context";
import { GuestList } from "@/components/user/guest-list";
import { PageHeader } from "@/components/common/studio-ui";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { prisma } from "@/lib/prisma";
import { PlanType } from "@/lib/limits";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";

export default async function ManajemenTamuPage() {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");

  const active = await getActiveInvitation(session.user.id);
  const initialGuests = await prisma.guest.findMany({
    where: { invitationId: active.id },
    orderBy: { createdAt: "desc" },
  });

  const raw = (active.data ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const data = mapInvitationToWeddingData(raw, "Tamu", active.weddingDate ?? undefined);
  const hasCouple = Boolean(raw.groom?.nickname || raw.groom?.fullName || raw.groom?.name) && Boolean(raw.bride?.nickname || raw.bride?.fullName || raw.bride?.name);
  const coupleName = hasCouple ? `${data.groom.nickname} & ${data.bride.nickname}` : active.title;

  const eventOptions = Array.from(
    new Set([
      "Umum",
      ...(data.events ?? []).map((e) => e.title?.trim()).filter((v): v is string => Boolean(v)),
      "Livestream",
    ]),
  );

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-6 lg:px-8 lg:pt-8">
        <div className="w-full space-y-6">
          <PageHeader
            eyebrow={active.title}
            title="Daftar Tamu"
            description="Kelola data tamu, nomor WhatsApp, label grup, dan bagikan tautan undangan personal."
            actions={
              <>
                <InvitationSwitcher compact />
                <Link
                  href="/wa-blast"
                  className={buttonVariants({ variant: "outline", className: "h-9 rounded-full border-[#E9DDC6] bg-white px-3.5 text-xs shadow-none hover:border-[#8A6424]" })}
                >
                  <IconBrandWhatsapp size={15} className="text-[#8A6424]" />
                  WA Blast
                  <span className="rounded-full bg-[#F6EEDF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8A6424]">
                    Segera
                  </span>
                </Link>
              </>
            }
          />

          <GuestList
            initialGuests={initialGuests.map((g) => ({
              id: g.id,
              name: g.name,
              recipientType: g.recipientType === "GROUP" ? "GROUP" : "PERSONAL",
              guestType: g.guestType === "VIP" ? "VIP" : "REGULAR",
              greeting: g.greeting,
              phone: g.phone,
              label: g.label,
              maxGuests: g.maxGuests,
              rsvpEnabled: g.rsvpEnabled,
              eventName: g.eventName,
              note: g.note,
              sentAt: g.sentAt?.toISOString() ?? null,
              openedAt: g.openedAt?.toISOString() ?? null,
              lastOpenedAt: g.lastOpenedAt?.toISOString() ?? null,
              openCount: g.openCount,
            }))}
            invitationSlug={active.slug || "undangan"}
            coupleName={coupleName}
            eventOptions={eventOptions}
            userPlan={active.plan as PlanType}
            extraGuestQuota={active.extraGuestQuota ?? 0}
          />
        </div>
      </div>
    </>
  );
}
