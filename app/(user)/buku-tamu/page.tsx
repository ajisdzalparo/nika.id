import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default async function BukuTamuPage() {
  const rawHeaders = await headers();
  const session = await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  });

  if (!session) {
    redirect("/login");
  }

  const [attendees, messages] = await Promise.all([
    prisma.rSVP.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.guestMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const stats = {
    total: attendees.length,
    present: attendees.filter((a) => a.attendance === "Hadir").length,
    absent: attendees.filter((a) => a.attendance === "Tidak Hadir").length,
  };

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col bg-gray-50/50">
        <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Buku Tamu & RSVP</h1>
              <p className="text-muted-foreground">Monitor kehadiran dan kumpulan doa dari tamu Anda.</p>
            </div>
            <Button className="rounded-xl px-6 bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-100">Ekspor Data</Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-3 px-6 pt-6">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Respon</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 mt-[-4px]">
                <div className="text-3xl font-black text-gray-900">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg border-l-4 border-l-green-500">
              <CardHeader className="pb-3 px-6 pt-6">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Konfirmasi Hadir</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 mt-[-4px]">
                <div className="text-3xl font-black text-green-600">{stats.present}</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg border-l-4 border-l-red-500">
              <CardHeader className="pb-3 px-6 pt-6">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Berhalangan Hadir</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 mt-[-4px]">
                <div className="text-3xl font-black text-red-600">{stats.absent}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="attendance" className="w-full">
            <TabsList className="bg-gray-100 p-1 rounded-2xl h-auto mb-6">
              <TabsTrigger value="attendance" className="rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
                Konfirmasi Kehadiran
              </TabsTrigger>
              <TabsTrigger value="messages" className="rounded-xl py-3 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
                Kumpulan Doa & Ucapan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attendance" className="space-y-4">
              <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-bold text-gray-900 px-6 h-12">Nama Tamu</TableHead>
                      <TableHead className="font-bold text-gray-900 h-12">Status</TableHead>
                      <TableHead className="font-bold text-gray-900 h-12">Jumlah Tamu</TableHead>
                      <TableHead className="font-bold text-gray-900 h-12 text-right px-6">Waktu Konfirmasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendees.map((attendee) => (
                      <TableRow key={attendee.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-semibold text-gray-900 px-6 py-4">{attendee.guestName}</TableCell>
                        <TableCell>
                          <Badge variant={attendee.attendance === "Hadir" ? "default" : "secondary"} className={attendee.attendance === "Hadir" ? "bg-green-500 hover:bg-green-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}>
                            {attendee.attendance}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{attendee.guests} orang</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground px-6">{format(new Date(attendee.createdAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}</TableCell>
                      </TableRow>
                    ))}
                    {attendees.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                          Belum ada konfirmasi kehadiran masuk.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {messages.map((msg) => (
                  <Card key={msg.id} className="border-none shadow-md overflow-hidden group">
                    <div className="h-1 bg-pink-100 group-hover:bg-pink-400 transition-colors" />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-bold text-gray-900">{msg.guestName}</CardTitle>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{format(new Date(msg.createdAt), "dd MMM yyyy", { locale: idLocale })}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 italic leading-relaxed">&#34;{msg.message}&rdquo;</p>
                    </CardContent>
                  </Card>
                ))}
                {messages.length === 0 && <div className="col-span-2 text-center py-20 bg-white rounded-2xl border border-dashed text-muted-foreground">Belum ada ucapan dan doa dari tamu.</div>}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
