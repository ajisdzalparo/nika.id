import { notFound } from "next/navigation";
import { TemplateRenderer } from "@/components/template-renderer";
import { prisma } from "@/lib/prisma";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";
import { getTemplateBySlug } from "@/lib/templates";
import { InvitationGuard } from "@/components/invitation/invitation-guard";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string }>;
}

import type { Metadata } from "next";

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { to } = await searchParams;

  const user = (await prisma.user.findUnique({
    where: { invitationSlug: slug },
    include: { invitation: true },
  })) as unknown as import("@/types/user").UserWithPlan;

  if (!user) {
    return {
      title: "Invitation Not Found - Nika.id",
    };
  }

  const invitationData = (user.invitation?.data as unknown as import("@/types/wedding").WeddingData) || {};
  const groomName = invitationData.groom?.nickname || "Pria";
  const brideName = invitationData.bride?.nickname || "Wanita";
  const title = `Undangan Pernikahan ${groomName} & ${brideName}`;
  const description = `The Wedding Celebration of ${invitationData.groom?.fullName} & ${invitationData.bride?.fullName}. Klik untuk melihat detail acara.`;

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
  const { to } = await searchParams;

  const user = (await prisma.user.update({
    where: { invitationSlug: slug },
    data: { views: { increment: 1 } },
    include: {
      invitation: true,
    },
  })) as unknown as import("@/types/user").UserWithPlan;

  if (!user) {
    notFound();
  }

  return (
    <InvitationGuard user={user}>
      <PageContent user={user} to={to} />
    </InvitationGuard>
  );
}

function PageContent({ user, to }: { user: import("@/types/user").UserWithPlan; to?: string }) {
  // Validate the slug exists in our template registry
  const template = getTemplateBySlug(user.templateSlug || "");
  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50/30">
        <div className="text-center p-8 bg-white rounded-3xl shadow-2xl border border-pink-100 max-w-md mx-4">
          <h1 className="text-2xl font-black text-gray-900 mb-2">Template Tidak Ditemukan</h1>
          <p className="text-gray-600">Template yang dipilih tidak tersedia.</p>
        </div>
      </div>
    );
  }

  // Map the JSON data from Editor to the format expected by templates
  // Ensure weddingDate is Date object if passed
  const weddingDate = user.weddingDate ? new Date(user.weddingDate) : undefined;
  const weddingData = mapInvitationToWeddingData(user.invitation?.data, to, weddingDate);

  const eventDate = weddingData.event?.date ? new Date(weddingData.event.date) : new Date();
  const eventName = `Pernikahan ${weddingData.groom.fullName} & ${weddingData.bride.fullName}`;
  const eventVenue = weddingData.event?.venue || "Venue";
  const eventAddress = weddingData.event?.address || "Address";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: eventName,
    description: `Undangan Pernikahan ${weddingData.groom.fullName} & ${weddingData.bride.fullName}`,
    startDate: eventDate.toISOString(),
    location: {
      "@type": "Place",
      name: eventVenue,
      address: {
        "@type": "PostalAddress",
        streetAddress: eventAddress,
      },
    },
    image: [weddingData.groom.photo || weddingData.bride.photo || ""],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TemplateRenderer slug={user.templateSlug!} data={weddingData} />
    </>
  );
}
