import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { SiteHeader } from "@/components/site-header";
import { auth } from "@/lib/auth";
import type { Session } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionsClient } from "@/components/admin/transaksi-client";

type AdminSession = Session & {
  user: Session["user"] & {
    role?: string;
  };
};

interface TransactionWithUser {
  id: string;
  userId: string;
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

export default async function TransaksiPage() {
  const rawHeaders = await headers();
  const session = (await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  })) as AdminSession | null;

  const role = session?.user.role;
  if (!session || role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch transactions
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          invitationSlug: true,
        },
      },
    },
    take: 50,
  });

  // Serialize dates for Client Component
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
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Transaksi</h1>
            <p className="text-muted-foreground">Verifikasi pembayaran dan pantau pendapatan</p>
          </div>

          <TransactionsClient initialTransactions={serializedTransactions} />
        </div>
      </div>
    </>
  );
}
