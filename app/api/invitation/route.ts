import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const rawHeaders = await headers();
  const session = await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json(invitation || { data: {} });
  } catch (error) {
    console.error("[INVITATION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  const rawHeaders = await headers();
  const session = await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { data, isPublic } = await req.json();

    const invitation = await prisma.invitation.upsert({
      where: { userId: session.user.id },
      update: {
        data,
        isPublic: isPublic ?? true,
      },
      create: {
        userId: session.user.id,
        data,
        isPublic: isPublic ?? true,
      },
    });

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("[INVITATION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
