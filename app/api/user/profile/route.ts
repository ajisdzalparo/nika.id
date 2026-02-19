/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { hash } from "bcryptjs";

export async function PUT(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();
    const { name, password, email } = body;

    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email; // Note: Changing email might require re-verification in a real app
    if (password) {
      data.password = await hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
    });

    // Don't return the password
    const { password: _, ...userWithoutPassword } = user as any;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
