import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const rawHeaders = await headers();
  const session = await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const guest = await prisma.guest.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!guest) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await prisma.guest.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[GUEST_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
