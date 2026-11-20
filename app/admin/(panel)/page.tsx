import Link from "next/link";
import { IconArrowRight, IconReceipt } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive, type VisitorTrafficPoint } from "@/components/chart-area-interactive";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

async function loadTrafficSeries(): Promise<{ series: VisitorTrafficPoint[]; totalViews: number }> {
  const days = 90;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const [sumAgg, dailyRows] = await Promise.all([
    prisma.invitation.aggregate({ _sum: { views: true } }),
    prisma
      .$queryRaw<Array<{ day: string; device: string; cnt: bigint | number }>>`
        SELECT to_char(timezone('Asia/Jakarta', "createdAt"), 'YYYY-MM-DD') AS day,
               "device",
               COUNT(*)::bigint AS cnt
        FROM "InvitationVisit"
        WHERE "createdAt" >= ${start}
        GROUP BY 1, 2
      `
      .catch(() => [] as Array<{ day: string; device: string; cnt: bigint | number }>),
  ]);

  const buckets = new Map<string, { desktop: number; mobile: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    buckets.set(d.toISOString().slice(0, 10), { desktop: 0, mobile: 0 });
  }

  for (const row of dailyRows) {
    const entry = buckets.get(row.day);
    if (!entry) continue;
    const count = Number(row.cnt) || 0;
    if (row.device === "desktop") entry.desktop += count;
    else entry.mobile += count;
  }

  const series: VisitorTrafficPoint[] = Array.from(buckets.entries()).map(([date, counts]) => ({
    date,
    desktop: counts.desktop,
    mobile: counts.mobile,
  }));

  return { series, totalViews: sumAgg._sum.views ?? 0 };
}

export default async function AdminDashboardPage() {
  const [userCount, adminCount, catalogTemplateCount, messageCount, transactionCount, pendingProofCount, latestUsers, traffic] = await Promise.all([
    prisma.user.count({ where: { NOT: { role: { equals: "admin", mode: "insensitive" } } } }),
    prisma.user.count({ where: { role: { equals: "admin", mode: "insensitive" } } }),
    prisma.catalogTemplate.count({ where: { isActive: true } }),
    prisma.guestMessage.count(),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: "PENDING", paymentProof: { not: null } } }),
    prisma.user.findMany({
      where: { NOT: { role: { equals: "admin", mode: "insensitive" } } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    }),
    loadTrafficSeries(),
  ]);

  const stats = {
    totalUsers: userCount,
    totalTemplates: catalogTemplateCount,
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
              <p className="text-muted-foreground">Statistik dan monitoring sistem UNDANGIN YUK</p>
            </div>

            {pendingProofCount > 0 && (
              <div className="px-4 lg:px-6">
                <Link
                  href="/admin/transaksi"
                  className="flex items-center justify-between gap-4 rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-3 text-amber-950 transition hover:bg-amber-100/80"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-200/70 text-amber-900">
                      <IconReceipt size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{pendingProofCount} pengajuan pembayaran menunggu verifikasi</p>
                      <p className="text-xs text-amber-800">User sudah mengunggah bukti transfer. Klik untuk memeriksa dan mengaktifkan paket.</p>
                    </div>
                  </div>
                  <IconArrowRight size={18} className="shrink-0" />
                </Link>
              </div>
            )}

            <SectionCards stats={stats} />

            <div className="grid gap-4 px-4 lg:grid-cols-7 lg:px-6">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Grafik Trafik Kunjungan Tamu</CardTitle>
                  <CardDescription>Visualisasi data pengunjung dari undangan yang aktif</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ChartAreaInteractive data={traffic.series} totalViews={traffic.totalViews} />
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Log Aktivitas Sistem Terbaru</CardTitle>
                  <CardDescription>5 User terbaru yang mendaftar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {latestUsers.map((user) => (
                      <div key={user.id} className="flex items-center">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.image || "/avatars/01.png"} alt="Avatar" />
                          <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="ml-auto font-medium text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
