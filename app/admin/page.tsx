import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { SiteHeader } from "@/components/site-header";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Session } from "@/lib/auth";

type AdminSession = Session & {
  user: Session["user"] & {
    role?: string;
  };
};

export default async function AdminDashboardPage() {
  // Hanya ADMIN yang boleh akses dashboard admin
  const rawHeaders = await headers();
  const session = (await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  })) as AdminSession | null;

  const role = session?.user.role;
  if (!session || role !== "ADMIN") {
    redirect("/login");
  }

  const [userCount, adminCount, templateCount, messageCount, transactionCount, latestUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.template.count(),
    prisma.guestMessage.count(),
    prisma.transaction.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    }),
  ]);

  const stats = {
    totalUsers: userCount,
    totalTemplates: templateCount,
    totalMessages: messageCount,
    totalTransactions: transactionCount,
    totalAdmins: adminCount,
  };

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
              <p className="text-muted-foreground">Statistik dan monitoring sistem nika.id</p>
            </div>

            {/* Stats Cards */}
            <SectionCards stats={stats} />

            {/* Traffic Chart */}
            <div className="px-4 lg:px-6">
              <div className="rounded-lg border bg-card p-4">
                <h2 className="text-xl font-semibold mb-4">Grafik Trafik Kunjungan Tamu</h2>
                <ChartAreaInteractive />
              </div>
            </div>

            {/* Recent Activity Log - data dari user terbaru */}
            <div className="px-4 lg:px-6">
              <div className="rounded-lg border bg-card p-4">
                <h2 className="text-xl font-semibold mb-4">Log Aktivitas Sistem Terbaru</h2>
                <div className="space-y-3">
                  {latestUsers.map((user: { id: string; name: string | null; email: string; createdAt: Date }) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{user.name ?? user.email}</p>
                        <p className="text-sm text-muted-foreground">User baru terdaftar</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{user.createdAt.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
