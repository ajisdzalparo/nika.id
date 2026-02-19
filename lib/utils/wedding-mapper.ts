/* eslint-disable @typescript-eslint/no-explicit-any */
import { WeddingData } from "@/types/wedding";

/**
 * Maps raw JSON invitation data to the standardized WeddingData format
 * @param invitationData Raw JSON from invitation.data
 * @param guestName Optional guest name from query params
 * @param defaultWeddingDate Fallback date if not specific in invitation data
 * @returns Standardized WeddingData
 */
export function mapInvitationToWeddingData(invitationData: any, guestName?: string, defaultWeddingDate?: Date): WeddingData {
  invitationData = invitationData || {};

  return {
    guestName: guestName || "Tamu Undangan",
    groom: {
      nickname: invitationData.groom?.nickname || invitationData.groom?.name?.split(" ")[0] || "Pria",
      fullName: invitationData.groom?.fullName || invitationData.groom?.name || "Nama Mempelai Pria",
      fatherName: invitationData.groom?.fatherName || invitationData.groom?.parents?.split("&")[0]?.trim() || "Ayah",
      motherName: invitationData.groom?.motherName || invitationData.groom?.parents?.split("&")[1]?.trim() || "Ibu",
      instagram: invitationData.groom?.instagram,
      photo: invitationData.groom?.photo,
    },
    bride: {
      nickname: invitationData.bride?.nickname || invitationData.bride?.name?.split(" ")[0] || "Wanita",
      fullName: invitationData.bride?.fullName || invitationData.bride?.name || "Nama Mempelai Wanita",
      fatherName: invitationData.bride?.fatherName || invitationData.bride?.parents?.split("&")[0]?.trim() || "Ayah",
      motherName: invitationData.bride?.motherName || invitationData.bride?.parents?.split("&")[1]?.trim() || "Ibu",
      instagram: invitationData.bride?.instagram,
      photo: invitationData.bride?.photo,
    },
    // Support single event (legacy) and multiple events
    event: {
      date: invitationData.event?.date ? new Date(invitationData.event.date) : defaultWeddingDate || new Date(),
      time: invitationData.event?.time || "08:00",
      venue: invitationData.event?.venue || "Nama Tempat Acara",
      address: invitationData.event?.address || "Alamat Lengkap Lokasi",
      mapUrl: invitationData.event?.maps || invitationData.event?.mapUrl || "https://maps.google.com",
    },
    events: invitationData.events || [],
    gallery: Array.isArray(invitationData.gallery) ? invitationData.gallery : invitationData.gallery?.photos || [],
    video: invitationData.video || invitationData.gallery?.video,
    story: {
      title: invitationData.story?.title || "Kisah Kami",
      content: invitationData.story?.content || "",
    },
    gifts: invitationData.gifts || { enabled: false, bankAccounts: [] },
    music: invitationData.music,
    quote: invitationData.quote || {
      text: "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.",
      source: "Qs. Ar-Rum: 21",
    },
    loveStory: invitationData.loveStory || { enabled: false, chapters: [] },
    extendedFamily: invitationData.extendedFamily,
    protocol: invitationData.protocol,
    streaming: invitationData.streaming,
    extra: invitationData.extra,
  };
}
