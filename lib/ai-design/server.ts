import { prisma } from "@/lib/prisma";
import { getPlanLimits, type PlanType } from "@/lib/limits";
import { normalizeTheme } from "./color";
import type { AiTheme } from "./schema";

export async function getAiQuota(userId: string, plan: PlanType) {
  const used = await prisma.aiDesign.count({ where: { userId, source: "AI" } });
  const total = getPlanLimits(plan).aiDesignQuota;
  return { used, total, remaining: Math.max(0, total - used) };
}

/** Loads the theme of the user's active AI design, or null if they have none. */
export async function getActiveAiTheme(activeAiDesignId: string | null | undefined): Promise<AiTheme | null> {
  if (!activeAiDesignId) return null;
  const design = await prisma.aiDesign.findUnique({ where: { id: activeAiDesignId } });
  return design ? normalizeTheme(design.theme) : null;
}
