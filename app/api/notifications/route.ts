import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { listNotifications, markNotificationsRead } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

function resolvePortal(request: Request): "admin" | "user" {
  const { searchParams } = new URL(request.url);
  return searchParams.get("portal") === "admin" ? "admin" : "user";
}

export async function GET(request: Request) {
  try {
    const portal = resolvePortal(request);
    const session = await getSession(request, portal);
    if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    if (portal === "admin" && session.user.role?.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const userRow = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true },
    });

    const result = await listNotifications({
      userId: session.user.id,
      portal,
      userCreatedAt: userRow?.createdAt,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const portal = resolvePortal(request);
    const session = await getSession(request, portal);
    if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    if (portal === "admin" && session.user.role?.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const notificationId = typeof body?.id === "string" ? body.id : undefined;

    const userRow = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true },
    });

    await markNotificationsRead({
      userId: session.user.id,
      portal,
      notificationId,
      userCreatedAt: userRow?.createdAt,
    });

    const result = await listNotifications({
      userId: session.user.id,
      portal,
      userCreatedAt: userRow?.createdAt,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[NOTIFICATIONS_PATCH]", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
