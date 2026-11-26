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
import { maskPhone } from "@/lib/phone";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";

export default async function ManajemenTamuPage() {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");

  const [active, viewer] = await Promise.all([
    getActiveInvitation(session.user.id),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { accountType: true } }),
  ]);
  const isMitraMonitoring = viewer?.accountType === "AGENCY";
  const [initialGuests, rsvpRows] = await Promise.all([
    prisma.guest.findMany({
      where: { invitationId: active.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.rSVP.findMany({
      where: { invitationId: active.id, checkInToken: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { guestName: true, phone: true, checkInToken: true },
    }),
  ]);

  const raw = (active.data ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const data = mapInvitationToWeddingData(raw, "Tamu", active.weddingDate ?? undefined);
  const hasCouple = Boolean(raw.groom?.nickname || raw.groom?.fullName || raw.groom?.name) && Boolean(raw.bride?.nickname || raw.bride?.fullName || raw.bride?.name);
  const coupleName = hasCouple ? `${data.groom.nickname} & ${data.bride.nickname}` : active.title;
  const qrEnabled = Boolean(data.rsvp?.qrCheckIn);
  const ev = data.events?.[0] ?? data.event;
  const eventDate = ev?.date
    ? new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }).format(new Date(ev.date))
    : null;
  const eventVenue = ev?.venue && ev.venue !== "Nama Tempat Acara" ? ev.venue : null;

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
            description={
              isMitraMonitoring
                ? "Pantau daftar tamu dan status pengiriman undangan klien. Data nomor telepon tamu disensor untuk menjaga privasi."
                : "Kelola data tamu, nomor WhatsApp, label grup, dan bagikan tautan undangan personal."
            }
            actions={
              <>
                <InvitationSwitcher compact />
                {!isMitraMonitoring && (
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
                )}
              </>
            }
          />

          <GuestList
            initialGuests={initialGuests.map((g) => {
              const fullName = g.greeting ? `${g.greeting} ${g.name}`.trim() : g.name.trim();
              const candidates = [g.name.trim().toLowerCase(), fullName.toLowerCase()];
              const matchedRsvp = !isMitraMonitoring
                ? rsvpRows.find(
                    (r) =>
                      (g.phone && r.phone && r.phone === g.phone) ||
                      candidates.includes(r.guestName.trim().toLowerCase()),
                  )
                : undefined;
              return {
                id: g.id,
                name: g.name,
                recipientType: g.recipientType === "GROUP" ? "GROUP" : "PERSONAL",
                guestType: g.guestType === "VIP" ? "VIP" : "REGULAR",
                greeting: g.greeting,
                phone: isMitraMonitoring ? maskPhone(g.phone) : g.phone,
                label: g.label,
                maxGuests: g.maxGuests,
                rsvpEnabled: g.rsvpEnabled,
                eventName: g.eventName,
                note: g.note,
                sentAt: g.sentAt?.toISOString() ?? null,
                openedAt: g.openedAt?.toISOString() ?? null,
                lastOpenedAt: g.lastOpenedAt?.toISOString() ?? null,
                openCount: g.openCount,
                checkInToken: matchedRsvp?.checkInToken ?? null,
              };
            })}
            invitationSlug={active.slug || "undangan"}
            coupleName={coupleName}
            eventOptions={eventOptions}
            userPlan={active.plan as PlanType}
            extraGuestQuota={active.extraGuestQuota ?? 0}
            monitoringOnly={isMitraMonitoring}
            qrEnabled={qrEnabled}
            card={{ couple: coupleName, date: eventDate, venue: eventVenue }}
          />
        </div>
      </div>
    </>
  );
}
