import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconCopy } from "@tabler/icons-react";

// Mock guest list
const guests = [
  {
    id: "1",
    name: "Ahmad Wijaya",
    link: "nika.id/budi-ani?to=Ahmad+Wijaya",
  },
  {
    id: "2",
    name: "Siti Nurhaliza",
    link: "nika.id/budi-ani?to=Siti+Nurhaliza",
  },
  {
    id: "3",
    name: "Budi Santoso",
    link: "nika.id/budi-ani?to=Budi+Santoso",
  },
];

export default function ManajemenTamuPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Tamu</h1>
            <p className="text-muted-foreground">Kelola daftar tamu yang akan diundang</p>
          </div>

          {/* Add Guest Form */}
          <Card>
            <CardHeader>
              <CardTitle>Tambah Tamu Baru</CardTitle>
              <CardDescription>Input nama tamu untuk generate link personal</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="guest-name">Nama Tamu</Label>
                    <Input id="guest-name" placeholder="Contoh: Ahmad Wijaya" />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full">Tambah Tamu</Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Bulk Import */}
          <Card>
            <CardHeader>
              <CardTitle>Import Massal</CardTitle>
              <CardDescription>Upload file Excel/CSV untuk menambahkan banyak tamu sekaligus</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input type="file" accept=".xlsx,.xls,.csv" />
              <div className="flex gap-2">
                <Button>Upload & Import</Button>
                <Button variant="outline">Download Template</Button>
              </div>
            </CardContent>
          </Card>

          {/* Guest List */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Tamu ({guests.length})</CardTitle>
              <CardDescription>Link personal untuk setiap tamu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Tamu</TableHead>
                      <TableHead>Link Personal</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell className="font-medium">{guest.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{guest.link}</code>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm">
                            <IconCopy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm">
                            Hapus
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
