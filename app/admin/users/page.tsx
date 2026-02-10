import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Session } from "@/lib/auth";
import { UsersClient, type User } from "@/components/admin/users-client";

type AdminSession = Session & {
  user: Session["user"] & {
    role?: string;
  };
};

export default async function UsersPage(props: { searchParams: Promise<{ q?: string; page?: string; limit?: string }> }) {
  const searchParams = await props.searchParams;
  const q = searchParams.q || "";
  const page = parseInt(searchParams.page || "1");
  const limit = parseInt(searchParams.limit || "10");
  const skip = (page - 1) * limit;

  // Proteksi: hanya ADMIN yang boleh akses halaman admin
  const rawHeaders = await headers();
  const session = (await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  })) as AdminSession | null;

  const role = session?.user.role;
  if (!session || role !== "ADMIN") {
    redirect("/login");
  }

  // Filter query
  const where: import("@prisma/client").Prisma.UserWhereInput = {};
  if (q) {
    where.OR = [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { invitationSlug: { contains: q, mode: "insensitive" } }, { partnerName: { contains: q, mode: "insensitive" } }];
  }

  // Fetch users with pagination and search
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        template: {
          select: {
            name: true,
          },
        },
      },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // Serialize dates for Client Component
  const serializedUsers = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    weddingDate: user.weddingDate?.toISOString() || null,
  }));

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">Kelola semua pasangan yang terdaftar</p>
            </div>
          </div>

          <UsersClient initialUsers={serializedUsers as User[]} totalPages={totalPages} currentPage={page} totalCount={totalCount} />

          {/* Payment Verification Section (Placeholder for Phase 6) */}
          <div className="rounded-lg border bg-card p-6 mt-8">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">Verifikasi Pembayaran</h2>
            <p className="text-sm text-muted-foreground mb-4">Daftar transaksi yang memerlukan persetujuan admin akan muncul di sini.</p>
            <div className="flex items-center justify-center p-12 border border-dashed rounded-lg bg-muted/30">
              <span className="text-sm text-muted-foreground italic">Belum ada pembayaran yang menunggu verifikasi</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
