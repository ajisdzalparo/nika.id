import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";
import { MOCK_WEDDING_DATA } from "@/lib/constants/mock-wedding-data";
import { AiDesignStudio } from "@/components/user/ai-design-studio";
import { isAiDesignEnabled } from "@/lib/system-settings";
import type { WeddingData } from "@/types/wedding";

export default async function DesainAiPage() {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");

  const [invitation, aiEnabled] = await Promise.all([
    getActiveInvitation(session.user.id),
    isAiDesignEnabled(),
  ]);

  // Preview with the couple's real data; fill gaps (names, photos) with sample data so the design reads well.
  const raw = (invitation.data ?? {}) as Record<string, unknown>;
  const hasCouple = Boolean((raw.groom as { name?: string; nickname?: string })?.nickname || (raw.groom as { name?: string })?.name);
  const real = mapInvitationToWeddingData(raw, "Bapak & Ibu Tamu", invitation.weddingDate ?? undefined);
  const previewData: WeddingData = hasCouple
    ? { ...real, gallery: real.gallery.length ? real.gallery : MOCK_WEDDING_DATA.gallery, events: real.events.length ? real.events : MOCK_WEDDING_DATA.events }
    : { ...MOCK_WEDDING_DATA, guestName: "Bapak & Ibu Tamu" };

  return (
    <>
      <SiteHeader user={session.user} />
      <AiDesignStudio previewData={previewData} usesSampleData={!hasCouple} aiEnabled={aiEnabled} />
    </>
  );
}
