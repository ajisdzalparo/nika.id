import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock user data
const users = [
  {
    id: "1",
    name: "Budi & Ani",
    email: "budi@email.com",
    subscription: "Pro",
    registeredAt: "2024-01-15",
    invitationSlug: "budi-ani",
  },
  {
    id: "2",
    name: "Chandra & Dewi",
    email: "chandra@email.com",
    subscription: "Free",
    registeredAt: "2024-02-01",
    invitationSlug: "chandra-dewi",
  },
  {
    id: "3",
    name: "Eko & Fitri",
    email: "eko@email.com",
    subscription: "Pro",
    registeredAt: "2024-02-05",
    invitationSlug: "eko-fitri",
  },
];

export default function UsersPage() {
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

          {/* Users Table */}
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Tgl Daftar</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.subscription === "Pro" ? "default" : "secondary"}>{user.subscription}</Badge>
                    </TableCell>
                    <TableCell>{user.registeredAt}</TableCell>
                    <TableCell className="font-mono text-sm">/{user.invitationSlug}</TableCell>
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
