import crypto from "node:crypto";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth-helpers";
import { TemplateRenderer } from "@/components/template-renderer";
import { prisma } from "@/lib/prisma";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";
import { getTemplateBySlug } from "@/lib/templates";
import { InvitationGuard } from "@/components/invitation/invitation-guard";
import { GuestIdentityMemory, type StoredGuestIdentity } from "@/components/public/guest-identity-memory";
import { getActiveAiTheme } from "@/lib/ai-design/server";
import type { AiTheme } from "@/lib/ai-design/schema";
import type { PlanType } from "@/lib/limits";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string; preview?: string; grup?: string }>;
}

async function resolvePublicInvitation(slug: string) {
  const bySlug = await prisma.invitation.findUnique({ where: { slug } });
  if (bySlug) return bySlug;

  const legacyUser = await prisma.user.findUnique({
    where: { invitationSlug: slug },
    include: { invitations: { orderBy: { createdAt: "asc" }, take: 1 } },
  });
  if (!legacyUser) return null;
  if (legacyUser.invitations[0]) return legacyUser.invitations[0];

  // Fallback synthetic object if legacy user somehow lacks an Invitation row
  return {
    id: `legacy_${legacyUser.id}`,
    userId: legacyUser.id,
    slug: legacyUser.invitationSlug,
    title: legacyUser.partnerName || legacyUser.name || "Undangan Pernikahan",
    weddingDate: legacyUser.weddingDate,
    templateSlug: legacyUser.templateSlug,
    activeAiDesignId: legacyUser.activeAiDesignId,
    plan: legacyUser.plan,
    planExpiresAt: legacyUser.planExpiresAt,
    extraGuestQuota: legacyUser.extraGuestQuota,
    views: legacyUser.views,
    isPublic: true,
    data: {},
    createdAt: legacyUser.createdAt,
    updatedAt: legacyUser.updatedAt,
  };
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { to } = await searchParams;

  const invitation = await resolvePublicInvitation(slug);
  if (!invitation) {
    return { title: "Undangan tidak ditemukan · SatuMoment", robots: { index: false } };
  }

  // This is what WhatsApp shows when the link is shared, so never fall back to placeholder names
  const invitationData = (invitation.data as unknown as import("@/types/wedding").WeddingData) || {};
  const firstWord = (s?: string) => s?.trim().split(/\s+/)[0];
  const groomName = invitationData.groom?.nickname || firstWord(invitationData.groom?.fullName);
  const brideName = invitationData.bride?.nickname || firstWord(invitationData.bride?.fullName);
  const couple = groomName && brideName ? `${groomName} & ${brideName}` : invitation.title || "Undangan Pernikahan";
  const title = `Undangan Pernikahan ${couple}`;
  const salutationTo = to
    ? /^(kepada|yth\.?)/i.test(to.trim())
      ? to.trim()
      : `Kepada Yth. ${to.trim()}`
    : null;
  const description = salutationTo
    ? `${salutationTo}, dengan hormat kami mengundang Anda di hari bahagia ${couple}. Buka untuk melihat detail acara.`
    : `Dengan hormat kami mengundang Anda di hari bahagia ${couple}. Buka untuk melihat detail acara.`;
  const gallery = Array.isArray(invitationData.gallery) ? (invitationData.gallery as string[]) : [];
  const image = gallery[0] || invitationData.groom?.photo || invitationData.bride?.photo || "/brand/icon-512.png";

  return {
    title: to ? `${to}, Anda diundang · ${title}` : title,
    description,
    robots: { index: false },
    openGraph: { title, description, images: [image], type: "website", locale: "id_ID" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function PublicInvitationPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { to, preview, grup } = await searchParams;

  const invitation = await resolvePublicInvitation(slug);
  if (!invitation) {
    notFound();
  }

  const session = preview === "1" ? await getSession(undefined, "user") : null;
  const isOwnerPreview = preview === "1" && session?.user?.id === invitation.userId;

  if (!isOwnerPreview && invitation.isPublic && invitation.plan !== "FREE" && !invitation.id.startsWith("legacy_")) {
    const ua = (await headers()).get("user-agent") || "";
    const device = /mobile|android|iphone|ipad|ipod/i.test(ua) ? "mobile" : "desktop";
    const visitId = crypto.randomUUID();
    await Promise.all([
      prisma.invitation.update({ where: { id: invitation.id }, data: { views: { increment: 1 } } }),
      prisma.$executeRaw`
        INSERT INTO "InvitationVisit" ("id", "invitationId", "device", "createdAt")
        VALUES (${visitId}, ${invitation.id}, ${device}, NOW())
      `.catch(() => {}),
    ]);
  }

  const aiTheme = invitation.templateSlug === "ai-design" ? await getActiveAiTheme(invitation.activeAiDesignId) : null;
  const [wishRows, owner] = await Promise.all([
    prisma.guestMessage.findMany({
      where: {
        OR: [
          ...(!invitation.id.startsWith("legacy_") ? [{ invitationId: invitation.id }] : []),
          { userId: invitation.userId, invitationId: null },
        ],
        status: { not: "REJECTED" },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { guestName: true, message: true, createdAt: true },
    }),
    prisma.user.findUnique({
      where: { id: invitation.userId },
      select: { accountType: true, agencyName: true, agencyInstagram: true, agencyWhatsapp: true },
    }),
  ]);
  const wishes = wishRows.map((w) => ({ ...w, createdAt: w.createdAt.toISOString() }));
  const agencyBranding =
    owner?.accountType === "AGENCY" && owner.agencyName
      ? { name: owner.agencyName, instagram: owner.agencyInstagram, whatsapp: owner.agencyWhatsapp }
      : null;

  // Remember personal vs group recipient on the guest's device for 1-tap venue QR check-in
  // and track real browser opens for named guests
  let guestIdentity: StoredGuestIdentity | null = null;
  let matchedGuestId: string | null = null;
  const cleanTo = to?.trim();
  if (cleanTo) {
    let recipientType: "PERSONAL" | "GROUP" = grup === "1" ? "GROUP" : "PERSONAL";
    let matchedName = cleanTo;
    let matchedMax: number | undefined = undefined;
    if (!invitation.id.startsWith("legacy_")) {
      const inviteGuests = await prisma.guest.findMany({
        where: { invitationId: invitation.id },
        select: { id: true, name: true, greeting: true, recipientType: true, maxGuests: true },
        take: 500,
      });
      const lowered = cleanTo.toLowerCase();
      const matched = inviteGuests.find((g) => {
        const cleanedGreet = (g.greeting ?? "")
          .trim()
          .replace(/^kepada\s+yth\.?\s*/i, "")
          .replace(/^kepada\s+/i, "")
          .replace(/^yth\.?\s*/i, "")
          .trim();
        const fullRaw = g.greeting ? `${g.greeting} ${g.name}`.trim().toLowerCase() : "";
        const fullClean = cleanedGreet ? `${cleanedGreet} ${g.name}`.trim().toLowerCase() : "";
        return (
          g.name.trim().toLowerCase() === lowered ||
          (fullRaw && fullRaw === lowered) ||
          (fullClean && fullClean === lowered)
        );
      });
      if (matched) {
        matchedGuestId = matched.id;
        matchedName = matched.name;
        matchedMax = matched.maxGuests;
        recipientType = matched.recipientType === "GROUP" ? "GROUP" : "PERSONAL";
      }
    }
    guestIdentity = { name: matchedName, recipientType, maxGuests: matchedMax };
  }

  return (
    <InvitationGuard
      invitation={{
        plan: invitation.plan as PlanType,
        planExpiresAt: invitation.planExpiresAt,
        templateSlug: invitation.templateSlug,
        isPublic: invitation.isPublic,
      }}
      isOwnerPreview={isOwnerPreview}
    >
      <GuestIdentityMemory
        slug={invitation.slug || slug}
        guest={guestIdentity}
        trackGuestId={matchedGuestId}
        isOwnerPreview={isOwnerPreview}
      />
      <PageContent
        templateSlug={invitation.templateSlug || ""}
        weddingDateRaw={invitation.weddingDate}
        rawData={invitation.data}
        to={to}
        aiTheme={aiTheme}
        wishes={wishes}
        agencyBranding={agencyBranding}
      />
    </InvitationGuard>
  );
}

function PageContent({
  templateSlug,
  weddingDateRaw,
  rawData,
  to,
  aiTheme,
  wishes,
  agencyBranding,
}: {
  templateSlug: string;
  weddingDateRaw?: Date | string | null;
  rawData: unknown;
  to?: string;
  aiTheme: AiTheme | null;
  wishes: import("@/lib/rsvp").Wish[];
  agencyBranding: import("@/types/wedding").WeddingData["agencyBranding"];
}) {
  const template = getTemplateBySlug(templateSlug);
  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4">
        <div className="max-w-md rounded-2xl border border-[#E1D8C9] bg-[#FFFDF9] p-8 text-center">
          <h1 className="font-serif text-3xl font-medium text-[#1E1B17]">Template Tidak Ditemukan</h1>
          <p className="mt-2 text-sm text-[#6B6358]">Template yang dipilih tidak tersedia.</p>
        </div>
      </div>
    );
  }

  const weddingDate = weddingDateRaw ? new Date(weddingDateRaw) : undefined;
  const weddingData = mapInvitationToWeddingData(rawData, to, weddingDate);
  if (aiTheme) weddingData.aiTheme = aiTheme;
  weddingData.wishes = wishes;
  weddingData.agencyBranding = agencyBranding;

  const eventName = `Pernikahan ${weddingData.groom.fullName} & ${weddingData.bride.fullName}`;
  const mainEvent = weddingData.events?.[0] || weddingData.event;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: eventName,
    startDate: mainEvent?.date ? new Date(mainEvent.date).toISOString() : undefined,
    location: mainEvent?.venue
      ? {
          "@type": "Place",
          name: mainEvent.venue,
          address: mainEvent.address,
        }
      : undefined,
    description: `Undangan Pernikahan ${weddingData.groom.fullName} & ${weddingData.bride.fullName}`,
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-pink-100 selection:text-pink-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TemplateRenderer slug={templateSlug} data={weddingData} />
    </div>
  );
}
