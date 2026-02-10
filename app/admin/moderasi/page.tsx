import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";
import type { Session } from "@/lib/auth";

type AdminSession = Session & {
  user: Session["user"] & {
    role?: string;
  };
};

// Masih menggunakan data mock untuk ucapan tamu.
const guestMessages = [
  {
    id: "1",
    guest: "Ahmad",
    invitation: "budi-ani",
    message: "Selamat menempuh hidup baru!",
    timestamp: "2024-02-10 10:30",
    status: "approved",
  },
  {
    id: "2",
    guest: "Siti",
    invitation: "chandra-dewi",
    message: "Bahagia selalu untuk kalian berdua",
    timestamp: "2024-02-10 11:15",
    status: "pending",
  },
];

export default async function ModerasiPage() {
  const rawHeaders = await headers();
  const session = (await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  })) as AdminSession | null;

  const role = session?.user.role;
  if (!session || role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Moderasi Konten</h1>
            <p className="text-muted-foreground">Kelola ucapan tamu dan audit media</p>
          </div>

          <Tabs defaultValue="messages" className="w-full">
            <TabsList>
              <TabsTrigger value="messages">Ucapan Tamu</TabsTrigger>
              <TabsTrigger value="media">Audit Media</TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="space-y-4">
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Tamu</TableHead>
                      <TableHead>Undangan</TableHead>
                      <TableHead>Ucapan</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guestMessages.map((msg) => (
                      <TableRow key={msg.id}>
                        <TableCell className="font-medium">{msg.guest}</TableCell>
                        <TableCell className="font-mono text-sm">/{msg.invitation}</TableCell>
                        <TableCell>{msg.message}</TableCell>
                        <TableCell>{msg.timestamp}</TableCell>
                        <TableCell>
                          <Badge variant={msg.status === "approved" ? "default" : "secondary"}>{msg.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm">
                            Approve
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
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">Statistik Penyimpanan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Total Storage</p>
                    <p className="text-2xl font-bold">2.4 GB</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Storage Terpakai</p>
                    <p className="text-2xl font-bold">1.8 GB</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Storage Tersedia</p>
                    <p className="text-2xl font-bold">600 MB</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
