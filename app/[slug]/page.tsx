/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import { TemplateRenderer } from "@/components/template-renderer";
import { prisma } from "@/lib/prisma";
import { mockWeddingData } from "@/lib/mock-wedding-data";

export default async function PublicInvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

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
  // If user hasn't selected a template, we could show a default or error
  if (!user.templateId || !user.template) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Undangan Belum Siap</h1>
          <p className="text-gray-600">Mempelai belum memilih template undangan.</p>
        </div>
      </div>
    );
  }

  const invitationData = (user.invitation?.data as any) || {};

  const weddingData = {
    groom: {
      nickname: invitationData.groom?.nickname || user.name?.split(" ")[0] || "Groom",
      fullName: invitationData.groom?.fullName || user.name || "Groom Name",
      fatherName: invitationData.groom?.fatherName || "Father Name",
      motherName: invitationData.groom?.motherName || "Mother Name",
    },
    bride: {
      nickname: invitationData.bride?.nickname || user.partnerName?.split(" ")[0] || "Bride",
      fullName: invitationData.bride?.fullName || user.partnerName || "Bride Name",
      fatherName: invitationData.bride?.fatherName || "Father Name",
      motherName: invitationData.bride?.motherName || "Mother Name",
    },
    event: {
      date: user.weddingDate || new Date(),
      location: invitationData.event?.location || "Venue Location",
      mapUrl: invitationData.event?.mapUrl || "https://maps.google.com",
    },
    gallery: invitationData.gallery || [],
    quote: invitationData.quote || "The wedding quote goes here.",
  };

  const finalData = user.invitation ? weddingData : mockWeddingData;

  return <TemplateRenderer slug={user.template.slug} data={finalData} />;
}
