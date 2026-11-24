import Link from "next/link";
import { redirect } from "next/navigation";
import { IconArrowRight, IconBook, IconInfoCircle } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { InvitationSwitcher } from "@/components/user/active-invitation-context";
import { CheckInScanner } from "@/components/user/checkin-scanner";
import { PageHeader, Panel } from "@/components/common/studio-ui";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { prisma } from "@/lib/prisma";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";

export default async function CheckInPage() {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");

  const active = await getActiveInvitation(session.user.id);
  const rsvps = await prisma.rSVP.findMany({
    where: { invitationId: active.id },
    orderBy: [{ checkedInAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      guestName: true,
      attendance: true,
      guests: true,
      companions: true,
      note: true,
      checkedInAt: true,
    },
  });

  const raw = (active.data ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const data = mapInvitationToWeddingData(raw, "Tamu", active.weddingDate ?? undefined);
  const hasCouple = Boolean(raw.groom?.nickname || raw.groom?.fullName || raw.groom?.name) && Boolean(raw.bride?.nickname || raw.bride?.fullName || raw.bride?.name);
  const couple = hasCouple ? `${data.groom.nickname} & ${data.bride.nickname}` : active.title;
  const hasEvents = Boolean(raw.events?.length || raw.event?.date);
  const ev = hasEvents ? (data.events?.[0] ?? data.event) : null;
  const eventDate = ev?.date
    ? new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(ev.date))
    : active.weddingDate
      ? new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(active.weddingDate))
      : null;
  const venueName = ev?.venue && ev.venue !== "Nama Tempat Acara" ? ev.venue : null;

  const coming = rsvps.filter((r) => r.attendance.toUpperCase() !== "TIDAK HADIR");
  const checked = rsvps.filter((r) => Boolean(r.checkedInAt));

  const initialStats = {
    attendingCount: coming.length,
    attendingPeople: coming.reduce((sum, r) => sum + (r.guests || 1), 0),
    checkedInCount: checked.length,
    checkedInPeople: checked.reduce((sum, r) => sum + (r.guests || 1), 0),
  };

  const recentCheckedIn = checked.slice(0, 20).map((r) => ({
    id: r.id,
    name: r.guestName,
    guests: r.guests || 1,
    companions: r.companions,
    note: r.note,
    checkedInAt: r.checkedInAt!.toISOString(),
  }));

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://undanginyuk.ajisdzalparo.com";
  const isPublished = active.plan !== "FREE" && active.isPublic !== false;

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-6 lg:px-8 lg:pt-8">
        <div className="w-full space-y-6">
          <PageHeader
            eyebrow={active.title}
            title="Check-in Tamu"
            description="Cetak poster QR untuk diletakkan di meja penerima tamu agar tamu cukup scan pakai kamera HP sendiri, atau pindai QR tamu lewat mode panitia."
            actions={
              <>
                <InvitationSwitcher compact />
                <Link
                  href="/buku-tamu"
                  className={buttonVariants({ variant: "outline", className: "h-9 rounded-full border-[#E9DDC6] bg-white px-3.5 text-xs shadow-none hover:border-[#8A6424]" })}
                >
                  <IconBook size={15} /> Daftar RSVP
                </Link>
              </>
            }
          />

          {!isPublished && (
            <Panel tone="champagne" className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#8A6424]">
                    <IconInfoCircle size={18} stroke={1.7} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#1F1A14]">Undangan masih mode pratinjau</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#6B5F50]">
                      Kamu tetap bisa mengunduh &amp; mengetes QR check-in sekarang sebagai pemilik. Aktifkan paket undangan agar tamu umum bisa scan saat acara berlangsung.
                    </p>
                  </div>
                </div>
                <Link
                  href="/upgrade"
                  className={buttonVariants({ variant: "ink", size: "sm", className: "h-9 shrink-0 px-4 text-xs" })}
                >
                  Aktifkan Paket <IconArrowRight size={14} />
                </Link>
              </div>
            </Panel>
          )}

          <CheckInScanner
            invitationTitle={active.title}
            couple={couple}
            slug={active.slug || ""}
            baseUrl={baseUrl}
            eventDate={eventDate}
            venue={venueName}
            initialStats={initialStats}
            recentCheckedIn={recentCheckedIn}
          />
        </div>
      </div>
    </>
  );
}
