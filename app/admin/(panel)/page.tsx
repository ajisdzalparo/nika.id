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
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">Panel admin</p>
              <h1 className="mt-1 font-serif text-4xl font-medium text-[#1E1B17]">Ringkasan</h1>
              <p className="mt-1 text-[15px] text-[#6B6358]">Statistik dan pantauan sistem UNDANGIN YUK.</p>
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

            <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-7">
              {/* The chart renders its own card (title + range picker), so no extra wrapper */}
              <div className="min-w-0 @5xl/main:col-span-4">
                <ChartAreaInteractive data={traffic.series} totalViews={traffic.totalViews} />
              </div>

              <Card className="min-w-0 @5xl/main:col-span-3">
                <CardHeader>
                  <CardTitle>Pendaftar terbaru</CardTitle>
                  <CardDescription>5 akun pasangan yang terakhir mendaftar</CardDescription>
                </CardHeader>
                <CardContent>
                  {latestUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada pendaftar.</p>
                  ) : (
                    <ul className="divide-y divide-[#EDE6DA]">
                      {latestUsers.map((user) => (
                        <li key={user.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={user.image || undefined} alt="" />
                            <AvatarFallback className="bg-[#E6DECF] text-xs">{user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{user.name}</p>
                            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <time className="shrink-0 text-xs tabular-nums text-muted-foreground" dateTime={new Date(user.createdAt).toISOString()}>
                            {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(user.createdAt))}
                          </time>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
