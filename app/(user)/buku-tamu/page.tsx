import { redirect } from "next/navigation";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { IconMessage, IconQuote, IconUsers } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { InvitationSwitcher } from "@/components/user/active-invitation-context";
import { RsvpManager } from "@/components/user/rsvp-manager";
import { PageHeader } from "@/components/common/studio-ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { prisma } from "@/lib/prisma";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";

export default async function BukuTamuPage() {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");

  const active = await getActiveInvitation(session.user.id);

  const [attendees, messages, guestRows] = await Promise.all([
    prisma.rSVP.findMany({ where: { invitationId: active.id }, orderBy: { createdAt: "desc" } }),
    prisma.guestMessage.findMany({ where: { invitationId: active.id }, orderBy: { createdAt: "desc" } }),
    prisma.guest.findMany({
      where: { invitationId: active.id },
      select: { name: true, phone: true, openedAt: true, openCount: true },
    }),
  ]);

  const raw = (active.data ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const data = mapInvitationToWeddingData(raw, "Tamu", active.weddingDate ?? undefined);
  const hasCouple = Boolean(raw.groom?.nickname || raw.groom?.fullName || raw.groom?.name) && Boolean(raw.bride?.nickname || raw.bride?.fullName || raw.bride?.name);
  const hasAnyCheckIn = attendees.some((a) => Boolean(a.checkedInAt));
  // Check-in tracking is always visible because every invitation has a printable venue QR in /check-in
  const qrEnabled = Boolean(data.rsvp?.qrCheckIn) || hasAnyCheckIn || true;
  const ev = data.events?.[0] ?? data.event;
  const eventDate = ev?.date ? new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(ev.date)) : null;

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-6 lg:px-8 lg:pt-8">
        <div className="w-full space-y-6">
          <PageHeader
            eyebrow={active.title}
            title="RSVP & Ucapan"
            description="Pantau konfirmasi tamu, ucapan doa, dan kedatangan dari QR meja tamu atau QR check-in pribadi."
            actions={<InvitationSwitcher compact />}
          />

          <Tabs defaultValue="attendance" className="w-full">
            <TabsList className="mb-5 h-auto w-fit rounded-full bg-[#F6EEDF] p-1">
              <TabsTrigger value="attendance" className="rounded-full px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <IconUsers className="mr-2 size-4" /> Daftar RSVP
              </TabsTrigger>
              <TabsTrigger value="messages" className="rounded-full px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <IconMessage className="mr-2 size-4" /> Ucapan ({messages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attendance">
              <RsvpManager
                qrEnabled={qrEnabled}
                card={{
                  couple: hasCouple ? `${data.groom.nickname} & ${data.bride.nickname}` : active.title,
                  date: eventDate,
                  venue: ev?.venue && ev.venue !== "Nama Tempat Acara" ? ev.venue : null,
                }}
                initialRows={attendees.map((a) => {
                  const matchedGuest = guestRows.find(
                    (g) =>
                      g.name.trim().toLowerCase() === a.guestName.trim().toLowerCase() ||
                      (a.phone && g.phone && g.phone === a.phone),
                  );
                  return {
                    id: a.id,
                    guestName: a.guestName,
                    attendance: a.attendance,
                    guests: a.guests,
                    phone: a.phone,
                    companions: a.companions,
                    customAnswer: a.customAnswer,
                    note: a.note,
                    checkInToken: a.checkInToken,
                    checkedInAt: a.checkedInAt?.toISOString() ?? null,
                    webOpenedAt: matchedGuest?.openedAt?.toISOString() ?? a.createdAt.toISOString(),
                    webOpenCount: matchedGuest?.openCount ? Math.max(1, matchedGuest.openCount) : 1,
                    createdAt: a.createdAt.toISOString(),
                  };
                })}
              />
            </TabsContent>

            <TabsContent value="messages">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {messages.map((msg) => (
                  <div key={msg.id} className="relative rounded-2xl border border-[#EDE3CF] bg-white p-6 shadow-[0_1px_2px_rgba(26,21,16,.04)]">
                    <IconQuote className="absolute right-6 top-6 size-10 rotate-180 text-[#D9B56A]/25" />
                    <p className="relative min-h-[60px] leading-relaxed text-[#40372B]">&ldquo;{msg.message}&rdquo;</p>
                    <div className="mt-5 flex items-center gap-3 border-t border-[#F3EBDB] pt-4">
                      <span className="flex size-9 items-center justify-center rounded-full bg-[#F6EEDF] font-(family-name:--font-landing-display) text-[#8A6424]">{msg.guestName.charAt(0).toUpperCase()}</span>
                      <div>
                        <p className="text-sm font-medium text-[#1F1A14]">{msg.guestName}</p>
                        <p className="text-[11px] uppercase tracking-wider text-[#8E8268]">{format(new Date(msg.createdAt), "dd MMM yyyy", { locale: idLocale })}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-dashed border-[#E9DDC6] p-16 text-center text-[#6B5F50]">
                    <IconMessage size={30} className="mx-auto mb-3 text-[#D9B56A]" />
                    Belum ada ucapan doa dari tamu.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
