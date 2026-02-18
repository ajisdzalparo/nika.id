import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { IconMessage, IconUsers, IconCheck, IconX, IconQuestionMark, IconQuote } from "@tabler/icons-react";

export default async function BukuTamuPage() {
  const rawHeaders = await headers();
  const session = await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  });

  if (!session) redirect("/login");

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
      <div className="flex flex-1 flex-col bg-[#FAFAFA] dark:bg-zinc-950 min-h-screen">
        <div className="flex flex-col gap-8 py-10 px-4 lg:px-8 w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-medium text-zinc-900 dark:text-zinc-50 tracking-tight">Komentar & Kehadiran</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Pantau siapa saja yang akan hadir di hari bahagiamu.</p>
            </div>
            <Button className="rounded-full px-6 shadow-none bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200">Download Data</Button>
          </div>

          {/* Stats Cards - Glass & Minimalist */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Total Respon</span>
              <span className="font-serif text-4xl text-zinc-900 dark:text-zinc-100">{stats.total}</span>
            </div>
            <div className="p-6 rounded-xl bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Hadir</span>
              <span className="font-serif text-4xl text-zinc-900 dark:text-zinc-100">{stats.present}</span>
            </div>
            <div className="p-6 rounded-xl bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Berhalangan</span>
              <span className="font-serif text-4xl text-zinc-900 dark:text-zinc-100">{stats.absent}</span>
            </div>
          </div>

          <Tabs defaultValue="attendance" className="w-full">
            <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-full h-auto mb-8 w-fit mx-auto md:mx-0">
              <TabsTrigger value="attendance" className="rounded-full py-2.5 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm font-medium transition-all">
                <IconUsers className="w-4 h-4 mr-2" />
                Daftar Kehadiran
              </TabsTrigger>
              <TabsTrigger value="messages" className="rounded-full py-2.5 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm font-medium transition-all">
                <IconMessage className="w-4 h-4 mr-2" />
                Ucapan Doa
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attendance">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm overflow-hidden shadow-sm">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {attendees.map((attendee) => (
                    <div key={attendee.id} className="p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                            attendee.attendance === "Hadir" ? "bg-primary/10 border-primary/20 text-primary" : "bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700"
                          }`}
                        >
                          {attendee.attendance === "Hadir" ? <IconCheck size={18} /> : <IconX size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">{attendee.guestName}</p>
                          <p className="text-xs text-zinc-500">{format(new Date(attendee.createdAt), "dd MMM, HH:mm", { locale: idLocale })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={`rounded-full px-3 py-0.5 border ${
                            attendee.attendance === "Hadir" ? "border-primary/20 bg-primary/5 text-primary" : "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {attendee.guests} Orang
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {attendees.length === 0 && (
                    <div className="p-16 text-center">
                      <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-300">
                        <IconUsers size={32} />
                      </div>
                      <p className="text-zinc-500">Belum ada konfirmasi kehadiran tamu.</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="messages">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {messages.map((msg) => (
                  <Card key={msg.id} className="border-none shadow-sm hover:shadow-md transition-all bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden group">
                    <CardContent className="p-6 relative">
                      <IconQuote className="absolute top-6 right-6 text-primary/10 w-10 h-10 rotate-180" />
                      <p className="text-zinc-600 dark:text-zinc-300 italic mb-6 relative z-10 leading-relaxed min-h-[60px]">&rdquo;{msg.message}&rdquo;</p>
                      <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 text-xs font-bold font-serif">
                          {msg.guestName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{msg.guestName}</p>
                          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{format(new Date(msg.createdAt), "dd MMM yyyy", { locale: idLocale })}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {messages.length === 0 && (
                  <div className="col-span-2 p-16 text-center bg-white dark:bg-zinc-900 rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-300">
                      <IconMessage size={32} />
                    </div>
                    <p className="text-zinc-500">Belum ada ucapan doa dari tamu.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
