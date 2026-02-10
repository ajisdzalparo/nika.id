/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import { TemplateRenderer } from "@/components/template-renderer";
import { prisma } from "@/lib/prisma";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string }>;
}

import type { Metadata } from "next";

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { to } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { invitationSlug: slug },
    include: { invitation: true },
  });

  if (!user) {
    return {
      title: "Invitation Not Found - Nika.id",
    };
  }

  const invitationData = (user.invitation?.data as any) || {};
  const groomName = invitationData.groom?.name?.split(" ")[0] || "Pria";
  const brideName = invitationData.bride?.name?.split(" ")[0] || "Wanita";
  const title = `Undangan Pernikahan ${groomName} & ${brideName}`;
  const description = `The Wedding Celebration of ${invitationData.groom?.name} & ${invitationData.bride?.name}. Klik untuk melihat detail acara.`;

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

  const user = await prisma.user.findUnique({
    where: { invitationSlug: slug },
    include: {
      template: true,
      invitation: true,
    },
  });

  if (!user) {
    notFound();
  }

  // If user hasn't selected a template, show status page
  if (!user.templateId || !user.template) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pink-50/30">
        <div className="text-center p-8 bg-white rounded-3xl shadow-2xl border border-pink-100 max-w-md mx-4">
          <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⏳</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Undangan Sedang Disiapkan</h1>
          <p className="text-gray-600">Mempelai sedang merangkai momen indah untuk Anda. Silakan cek kembali beberapa saat lagi!</p>
        </div>
      </div>
    );
  }

  // Map the JSON data from Editor to the format expected by templates
  const weddingData = mapInvitationToWeddingData(user.invitation?.data, to, user.weddingDate || undefined);

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
      <TemplateRenderer slug={user.template.slug} data={weddingData} />
    </>
  );
}
