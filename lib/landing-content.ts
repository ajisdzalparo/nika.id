import { prisma } from "@/lib/prisma";
import { upsertSetting } from "@/lib/system-settings";
import {
  DEFAULT_LANDING_CONTENT,
  LandingContentSchema,
  type LandingContent,
} from "./landing-content-shared";

export const LANDING_CONTENT_KEY = "landing_content";

export async function getLandingContent(): Promise<LandingContent> {
  try {
    const row = await prisma.systemSetting.findUnique({
      where: { key: LANDING_CONTENT_KEY },
      select: { value: true },
    });
    if (!row?.value) return DEFAULT_LANDING_CONTENT;
    const raw = JSON.parse(row.value) as unknown;
    const parsed = LandingContentSchema.safeParse(raw);
    return parsed.success ? parsed.data : DEFAULT_LANDING_CONTENT;
  } catch {
    return DEFAULT_LANDING_CONTENT;
  }
}

export async function saveLandingContent(content: LandingContent): Promise<LandingContent> {
  const valid = LandingContentSchema.parse(content);
  await upsertSetting(LANDING_CONTENT_KEY, JSON.stringify(valid));
  return valid;
}

export async function resetLandingContent(): Promise<LandingContent> {
  await prisma.systemSetting.deleteMany({ where: { key: LANDING_CONTENT_KEY } }).catch(() => {});
  return DEFAULT_LANDING_CONTENT;
}
