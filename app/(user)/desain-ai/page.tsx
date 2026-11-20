import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";
import { MOCK_WEDDING_DATA } from "@/lib/constants/mock-wedding-data";
import { AiDesignStudio } from "@/components/user/ai-design-studio";
import type { WeddingData } from "@/types/wedding";

export default async function DesainAiPage() {
  const session = await auth.api.getSession({ headers: Object.fromEntries(await headers()) });
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { invitation: true } });
  if (!user) redirect("/login");

  // Preview with the couple's real data; fill gaps (names, photos) with sample data so the design reads well.
  const raw = (user.invitation?.data ?? {}) as Record<string, unknown>;
  const hasCouple = Boolean((raw.groom as { name?: string; nickname?: string })?.nickname || (raw.groom as { name?: string })?.name);
  const real = mapInvitationToWeddingData(raw, "Bapak & Ibu Tamu", user.weddingDate ?? undefined);
  const previewData: WeddingData = hasCouple
    ? { ...real, gallery: real.gallery.length ? real.gallery : MOCK_WEDDING_DATA.gallery, events: real.events.length ? real.events : MOCK_WEDDING_DATA.events }
    : { ...MOCK_WEDDING_DATA, guestName: "Bapak & Ibu Tamu" };

  return (
    <>
      <SiteHeader user={session.user} />
      <AiDesignStudio previewData={previewData} usesSampleData={!hasCouple} />
    </>
  );
}
