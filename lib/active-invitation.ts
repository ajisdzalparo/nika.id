import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ACTIVE_INVITATION_COOKIE = "uy_active_invitation";

export const RESERVED_SLUGS = new Set([
  "login",
  "register",
  "verify-email",
  "verification-sent",
  "dashboard",
  "undangan",
  "editor",
  "desain-ai",
  "desain",
  "pilih-template",
  "manajemen-tamu",
  "buku-tamu",
  "pengaturan",
  "upgrade",
  "admin",
  "api",
  "preview",
  "templates",
]);

export function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function isSlugTaken(slug: string, excludeInvitationId?: string, excludeUserId?: string): Promise<boolean> {
  if (!slug || slug.length < 2 || RESERVED_SLUGS.has(slug)) return true;
  const [inv, usr] = await Promise.all([
    prisma.invitation.findFirst({
      where: { slug, ...(excludeInvitationId ? { id: { not: excludeInvitationId } } : {}) },
      select: { id: true },
    }),
    prisma.user.findFirst({
      where: {
        invitationSlug: slug,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
        ...(excludeInvitationId
          ? { NOT: { invitations: { some: { id: excludeInvitationId } } } }
          : {}),
      },
      select: { id: true },
    }),
  ]);
  return Boolean(inv || usr);
}

export async function generateUniqueSlug(baseRaw: string): Promise<string> {
  const base = sanitizeSlug(baseRaw) || "undangan";
  const candidateBase = RESERVED_SLUGS.has(base) ? `${base}-kami` : base;
  if (!(await isSlugTaken(candidateBase))) return candidateBase;
  for (let i = 0; i < 6; i++) {
    const candidate = `${candidateBase}-${Math.random().toString(36).slice(2, 6)}`;
    if (!(await isSlugTaken(candidate))) return candidate;
  }
  return `${candidateBase}-${Date.now().toString(36)}`;
}

const starterInFlight = new Map<string, Promise<Awaited<ReturnType<typeof prisma.invitation.create>>>>();

async function createStarterInvitation(userId: string) {
  const existing = await prisma.invitation.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const preferredSlug = user?.invitationSlug ? sanitizeSlug(user.invitationSlug) : "";
  const canUsePreferred =
    preferredSlug.length >= 2 &&
    !RESERVED_SLUGS.has(preferredSlug) &&
    !(await isSlugTaken(preferredSlug, undefined, userId));
  let slug = canUsePreferred ? preferredSlug : await generateUniqueSlug(user?.name || "undangan");

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.invitation.create({
        data: {
          userId,
          slug,
          title: user?.partnerName || user?.name || "Undangan Pernikahan",
          weddingDate: user?.weddingDate ?? null,
          templateSlug: user?.templateSlug ?? null,
          activeAiDesignId: user?.activeAiDesignId ?? null,
          plan: user?.plan ?? "FREE",
          planExpiresAt: user?.planExpiresAt ?? null,
          extraGuestQuota: user?.extraGuestQuota ?? 0,
          views: user?.views ?? 0,
          isPublic: true,
          data: {},
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        // Another concurrent request for the same user may have just created the starter row
        const createdByPeer = await prisma.invitation.findFirst({
          where: { userId },
          orderBy: { createdAt: "asc" },
        });
        if (createdByPeer) return createdByPeer;
        slug = await generateUniqueSlug(`${user?.name || "undangan"}-${Math.random().toString(36).slice(2, 6)}`);
        continue;
      }
      throw error;
    }
  }

  throw new Error("FAILED_CREATE_STARTER_INVITATION");
}

async function ensureStarterInvitation(userId: string) {
  const inFlight = starterInFlight.get(userId);
  if (inFlight) return inFlight;

  const promise = createStarterInvitation(userId).finally(() => {
    starterInFlight.delete(userId);
  });
  starterInFlight.set(userId, promise);
  return promise;
}

export async function getActiveInvitationIdFromCookie(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(ACTIVE_INVITATION_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

export async function getActiveInvitation(userId: string, overrideId?: string | null) {
  const targetId = overrideId || (await getActiveInvitationIdFromCookie());
  if (targetId) {
    const found = await prisma.invitation.findFirst({
      where: { id: targetId, userId },
    });
    if (found) return found;
  }
  return ensureStarterInvitation(userId);
}

export async function listUserInvitations(userId: string) {
  await ensureStarterInvitation(userId);
  return prisma.invitation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          guests: true,
          rsvps: true,
          messages: true,
        },
      },
    },
  });
}
