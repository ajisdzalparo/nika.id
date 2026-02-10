/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import { TemplateRenderer } from "@/components/template-renderer";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string }>;
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

  const invitationData = (user.invitation?.data as any) || {};

  // Map the JSON data from Editor to the format expected by templates
  const weddingData = {
    guestName: to || "Tamu Undangan",
    groom: {
      nickname: invitationData.groom?.name?.split(" ")[0] || "Pria",
      fullName: invitationData.groom?.name || "Nama Mempelai Pria",
      fatherName: invitationData.groom?.parents?.split("&")[0]?.trim() || "Ayah",
      motherName: invitationData.groom?.parents?.split("&")[1]?.trim() || "Ibu",
      instagram: invitationData.groom?.instagram,
      photo: invitationData.groom?.photo,
    },
    bride: {
      nickname: invitationData.bride?.name?.split(" ")[0] || "Wanita",
      fullName: invitationData.bride?.name || "Nama Mempelai Wanita",
      fatherName: invitationData.bride?.parents?.split("&")[0]?.trim() || "Ayah",
      motherName: invitationData.bride?.parents?.split("&")[1]?.trim() || "Ibu",
      instagram: invitationData.bride?.instagram,
      photo: invitationData.bride?.photo,
    },
    event: {
      date: invitationData.event?.date ? new Date(invitationData.event.date) : user.weddingDate || new Date(),
      time: invitationData.event?.time || "08:00",
      venue: invitationData.event?.venue || "Nama Tempat Acara",
      address: invitationData.event?.address || "Alamat Lengkap Lokasi",
      mapUrl: invitationData.event?.maps || "https://maps.google.com",
    },
    gallery: invitationData.gallery?.photos || [],
    video: invitationData.gallery?.video,
    story: {
      title: invitationData.story?.title || "Kisah Kami",
      content: invitationData.story?.content || "",
    },
  };

  return <TemplateRenderer slug={user.template.slug} data={weddingData} />;
}
