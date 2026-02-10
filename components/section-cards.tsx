import { IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface SectionCardsProps {
  stats: {
    totalUsers: number;
    totalTemplates: number;
    totalMessages: number;
    totalTransactions: number;
    totalAdmins: number;
  };
}

export function SectionCards({ stats }: SectionCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Pasangan</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{stats.totalUsers.toLocaleString()}</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Aktif
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">User terdaftar di sistem</div>
          <div className="text-muted-foreground">Akumulasi sejak platform rilis</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Template Desain</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{stats.totalTemplates.toLocaleString()}</CardTitle>
          <CardAction>
            <Badge variant="outline">Asset</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Koleksi tema undangan</div>
          <div className="text-muted-foreground">Siap digunakan oleh pasangan</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Ucapan Tamu</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{stats.totalMessages.toLocaleString()}</CardTitle>
          <CardAction>
            <Badge variant="outline">Interaksi</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Pesan & Doa dari tamu</div>
          <div className="text-muted-foreground">Memerlukan moderasi aktif</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Transaksi Masuk</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{stats.totalTransactions.toLocaleString()}</CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
              Revenue
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Total pembayaran user</div>
          <div className="text-muted-foreground">Perlu verifikasi bukti bayar</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Admin</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{stats.totalAdmins.toLocaleString()}</CardTitle>
          <CardAction>
            <Badge variant="outline">Staff</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Pengelola sistem</div>
          <div className="text-muted-foreground">Hak akses penuh dashboard</div>
        </CardFooter>
      </Card>
    </div>
  );
}
