import Link from "next/link";
import { redirect } from "next/navigation";
import { IconUsers } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { InvitationSwitcher } from "@/components/user/active-invitation-context";
import { WaBlastStudio } from "@/components/user/wa-blast-studio";
import { PageHeader } from "@/components/common/studio-ui";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { prisma } from "@/lib/prisma";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";

export default async function WaBlastPage() {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");

  const active = await getActiveInvitation(session.user.id);
  const [guests, existingWaitlist] = await Promise.all([
    prisma.guest.findMany({
      where: { invitationId: active.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.feedback.findFirst({
      where: { userId: session.user.id, pagePath: "/wa-blast" },
      select: { id: true },
    }),
  ]);

  const raw = (active.data ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const data = mapInvitationToWeddingData(raw, "Tamu", active.weddingDate ?? undefined);
  const hasCouple = Boolean(raw.groom?.nickname || raw.groom?.fullName || raw.groom?.name) && Boolean(raw.bride?.nickname || raw.bride?.fullName || raw.bride?.name);
  const hasEvents = Boolean(raw.events?.length || raw.event?.date);
  const ev = hasEvents ? (data.events?.[0] ?? data.event) : null;
  const coupleName = hasCouple ? `${data.groom.nickname} & ${data.bride.nickname}` : active.title;

  const formattedDate = ev?.date
    ? new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(ev.date))
    : "Sabtu, 28 November 2026";

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://undanginyuk.ajisdzalparo.com";

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-6 lg:px-8 lg:pt-8">
        <div className="w-full space-y-6">
          <PageHeader
            eyebrow="WhatsApp"
            title="WA Blast"
            description="Kirim undangan ke tamu lewat WhatsApp."
            actions={
              <>
                <InvitationSwitcher compact />
                <Link
                  href="/manajemen-tamu"
                  className={buttonVariants({ variant: "outline", className: "h-9 rounded-full border-[#E9DDC6] bg-white px-3.5 text-xs shadow-none hover:border-[#8A6424]" })}
                >
                  <IconUsers size={15} /> Kelola Tamu
                </Link>
              </>
            }
          />

          <WaBlastStudio
            invitationId={active.id}
            invitationSlug={active.slug || "undangan"}
            baseUrl={baseUrl}
            coupleName={coupleName}
            eventTitle={ev?.title || `Pernikahan ${coupleName}`}
            eventDate={formattedDate}
            eventTime={ev?.time || "09.00 WIB"}
            venue={ev?.venue || "Lokasi Acara"}
            address={ev?.address || "Alamat lokasi acara"}
            qrEnabled={Boolean(data.rsvp?.qrCheckIn)}
            alreadyWaitlisted={Boolean(existingWaitlist)}
            guests={guests.map((g) => ({
              id: g.id,
              name: g.name,
              greeting: g.greeting,
              guestType: g.guestType === "VIP" ? "VIP" : "REGULAR",
              phone: g.phone,
              label: g.label,
              eventName: g.eventName,
              maxGuests: g.maxGuests,
            }))}
          />
        </div>
      </div>
    </>
  );
}
