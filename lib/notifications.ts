import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export type NotificationAudience = "USER" | "ADMIN" | "ALL_USERS";
export type NotificationCategory = "TEMPLATE" | "TRANSACTION" | "RSVP" | "SYSTEM";

export interface NotificationItem {
  id: string;
  audience: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

interface CreateNotificationInput {
  audience: NotificationAudience;
  userId?: string | null;
  type: NotificationCategory;
  title: string;
  message: string;
  href?: string | null;
}

type PrismaNotificationDelegate = {
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
  findMany: (args: Record<string, unknown>) => Promise<
    Array<{
      id: string;
      audience: string;
      type: string;
      title: string;
      message: string;
      href: string | null;
      createdAt: Date;
      reads: Array<{ userId: string }>;
    }>
  >;
};

type PrismaReadDelegate = {
  createMany: (args: { data: Array<{ notificationId: string; userId: string }>; skipDuplicates?: boolean }) => Promise<unknown>;
};

function getDelegates() {
  const p = prisma as unknown as {
    notification?: PrismaNotificationDelegate;
    notificationRead?: PrismaReadDelegate;
  };
  return { notification: p.notification, notificationRead: p.notificationRead };
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    const { notification } = getDelegates();
    if (notification) {
      await notification.create({
        data: {
          audience: input.audience,
          userId: input.userId ?? null,
          type: input.type,
          title: input.title.slice(0, 140),
          message: input.message.slice(0, 320),
          href: input.href ?? null,
        },
      });
      return;
    }

    const id = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "Notification" ("id", "audience", "userId", "type", "title", "message", "href", "createdAt")
      VALUES (${id}, ${input.audience}, ${input.userId ?? null}, ${input.type}, ${input.title.slice(0, 140)}, ${input.message.slice(0, 320)}, ${input.href ?? null}, NOW())
    `;
  } catch (err) {
    console.error("Notification create skipped:", err);
  }
}

export async function listNotifications(params: {
  userId: string;
  portal: "admin" | "user";
  userCreatedAt?: Date;
}): Promise<{ items: NotificationItem[]; unreadCount: number }> {
  const { userId, portal, userCreatedAt } = params;
  const since = userCreatedAt ?? new Date(Date.now() - 30 * 86_400_000);
  const { notification } = getDelegates();

  if (notification) {
    const where =
      portal === "admin"
        ? { audience: "ADMIN" }
        : {
            OR: [
              { audience: "USER", userId },
              { audience: "ALL_USERS", createdAt: { gte: since } },
            ],
          };

    const rows = await notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        reads: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    const items: NotificationItem[] = rows.map((r) => ({
      id: r.id,
      audience: r.audience,
      type: r.type,
      title: r.title,
      message: r.message,
      href: r.href,
      read: r.reads.length > 0,
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      items,
      unreadCount: items.filter((i) => !i.read).length,
    };
  }

  // Raw SQL fallback if PrismaClient in running process hasn't regenerated yet
  const rawRows =
    portal === "admin"
      ? await prisma.$queryRaw<
          Array<{
            id: string;
            audience: string;
            type: string;
            title: string;
            message: string;
            href: string | null;
            createdAt: Date;
            is_read: boolean;
          }>
        >`
          SELECT n."id", n."audience", n."type", n."title", n."message", n."href", n."createdAt",
                 (r."userId" IS NOT NULL) AS is_read
          FROM "Notification" n
          LEFT JOIN "NotificationRead" r ON r."notificationId" = n."id" AND r."userId" = ${userId}
          WHERE n."audience" = 'ADMIN'
          ORDER BY n."createdAt" DESC
          LIMIT 30
        `
      : await prisma.$queryRaw<
          Array<{
            id: string;
            audience: string;
            type: string;
            title: string;
            message: string;
            href: string | null;
            createdAt: Date;
            is_read: boolean;
          }>
        >`
          SELECT n."id", n."audience", n."type", n."title", n."message", n."href", n."createdAt",
                 (r."userId" IS NOT NULL) AS is_read
          FROM "Notification" n
          LEFT JOIN "NotificationRead" r ON r."notificationId" = n."id" AND r."userId" = ${userId}
          WHERE (n."audience" = 'USER' AND n."userId" = ${userId})
             OR (n."audience" = 'ALL_USERS' AND n."createdAt" >= ${since})
          ORDER BY n."createdAt" DESC
          LIMIT 30
        `;

  const items: NotificationItem[] = rawRows.map((r) => ({
    id: r.id,
    audience: r.audience,
    type: r.type,
    title: r.title,
    message: r.message,
    href: r.href,
    read: Boolean(r.is_read),
    createdAt: new Date(r.createdAt).toISOString(),
  }));

  return {
    items,
    unreadCount: items.filter((i) => !i.read).length,
  };
}

export async function markNotificationsRead(params: {
  userId: string;
  portal: "admin" | "user";
  notificationId?: string;
  userCreatedAt?: Date;
}): Promise<void> {
  const { userId, portal, notificationId, userCreatedAt } = params;
  const { notificationRead } = getDelegates();

  if (notificationId) {
    if (notificationRead) {
      await notificationRead.createMany({
        data: [{ notificationId, userId }],
        skipDuplicates: true,
      });
    } else {
      await prisma.$executeRaw`
        INSERT INTO "NotificationRead" ("notificationId", "userId", "readAt")
        VALUES (${notificationId}, ${userId}, NOW())
        ON CONFLICT ("notificationId", "userId") DO NOTHING
      `;
    }
    return;
  }

  const { items } = await listNotifications({ userId, portal, userCreatedAt });
  const unreadIds = items.filter((i) => !i.read).map((i) => i.id);
  if (unreadIds.length === 0) return;

  if (notificationRead) {
    await notificationRead.createMany({
      data: unreadIds.map((id) => ({ notificationId: id, userId })),
      skipDuplicates: true,
    });
    return;
  }

  for (const id of unreadIds) {
    await prisma.$executeRaw`
      INSERT INTO "NotificationRead" ("notificationId", "userId", "readAt")
      VALUES (${id}, ${userId}, NOW())
      ON CONFLICT ("notificationId", "userId") DO NOTHING
    `;
  }
}
