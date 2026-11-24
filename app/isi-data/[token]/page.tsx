import { notFound } from "next/navigation";
import { ClientForm } from "@/components/public/client-form";
import { prisma } from "@/lib/prisma";
import { studioClass } from "@/lib/studio";

export default async function ClientDataEntryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const inv = await prisma.invitation.findUnique({
    where: { clientEditToken: token },
    select: {
      title: true,
      slug: true,
      clientName: true,
      data: true,
      user: { select: { agencyName: true, agencyWhatsapp: true, name: true } },
    },
  });

  if (!inv) notFound();

  const raw = (inv.data ?? {}) as Record<string, unknown>;
  const groom = (raw.groom ?? {}) as Record<string, string>;
  const bride = (raw.bride ?? {}) as Record<string, string>;
  const events = Array.isArray(raw.events) ? raw.events : [];
  const story = (raw.story ?? {}) as { title?: string; content?: string };
  const quote = (raw.quote ?? {}) as { text?: string; source?: string };
  const gifts = (raw.gifts ?? {}) as { bankAccounts?: { bankName: string; accountHolder: string; accountNumber: string }[] };

  return (
    <div className={studioClass}>
    <ClientForm
      token={token}
      invitationTitle={inv.title}
      agencyName={inv.user.agencyName || inv.user.name || "UNDANGIN YUK"}
      agencyWhatsapp={inv.user.agencyWhatsapp}
      clientName={inv.clientName}
      initial={{
        groom: {
          nickname: groom.nickname ?? "",
          fullName: groom.fullName ?? "",
          fatherName: groom.fatherName ?? "",
          motherName: groom.motherName ?? "",
          instagram: groom.instagram ?? "",
        },
        bride: {
          nickname: bride.nickname ?? "",
          fullName: bride.fullName ?? "",
          fatherName: bride.fatherName ?? "",
          motherName: bride.motherName ?? "",
          instagram: bride.instagram ?? "",
        },
        events:
          events.length > 0
            ? events.map((e: Record<string, unknown>, idx: number) => ({
                id: String(e.id || `ev-${idx}`),
                title: String(e.title || (idx === 0 ? "Akad Nikah" : "Resepsi")),
                date: e.date ? String(e.date).slice(0, 10) : "",
                time: String(e.time || ""),
                venue: String(e.venue || ""),
                address: String(e.address || ""),
                mapUrl: String(e.mapUrl || ""),
                lat: typeof e.lat === "number" ? e.lat : undefined,
                lng: typeof e.lng === "number" ? e.lng : undefined,
              }))
            : [
                { id: "akad", title: "Akad Nikah", date: "", time: "", venue: "", address: "", mapUrl: "" },
                { id: "resepsi", title: "Resepsi", date: "", time: "", venue: "", address: "", mapUrl: "" },
              ],
        story: { title: story.title ?? "", content: story.content ?? "" },
        quote: { text: quote.text ?? "", source: quote.source ?? "" },
        bankAccounts: Array.isArray(gifts.bankAccounts) ? gifts.bankAccounts : [],
      }}
    />
    </div>
  );
}
