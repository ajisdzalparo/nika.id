import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";

const UpdateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Nama tidak boleh kosong").max(100).optional(),
    password: z.string().min(8, "Password minimal 8 karakter").max(128).optional(),
  })
  .refine((d) => d.name !== undefined || d.password !== undefined, {
    message: "Tidak ada data yang diperbarui",
  });

export async function PUT(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const parsed = UpdateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 },
      );
    }

    const { name, password } = parsed.data;

    let updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true },
    });

    if (name !== undefined) {
      updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { name },
        select: { id: true, name: true, email: true, image: true },
      });
    }

    if (password !== undefined) {
      const passwordHash = await hashPassword(password);
      const existingCredential = await prisma.account.findFirst({
        where: { userId: session.user.id, providerId: "credential" },
        select: { id: true },
      });

      if (existingCredential) {
        await prisma.account.update({
          where: { id: existingCredential.id },
          data: { password: passwordHash },
        });
      } else {
        await prisma.account.create({
          data: {
            id: crypto.randomUUID(),
            accountId: session.user.id,
            providerId: "credential",
            userId: session.user.id,
            password: passwordHash,
          },
        });
      }
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    return apiErrorResponse(error, "Gagal memperbarui profil");
  }
}
