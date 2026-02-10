import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Session } from "@/lib/auth";

type AdminSession = Session & {
  user: Session["user"] & {
    role?: string;
  };
};

export default async function UsersPage() {
  // Proteksi: hanya ADMIN yang boleh akses halaman admin
  const rawHeaders = await headers();
  const session = (await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  })) as AdminSession | null;

  const role = session?.user.role;
  if (!session || role !== "ADMIN") {
    redirect("/login");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      invitationSlug: true,
      role: true,
    },
  });

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">Kelola semua pasangan yang terdaftar</p>
            </div>
          </div>

          {/* Search */}
          <div className="max-w-sm">
            <Input placeholder="Cari user..." />
          </div>

          {/* Users Table - data dari database */}
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tgl Daftar</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name ?? "-"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-sm">{user.invitationSlug ? `/${user.invitationSlug}` : "-"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm">
                        Login As
                      </Button>
                      <Button variant="outline" size="sm">
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Payment Verification Section */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Verifikasi Pembayaran</h2>
            <p className="text-muted-foreground mb-4">Belum ada pembayaran yang menunggu verifikasi</p>
          </div>
        </div>
      </div>
    </>
  );
}
