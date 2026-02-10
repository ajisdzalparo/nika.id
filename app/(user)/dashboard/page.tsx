import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { IconCopy, IconEye, IconUsers, IconMessage } from "@tabler/icons-react";

export default function UserDashboardPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Kelola undangan pernikahan Anda</p>
          </div>

          {/* Status Undangan */}
          <Card>
            <CardHeader>
              <CardTitle>Status Undangan</CardTitle>
              <CardDescription>Informasi undangan Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>Publik</Badge>
                </div>
                <Button asChild>
                  <Link href="/editor">Edit Undangan</Link>
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Link Undangan Anda</p>
                <div className="flex gap-2">
                  <code className="flex-1 px-4 py-2 rounded-lg bg-muted font-mono text-sm">nika.id/budi-ani</code>
                  <Button variant="outline" size="icon">
                    <IconCopy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ringkasan RSVP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Kunjungan</CardTitle>
                <IconEye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">+20% dari minggu lalu</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Konfirmasi Hadir</CardTitle>
                <IconUsers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">Dari 200 tamu diundang</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ucapan & Doa</CardTitle>
                <IconMessage className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-muted-foreground">Ucapan dari tamu</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
              <CardDescription>Kelola undangan Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild variant="outline" className="h-auto py-4">
                  <Link href="/editor" className="flex flex-col items-start">
                    <span className="font-semibold">Edit Data Undangan</span>
                    <span className="text-sm text-muted-foreground">Update info mempelai, acara, dan galeri</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4">
                  <Link href="/buku-tamu" className="flex flex-col items-start">
                    <span className="font-semibold">Lihat Daftar Hadir</span>
                    <span className="text-sm text-muted-foreground">Cek siapa saja yang konfirmasi hadir</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4">
                  <Link href="/manajemen-tamu" className="flex flex-col items-start">
                    <span className="font-semibold">Kelola Tamu</span>
                    <span className="text-sm text-muted-foreground">Tambah atau edit daftar tamu undangan</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4">
                  <Link href="/pilih-template" className="flex flex-col items-start">
                    <span className="font-semibold">Ganti Template</span>
                    <span className="text-sm text-muted-foreground">Pilih desain undangan yang berbeda</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
