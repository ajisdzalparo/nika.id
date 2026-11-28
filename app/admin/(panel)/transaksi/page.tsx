import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";
import { TransactionsClient } from "@/components/admin/transaksi-client";
import { readPagination, readSearch, readSort } from "@/lib/pagination";

interface TransactionWithUser {
  id: string;
  userId: string;
  kind: string;
  addonUnits: number;
  plan: string | null;
  amount: number;
  status: string;
  paymentProof: string | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string | null;
    email: string;
    invitationSlug: string | null;
  };
}

export default async function TransaksiPage(props: { searchParams: Promise<{ q?: string; page?: string; limit?: string; sort?: string; dir?: string }> }) {
  const searchParams = await props.searchParams;
  const q = readSearch(searchParams.q);
  const { page, pageSize, skip, take } = readPagination(searchParams);
  const sort = readSort(searchParams, ["user", "id", "amount", "status", "createdAt"] as const);
  const orderBy: import("@prisma/client").Prisma.TransactionOrderByWithRelationInput[] = [
    ...(sort ? [sort.key === "user" ? { user: { name: sort.dir } } : { [sort.key]: sort.dir }] : []),
    { createdAt: "desc" },
  ];
  const where: import("@prisma/client").Prisma.TransactionWhereInput = q
    ? {
        OR: [
          { id: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};
  const [transactions, totalCount] = await Promise.all([
    prisma.transaction.findMany({
    where,
    orderBy,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          invitationSlug: true,
        },
      },
    },
    skip,
    take,
  }),
    prisma.transaction.count({ where }),
  ]);

  const serializedTransactions = transactions.map((t: TransactionWithUser) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-1">
            <h1 className="font-serif text-4xl font-medium text-[#1F1A14]">Transaksi</h1>
            <p className="text-muted-foreground">Verifikasi pembayaran dan pantau pendapatan</p>
          </div>

          <TransactionsClient
            initialTransactions={serializedTransactions}
            currentPage={page}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={Math.max(1, Math.ceil(totalCount / pageSize))}
          />
        </div>
      </div>
    </>
  );
}
