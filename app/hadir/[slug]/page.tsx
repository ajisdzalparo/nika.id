import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-helpers";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";
import { GuestSelfCheckIn } from "@/components/public/guest-self-checkin";
import type { StoredGuestIdentity } from "@/components/public/guest-identity-memory";
import { buttonVariants } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string; grup?: string }>;
}

async function resolveInvitation(slug: string) {
  const bySlug = await prisma.invitation.findUnique({ where: { slug } });
  if (bySlug) return bySlug;

  const legacyUser = await prisma.user.findUnique({
    where: { invitationSlug: slug },
    include: { invitations: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  return legacyUser?.invitations[0] ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await resolveInvitation(slug);
  if (!invitation) {
    return { title: "Check-in tidak ditemukan · SatuMoment", robots: { index: false } };
  }
  const raw = (invitation.data ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const data = mapInvitationToWeddingData(raw, "Tamu", invitation.weddingDate ?? undefined);
  const hasCouple = Boolean(raw.groom?.nickname || raw.groom?.fullName || raw.groom?.name) && Boolean(raw.bride?.nickname || raw.bride?.fullName || raw.bride?.name);
  const couple = hasCouple ? `${data.groom.nickname} & ${data.bride.nickname}` : invitation.title || "Undangan Pernikahan";

  return {
    title: `Check-in Kehadiran · ${couple}`,
    description: `Isi buku tamu & konfirmasi kehadiran di acara ${couple}.`,
    robots: { index: false },
  };
}

export default async function PublicGuestCheckInPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { to, grup } = await searchParams;
  const invitation = await resolveInvitation(slug);
  if (!invitation) notFound();

  const isPublished = invitation.plan !== "FREE" && invitation.isPublic !== false;
  const session = !isPublished ? await getSession(undefined, "user") : null;
  const isOwnerPreview = !isPublished && session?.user?.id === invitation.userId;

  // Check if `?to=` matches a PERSONAL or GROUP guest on this invitation
  let urlIdentity: StoredGuestIdentity | null = null;
  const cleanTo = to?.trim();
  if (cleanTo) {
    let recipientType: "PERSONAL" | "GROUP" = grup === "1" ? "GROUP" : "PERSONAL";
    let matchedName = cleanTo;
    let matchedMax: number | undefined = undefined;
    const inviteGuests = await prisma.guest.findMany({
      where: { invitationId: invitation.id },
      select: { name: true, greeting: true, recipientType: true, maxGuests: true },
      take: 500,
    });
    const lowered = cleanTo.toLowerCase();
    const matched = inviteGuests.find((g) => {
      const full = g.greeting ? `${g.greeting} ${g.name}`.trim().toLowerCase() : g.name.trim().toLowerCase();
      return g.name.trim().toLowerCase() === lowered || full === lowered;
    });
    if (matched) {
      matchedName = matched.name;
      matchedMax = matched.maxGuests;
      recipientType = matched.recipientType === "GROUP" ? "GROUP" : "PERSONAL";
    }
    urlIdentity = { name: matchedName, recipientType, maxGuests: matchedMax };
  }

  const raw = (invitation.data ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const data = mapInvitationToWeddingData(raw, "Tamu", invitation.weddingDate ?? undefined);
  const hasCouple = Boolean(raw.groom?.nickname || raw.groom?.fullName || raw.groom?.name) && Boolean(raw.bride?.nickname || raw.bride?.fullName || raw.bride?.name);
  const couple = hasCouple ? `${data.groom.nickname} & ${data.bride.nickname}` : invitation.title || "Undangan Pernikahan";
  const hasEvents = Boolean(raw.events?.length || raw.event?.date);
  const ev = hasEvents ? (data.events?.[0] ?? data.event) : null;
  const eventDate = ev?.date
    ? new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(ev.date))
    : invitation.weddingDate
      ? new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(invitation.weddingDate))
      : null;
  const venueName = ev?.venue && ev.venue !== "Nama Tempat Acara" ? ev.venue : null;
  const heroPhoto = data.gallery?.[0] || data.bride?.photo || data.groom?.photo || null;

  if (!isPublished && !isOwnerPreview) {
    return (
      <main className="studio flex min-h-svh flex-col items-center justify-center bg-[#FCF8F1] px-5 py-12 text-center text-[#1F1A14]">
        <div className="w-full max-w-md rounded-3xl border border-[#EDE3CF] bg-white p-8 shadow-[0_24px_60px_-34px_rgba(26,21,16,0.28)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#8A6424]">Buku Tamu Digital</p>
          <h1 className="mt-2 font-(family-name:--font-landing-display) text-3xl">{couple}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6B5F50]">
            Halaman check-in ini belum dibuka untuk umum karena undangan belum diterbitkan oleh mempelai.
          </p>
          <Link href="/" className={buttonVariants({ variant: "outline", className: "mt-6 h-10 rounded-full border-[#E9DDC6] px-5" })}>
            Kembali ke beranda
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="studio relative min-h-svh overflow-x-hidden bg-[#FCF8F1] px-4 py-8 text-[#1F1A14] sm:py-12">
      <div aria-hidden className="uy-lattice pointer-events-none fixed inset-0 opacity-60" />
      <div className="relative mx-auto w-full max-w-md space-y-5">
        {isOwnerPreview && (
          <div className="rounded-2xl border border-[#E3C77F] bg-[#F6EEDF] px-4 py-3 text-xs leading-relaxed text-[#5C431A]">
            <strong>Mode uji pemilik:</strong> Undangan ini belum diterbitkan untuk umum, namun kamu tetap bisa mencoba alur check-in tamu di sini.
          </div>
        )}

        <GuestSelfCheckIn
          slug={invitation.slug || slug}
          couple={couple}
          eventDate={eventDate}
          venue={venueName}
          heroPhoto={heroPhoto}
          urlIdentity={urlIdentity}
          maxGuests={Math.min(Math.max(data.rsvp?.maxGuests ?? 5, 1), 15)}
          askPhone={data.rsvp?.askPhone !== false}
          isOwnerPreview={isOwnerPreview}
        />
      </div>
    </main>
  );
}
