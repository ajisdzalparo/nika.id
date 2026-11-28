import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { UsersClient, type User } from "@/components/admin/users-client";
import { readPagination, readSearch, readSort } from "@/lib/pagination";

export default async function UsersPage(props: { searchParams: Promise<{ q?: string; page?: string; limit?: string; tipe?: string; sort?: string; dir?: string }> }) {
  const [searchParams, session] = await Promise.all([props.searchParams, getSession(undefined, "admin")]);
  const q = readSearch(searchParams.q);
  const tipe = searchParams.tipe === "agency" ? "agency" : "all";
  const { page, pageSize: limit, skip } = readPagination(searchParams);
  const sort = readSort(searchParams, ["name", "weddingDate", "templateSlug", "role"] as const);
  const orderBy: import("@prisma/client").Prisma.UserOrderByWithRelationInput[] = [
    // `nulls` is only valid on optional columns (role is required)
    ...(sort ? [sort.key === "role" ? { role: sort.dir } : { [sort.key]: { sort: sort.dir, nulls: "last" as const } }] : []),
    { createdAt: "desc" },
  ];

  // Filter query
  const where: import("@prisma/client").Prisma.UserWhereInput = {};
  if (tipe === "agency") {
    where.accountType = "AGENCY";
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { invitationSlug: { contains: q, mode: "insensitive" } },
      { partnerName: { contains: q, mode: "insensitive" } },
      { agencyName: { contains: q, mode: "insensitive" } },
    ];
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

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
              <h1 className="font-serif text-4xl font-medium text-[#1F1A14]">Pengguna</h1>
              <p className="text-muted-foreground">Kelola semua pasangan yang terdaftar</p>
            </div>
          </div>

          <UsersClient initialUsers={serializedUsers as User[]} totalPages={totalPages} currentPage={page} totalCount={totalCount} pageSize={limit} currentUserId={session?.user?.id} />

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
