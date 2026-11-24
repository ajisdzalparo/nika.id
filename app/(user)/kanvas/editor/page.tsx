import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { CanvasStudio } from "@/components/user/canvas-studio";
import { getSession } from "@/lib/auth-helpers";
import { getActiveInvitation } from "@/lib/active-invitation";
import { normalizeTheme } from "@/lib/ai-design/color";
import { AI_THEME_PRESETS } from "@/lib/ai-design/presets";
import { getAiQuota } from "@/lib/ai-design/server";
import { BLANK_CANVAS_THEME, DEFAULT_AI_THEME } from "@/lib/ai-design/schema";
import { MOCK_WEDDING_DATA } from "@/lib/constants/mock-wedding-data";
import type { PlanType } from "@/lib/limits";
import { prisma } from "@/lib/prisma";
import { mapInvitationToWeddingData } from "@/lib/utils/wedding-mapper";
import type { WeddingData } from "@/types/wedding";

export default async function KanvasEditorPage({
  searchParams,
}: {
  searchParams?: Promise<{ designId?: string; blank?: string; preset?: string }>;
}) {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");

  const resolvedParams = searchParams ? await searchParams : {};
  const active = await getActiveInvitation(session.user.id);

  const [designs, quota, myTemplates] = await Promise.all([
    prisma.aiDesign.findMany({
      where: { userId: session.user.id, source: { in: ["AI", "CANVAS", "CATALOG"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    getAiQuota(session.user.id, active.plan as PlanType),
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
  ]);

  const serializedDesigns = designs.map((d) => ({
    id: d.id,
    source: d.source,
    prompt: d.prompt,
    createdAt: d.createdAt.toISOString(),
    theme: normalizeTheme(d.theme),
  }));

  const startBlank = resolvedParams?.blank === "1" || resolvedParams?.blank === "true";
  const presetKey = resolvedParams?.preset;
  const presetItem = presetKey ? AI_THEME_PRESETS[presetKey] : undefined;
  const targetId = startBlank || presetItem ? null : (resolvedParams?.designId || null);
  const initialDesign = targetId ? serializedDesigns.find((d) => d.id === targetId) ?? null : null;

  const initialTheme = startBlank
    ? BLANK_CANVAS_THEME
    : presetItem
      ? presetItem.theme
      : (initialDesign?.theme ?? DEFAULT_AI_THEME);

  const raw = (active.data ?? {}) as Record<string, unknown>;
  const hasCouple = Boolean((raw.groom as { name?: string; nickname?: string })?.nickname || (raw.groom as { name?: string })?.name);
  const real = mapInvitationToWeddingData(raw, "Bapak & Ibu Tamu", active.weddingDate ?? undefined);
  const previewData: WeddingData = hasCouple
    ? { ...real, gallery: real.gallery.length ? real.gallery : MOCK_WEDDING_DATA.gallery, events: real.events.length ? real.events : MOCK_WEDDING_DATA.events }
    : { ...MOCK_WEDDING_DATA, guestName: "Bapak & Ibu Tamu" };

  return (
    <>
      <SiteHeader user={session.user} />
      <CanvasStudio
        previewData={previewData}
        invitationTitle={active.title}
        initialTheme={initialTheme}
        initialDesignId={startBlank || presetItem ? null : initialDesign?.source === "CANVAS" ? initialDesign.id : null}
        initialDesigns={serializedDesigns}
        initialQuota={quota}
        initialMyTemplates={myTemplates.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }))}
      />
    </>
  );
}
