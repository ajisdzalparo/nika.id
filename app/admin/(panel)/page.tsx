import Link from "next/link";
import { IconArrowRight, IconLayoutGrid, IconMessageHeart, IconReceipt, IconShieldCheck, IconUsers } from "@tabler/icons-react";
import { buttonVariants } from "@/components/ui/button";
import { Panel, StatTile } from "@/components/common/studio-ui";

const fmt = new Intl.NumberFormat("id-ID");
import { SiteHeader } from "@/components/site-header";
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
              <Panel tone="night" className="px-6 py-7 sm:px-8">
                <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(55% 80% at 90% 30%, rgba(176,138,62,.22) 0%, transparent 70%)" }} />
                <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end">
                  <div className="space-y-2">
                    <span className="inline-block rounded-md bg-[linear-gradient(120deg,#B8903F,#E6CB86_50%,#C9A24E)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1F1A14]">Panel admin</span>
                    <h1 className="uy-name-reveal font-(family-name:--font-landing-display) text-5xl leading-tight">Ringkasan</h1>
                    <p className="text-[15px] text-[#CDBF9F]">Statistik dan pantauan sistem SatuMoment.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/admin/transaksi" className={buttonVariants({ variant: "gold", className: "h-11 px-5" })}>
                      <IconReceipt size={17} /> Transaksi
                    </Link>
                    <Link
                      href="/admin/templates"
                      className={buttonVariants({ variant: "ghost", className: "h-11 rounded-full border border-white/20 px-5 text-[#F6EEDD] hover:bg-white/10 hover:text-white" })}
                    >
                      Kelola template
                    </Link>
                  </div>
                </div>
              </Panel>
            </div>

            {pendingProofCount > 0 && (
              <div className="px-4 lg:px-6">
                <Link
                  href="/admin/transaksi"
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-[#E3C77F] bg-[#F6EEDF] px-4 py-3.5 text-[#1F1A14] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-20px_rgba(26,21,16,.4)] animate-in fade-in slide-in-from-bottom-2 duration-500"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(120deg,#B8903F,#E6CB86_50%,#C9A24E)] text-[#1F1A14]">
                      <IconReceipt size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{pendingProofCount} pengajuan pembayaran menunggu verifikasi</p>
                      <p className="text-xs text-[#6B5F50]">User sudah mengunggah bukti transfer. Klik untuk memeriksa dan mengaktifkan paket.</p>
                    </div>
                  </div>
                  <IconArrowRight size={18} className="shrink-0" />
                </Link>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 px-4 sm:gap-4 md:grid-cols-3 lg:grid-cols-5 lg:px-6">
              <StatTile label="Pengguna" value={fmt.format(stats.totalUsers)} icon={IconUsers} href="/admin/users" delay={60} />
              <StatTile label="Template aktif" value={fmt.format(stats.totalTemplates)} icon={IconLayoutGrid} href="/admin/templates" delay={110} />
              <StatTile label="Ucapan tamu" value={fmt.format(stats.totalMessages)} icon={IconMessageHeart} href="/admin/moderasi" delay={160} />
              <StatTile label="Transaksi" value={fmt.format(stats.totalTransactions)} icon={IconReceipt} href="/admin/transaksi" delay={210} />
              <StatTile label="Admin" value={fmt.format(stats.totalAdmins)} icon={IconShieldCheck} delay={260} />
            </div>

            <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-7">
              {/* The chart renders its own card (title + range picker), so no extra wrapper */}
              <div className="min-w-0 @5xl/main:col-span-4">
                <ChartAreaInteractive data={traffic.series} totalViews={traffic.totalViews} />
              </div>

              <Card className="min-w-0 @5xl/main:col-span-3">
                <CardHeader>
                  <CardTitle className="font-(family-name:--font-landing-display) text-2xl font-normal">Pendaftar terbaru</CardTitle>
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
                            <AvatarFallback className="bg-[#EEE2C9] text-xs">{user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
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
