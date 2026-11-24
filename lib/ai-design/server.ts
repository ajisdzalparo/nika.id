import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPlanLimits, type PlanType } from "@/lib/limits";
import { normalizeTheme } from "./color";
import type { AiTheme } from "./schema";

export interface AiQuota {
  used: number;
  total: number;
  planRemaining: number;
  topupCredits: number;
  remaining: number;
}

export class AiQuotaExceededError extends Error {
  constructor(
    message: string,
    public quota: AiQuota,
  ) {
    super(message);
  }
}

export async function getAiQuota(
  userId: string,
  plan: PlanType,
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<AiQuota> {
  const [agg, user, paidInvitations] = await Promise.all([
    client.aiDesign.aggregate({
      where: { userId, source: { in: ["AI", "AI_ORNAMENT"] } },
      _sum: { planCreditsUsed: true },
    }),
    client.user.findUnique({ where: { id: userId }, select: { aiCredits: true } }),
    // Invitations the user actually paid a plan for (agency-quota activations have no PLAN transaction,
    // so they don't multiply the free plan quota).
    client.invitation.findMany({
      where: { userId, plan: { not: "FREE" }, transactions: { some: { kind: "PLAN", status: "SUCCESS" } } },
      select: { plan: true },
    }),
  ]);
  const used = agg._sum.planCreditsUsed ?? 0;
  // Plan credits are pooled per account: each purchased plan adds its quota (akad + resepsi = 2 paket).
  const purchased = paidInvitations.reduce((sum, inv) => sum + getPlanLimits(inv.plan).aiDesignQuota, 0);
  const total = Math.max(getPlanLimits(plan).aiDesignQuota, purchased);
  const planRemaining = Math.max(0, total - used);
  const topupCredits = Math.max(0, user?.aiCredits ?? 0);
  return {
    used,
    total,
    planRemaining,
    topupCredits,
    remaining: planRemaining + topupCredits,
  };
}

async function persistAiCreditDesign(input: {
  userId: string;
  plan: PlanType;
  source: "AI" | "AI_ORNAMENT";
  prompt: string;
  theme: Prisma.InputJsonValue;
  cost: number;
}) {
  return prisma.$transaction(async (tx) => {
    // Serialize credit deduction per user so concurrent requests cannot overspend plan quota.
    await tx.$executeRaw`SELECT id FROM "User" WHERE id = ${input.userId} FOR UPDATE`;

    const quota = await getAiQuota(input.userId, input.plan, tx);
    if (quota.remaining < input.cost) {
      throw new AiQuotaExceededError(
        quota.remaining === 0
          ? "Kredit desain AI Anda habis."
          : `Generate ini membutuhkan ${input.cost} kredit, tersisa ${quota.remaining} kredit.`,
        quota,
      );
    }

    const planCovered = Math.min(quota.planRemaining, input.cost);
    const topupNeeded = input.cost - planCovered;

    if (topupNeeded > 0) {
      const dec = await tx.user.updateMany({
        where: { id: input.userId, aiCredits: { gte: topupNeeded } },
        data: { aiCredits: { decrement: topupNeeded } },
      });
      if (dec.count === 0) {
        throw new AiQuotaExceededError("Kredit desain AI Anda tidak mencukupi.", quota);
      }
    }

    const design = await tx.aiDesign.create({
      data: {
        userId: input.userId,
        source: input.source,
        prompt: input.prompt,
        theme: input.theme,
        creditsUsed: input.cost,
        planCreditsUsed: planCovered,
      },
    });

    const nextQuota: AiQuota = {
      used: quota.used + planCovered,
      total: quota.total,
      planRemaining: quota.planRemaining - planCovered,
      topupCredits: quota.topupCredits - topupNeeded,
      remaining: quota.remaining - input.cost,
    };

    return { design, quota: nextQuota };
  });
}

/**
 * Persists a newly generated AI design and deducts `cost` credits atomically.
 * Uses plan quota first, then falls back to the user's top-up `aiCredits` balance.
 */
export async function saveGeneratedAiDesign(input: {
  userId: string;
  plan: PlanType;
  prompt: string;
  theme: AiTheme;
  cost: number;
}) {
  return persistAiCreditDesign({
    ...input,
    source: "AI",
    theme: input.theme as unknown as Prisma.InputJsonValue,
  });
}

/** Deducts 1 credit for generating an AI ornament SVG. */
export async function consumeAiOrnamentCredit(input: {
  userId: string;
  plan: PlanType;
  prompt: string;
  svg: string;
}) {
  return persistAiCreditDesign({
    userId: input.userId,
    plan: input.plan,
    source: "AI_ORNAMENT",
    prompt: input.prompt,
    theme: { ornamentSvg: input.svg } as unknown as Prisma.InputJsonValue,
    cost: 1,
  });
}

/** Loads the theme of the user's active AI design, or null if they have none. */
export async function getActiveAiTheme(activeAiDesignId: string | null | undefined): Promise<AiTheme | null> {
  if (!activeAiDesignId) return null;
  const design = await prisma.aiDesign.findUnique({ where: { id: activeAiDesignId } });
  return design ? normalizeTheme(design.theme) : null;
}
