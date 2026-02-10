import { SiteHeader } from "@/components/site-header";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";

// Mock data for admin dashboard
const recentActivity = [
  {
    id: "1",
    user: "Budi & Ani",
    action: "Membuat undangan baru",
    timestamp: "2 menit yang lalu",
    status: "success",
  },
  {
    id: "2",
    user: "Chandra & Dewi",
    action: "Upgrade ke paket Pro",
    timestamp: "15 menit yang lalu",
    status: "success",
  },
  {
    id: "3",
    user: "Eko & Fitri",
    action: "Publish undangan",
    timestamp: "1 jam yang lalu",
    status: "success",
  },
];

export default function AdminDashboardPage() {
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
            <SectionCards />

            {/* Traffic Chart */}
            <div className="px-4 lg:px-6">
              <div className="rounded-lg border bg-card p-4">
                <h2 className="text-xl font-semibold mb-4">Grafik Trafik Kunjungan Tamu</h2>
                <ChartAreaInteractive />
              </div>
            </div>

            {/* Recent Activity Log */}
            <div className="px-4 lg:px-6">
              <div className="rounded-lg border bg-card p-4">
                <h2 className="text-xl font-semibold mb-4">Log Aktivitas Sistem Terbaru</h2>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{activity.user}</p>
                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
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
