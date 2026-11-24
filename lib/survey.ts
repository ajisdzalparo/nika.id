import { prisma } from "@/lib/prisma";

/**
 * Customer survey timing: it keeps coming back until answered, but never gets in the way.
 * - only for accounts that have really used the product (a few days old, or a design / guests added);
 * - once answered, ask again only after a long pause;
 * - "Nanti saja" is never final: the client asks again after a number of page actions
 *   (SURVEY_ACTIONS_BETWEEN_ASKS), so the server only decides whether the user is eligible.
 */
const DAY = 86_400_000;
export const SURVEY_MIN_ACCOUNT_AGE_DAYS = 3;
export const SURVEY_REPEAT_AFTER_DAYS = 120;

export { SURVEY_SOURCES, SURVEY_ACTIONS_BETWEEN_ASKS } from "./survey-shared";

export async function isSurveyDue(userId: string, now = new Date()): Promise<boolean> {
  const [user, lastAnswer, invitationWithWork] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true, role: true } }),
    prisma.surveyResponse.findFirst({ where: { userId, status: "TERKIRIM" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.invitation.findFirst({
      where: { userId, OR: [{ templateSlug: { not: null } }, { guests: { some: {} } }] },
      select: { id: true },
    }),
  ]);
  if (!user || user.role?.toLowerCase() === "admin") return false;

  const ageDays = (now.getTime() - user.createdAt.getTime()) / DAY;
  if (ageDays < SURVEY_MIN_ACCOUNT_AGE_DAYS && !invitationWithWork) return false;

  if (lastAnswer && (now.getTime() - lastAnswer.createdAt.getTime()) / DAY < SURVEY_REPEAT_AFTER_DAYS) return false;
  return true;
}
