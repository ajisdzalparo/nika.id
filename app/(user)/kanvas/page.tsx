import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { KanvasProjectsHub } from "@/components/user/kanvas-projects-hub";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { normalizeTheme } from "@/lib/ai-design/color";
import { MOCK_WEDDING_DATA } from "@/lib/constants/mock-wedding-data";
import { prisma } from "@/lib/prisma";
import { isAiDesignEnabled } from "@/lib/system-settings";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";
import type { WeddingData } from "@/types/wedding";

export default async function KanvasPage({
  searchParams,
}: {
  searchParams?: Promise<{ designId?: string; blank?: string; preset?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  if (resolvedParams.blank || resolvedParams.designId || resolvedParams.preset) {
    const qs = new URLSearchParams();
    if (resolvedParams.blank) qs.set("blank", resolvedParams.blank);
    if (resolvedParams.designId) qs.set("designId", resolvedParams.designId);
    if (resolvedParams.preset) qs.set("preset", resolvedParams.preset);
    redirect(`/kanvas/editor?${qs.toString()}`);
  }

  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");

  const active = await getActiveInvitation(session.user.id);

  const [designs, myTemplates, aiEnabled] = await Promise.all([
    prisma.aiDesign.findMany({
      where: { userId: session.user.id, source: { in: ["AI", "CANVAS", "CATALOG"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.catalogTemplate.findMany({
      where: { creatorId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        price: true,
        platformFeePct: true,
        reviewStatus: true,
        reviewNote: true,
        isActive: true,
        usageCount: true,
        createdAt: true,
      },
    }),
    isAiDesignEnabled(),
  ]);

  const serializedDesigns = designs.map((d) => ({
    id: d.id,
    source: d.source,
    prompt: d.prompt,
    createdAt: d.createdAt.toISOString(),
    theme: normalizeTheme(d.theme),
  }));

  const raw = (active.data ?? {}) as Record<string, unknown>;
  const hasCouple = Boolean((raw.groom as { name?: string; nickname?: string })?.nickname || (raw.groom as { name?: string })?.name);
  const real = mapInvitationToWeddingData(raw, "Bapak & Ibu Tamu", active.weddingDate ?? undefined);
  const previewData: WeddingData = hasCouple
    ? { ...real, gallery: real.gallery.length ? real.gallery : MOCK_WEDDING_DATA.gallery, events: real.events.length ? real.events : MOCK_WEDDING_DATA.events }
    : { ...MOCK_WEDDING_DATA, guestName: "Bapak & Ibu Tamu" };

  return (
    <>
      <SiteHeader user={session.user} />
      <KanvasProjectsHub
        previewData={previewData}
        invitationTitle={active.title}
        activeDesignId={active.activeAiDesignId ?? null}
        initialDesigns={serializedDesigns}
        initialMyTemplates={myTemplates.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }))}
        aiEnabled={aiEnabled}
      />
    </>
  );
}
