import { SiteHeader } from "@/components/site-header";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { prisma } from "@/lib/prisma";
import { getAllTemplates } from "@/lib/templates";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function AdminDashboardPage() {
  const allTemplates = getAllTemplates();
  const [userCount, adminCount, messageCount, transactionCount, latestUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.guestMessage.count(),
    prisma.transaction.count(),
    prisma.user.findMany({
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
  ]);

  const stats = {
    totalUsers: userCount,
    totalTemplates: allTemplates.length,
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

            <SectionCards stats={stats} />

            <div className="grid gap-4 px-4 lg:grid-cols-7 lg:px-6">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Grafik Trafik Kunjungan Tamu</CardTitle>
                  <CardDescription>Visualisasi data pengunjung dari undangan yang aktif</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ChartAreaInteractive />
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
