import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth-helpers";
import { TemplateRenderer } from "@/components/template-renderer";
import { prisma } from "@/lib/prisma";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";
import { getTemplateBySlug } from "@/lib/templates";
import { InvitationGuard } from "@/components/invitation/invitation-guard";
import { getActiveAiTheme } from "@/lib/ai-design/server";
import type { AiTheme } from "@/lib/ai-design/schema";
import type { PlanType } from "@/lib/limits";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string; preview?: string }>;
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
    return { title: "Invitation Not Found - UNDANGIN YUK" };
  }

  const invitationData = (invitation.data as unknown as import("@/types/wedding").WeddingData) || {};
  const groomName = invitationData.groom?.nickname || "Pria";
  const brideName = invitationData.bride?.nickname || "Wanita";
  const title = `Undangan Pernikahan ${groomName} & ${brideName}`;
  const description = `The Wedding Celebration of ${invitationData.groom?.fullName || groomName} & ${invitationData.bride?.fullName || brideName}. Klik untuk melihat detail acara.`;

  return {
    title: to ? `${to}, Anda diundang! | ${title}` : title,
    description,
    openGraph: {
      title,
      description,
      images: [invitationData.groom?.photo || invitationData.bride?.photo || "/og-image.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [invitationData.groom?.photo || invitationData.bride?.photo || "/og-image.jpg"],
    },
  };
}

export default async function PublicInvitationPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { to, preview } = await searchParams;

  const invitation = await resolvePublicInvitation(slug);
  if (!invitation) {
    notFound();
  }

  const session = preview === "1" ? await getSession(undefined, "user") : null;
  const isOwnerPreview = preview === "1" && session?.user?.id === invitation.userId;

  if (!isOwnerPreview && invitation.isPublic && invitation.plan !== "FREE" && !invitation.id.startsWith("legacy_")) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { views: { increment: 1 } } });
  }

  const aiTheme = invitation.templateSlug === "ai-design" ? await getActiveAiTheme(invitation.activeAiDesignId) : null;
  const wishes = (
    await prisma.guestMessage.findMany({
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
    })
  ).map((w) => ({ ...w, createdAt: w.createdAt.toISOString() }));

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
      <PageContent
        templateSlug={invitation.templateSlug || ""}
        weddingDateRaw={invitation.weddingDate}
        rawData={invitation.data}
        to={to}
        aiTheme={aiTheme}
        wishes={wishes}
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
}: {
  templateSlug: string;
  weddingDateRaw?: Date | string | null;
  rawData: unknown;
  to?: string;
  aiTheme: AiTheme | null;
  wishes: import("@/lib/rsvp").Wish[];
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
