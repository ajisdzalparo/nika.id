import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data
const attendees = [
  { id: "1", name: "Ahmad", status: "Hadir", guests: 2, timestamp: "2024-02-10 10:30" },
  { id: "2", name: "Siti", status: "Hadir", guests: 1, timestamp: "2024-02-10 11:15" },
  { id: "3", name: "Budi", status: "Tidak Hadir", guests: 0, timestamp: "2024-02-10 12:00" },
];

const messages = [
  {
    id: "1",
    name: "Ahmad",
    message: "Selamat menempuh hidup baru! Bahagia selalu.",
    timestamp: "2024-02-10 10:30",
  },
  {
    id: "2",
    name: "Siti",
    message: "Semoga langgeng sampai kakek nenek!",
    timestamp: "2024-02-10 11:15",
  },
];

export default function BukuTamuPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Buku Tamu & RSVP</h1>
              <p className="text-muted-foreground">Lihat konfirmasi kehadiran dan ucapan dari tamu</p>
            </div>
            <Button>Ekspor Data</Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Konfirmasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Akan Hadir</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">142</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Tidak Hadir</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">14</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="attendance" className="w-full">
            <TabsList>
              <TabsTrigger value="attendance">Daftar Hadir</TabsTrigger>
              <TabsTrigger value="messages">Daftar Ucapan</TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="space-y-4">
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Tamu</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Jumlah Tamu</TableHead>
                      <TableHead>Waktu Konfirmasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendees.map((attendee) => (
                      <TableRow key={attendee.id}>
                        <TableCell className="font-medium">{attendee.name}</TableCell>
                        <TableCell>
                          <Badge variant={attendee.status === "Hadir" ? "default" : "secondary"}>{attendee.status}</Badge>
                        </TableCell>
                        <TableCell>{attendee.guests} orang</TableCell>
                        <TableCell>{attendee.timestamp}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="space-y-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <Card key={msg.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{msg.name}</CardTitle>
                        <span className="text-sm text-muted-foreground">{msg.timestamp}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{msg.message}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
