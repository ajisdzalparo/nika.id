import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconCopy, IconEye, IconUsers, IconMessage, IconExternalLink, IconSparkles, IconBrush } from "@tabler/icons-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Session } from "@/lib/auth";

type UserSession = Session & {
  user: Session["user"] & {
    role?: string;
    invitationSlug?: string;
    views?: number;
  };
};

export default async function UserDashboardPage() {
  const rawHeaders = await headers();
  const session = (await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  })) as UserSession | null;

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          rsvps: true,
          messages: true,
          guests: true,
        },
      },
    },
  });

  if (!user) redirect("/login");

  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${user.invitationSlug || ""}`;

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col bg-linear-to-b from-gray-50 to-white">
        <div className="flex flex-col gap-6 py-8 px-4 lg:px-8 max-w-7xl mx-auto w-full">
          {/* Header & Welcome */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                Halo, <span className="text-pink-500">{user.name?.split(" ")[0]}</span>! 👋
              </h1>
              <p className="text-muted-foreground mt-1 text-lg">Kelola undangan pernikahan impian Anda di sini.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-sm font-semibold bg-pink-50 text-pink-600 border-pink-100 italic">
                {user.role === "admin" ? "Admin Access" : "Standard Plan"}
              </Badge>
              <Button asChild variant="outline" size="sm" className="rounded-full shadow-xs">
                <Link href="/pengaturan">Pengaturan Akun</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status & Link (Left Column) */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-xl bg-linear-to-br from-white to-gray-50/50 overflow-hidden group">
                <div className="h-1.5 bg-linear-to-r from-pink-400 to-rose-500 w-full" />
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Status Undangan</CardTitle>
                      <CardDescription>Link aktif undangan Anda</CardDescription>
                    </div>
                    <Badge className="bg-green-500 hover:bg-green-600 px-3">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-2xl bg-gray-100/50 border border-gray-100 flex items-center gap-3 group-hover:bg-white transition-all">
                    <div className="flex-1 truncate font-mono text-sm text-gray-600">{invitationUrl}</div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-pink-50 hover:text-pink-500">
                        <IconCopy className="h-4 w-4" />
                      </Button>
                      <Button asChild variant="secondary" size="sm" className="rounded-xl gap-2 font-bold px-4">
                        <Link href={`/${user.invitationSlug}`} target="_blank">
                          <IconExternalLink className="h-4 w-4" />
                          Buka
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button asChild className="h-14 rounded-2xl bg-linear-to-r from-pink-500 to-rose-600 hover:scale-[1.02] transition-all shadow-lg shadow-pink-200 gap-3 text-md font-bold">
                      <Link href="/editor">
                        <IconBrush className="h-5 w-5" />
                        Edit Konten Undangan
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-14 rounded-2xl border-2 hover:bg-gray-50 transition-all gap-3 text-md font-bold">
                      <Link href="/pilih-template">
                        <IconSparkles className="h-5 w-5 text-pink-500" />
                        Ganti Desain Template
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/manajemen-tamu" className="block group">
                  <Card className="h-full border-none shadow-lg group-hover:shadow-xl transition-all group-hover:-translate-y-1">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <IconUsers className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Manajemen Tamu</h4>
                        <p className="text-sm text-muted-foreground">Kirim undangan via WhatsApp</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/buku-tamu" className="block group">
                  <Card className="h-full border-none shadow-lg group-hover:shadow-xl transition-all group-hover:-translate-y-1">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <IconMessage className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Buku Tamu & RSVP</h4>
                        <p className="text-sm text-muted-foreground">Lihat ucapan & kedatangan</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>

            {/* Stats Sidebar (Right Column) */}
            <div className="space-y-6">
              <Card className="border-none shadow-xl bg-linear-to-b from-gray-900 to-gray-800 text-white overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium opacity-80 italic">Ringkasan Live</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/10">
                        <IconEye className="h-5 w-5 text-pink-400" />
                      </div>
                      <span className="text-sm font-medium opacity-70">Pengunjung</span>
                    </div>
                    <span className="text-3xl font-black">{user.views || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/10">
                        <IconUsers className="h-5 w-5 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium opacity-70">RSVP Masuk</span>
                    </div>
                    <span className="text-3xl font-black">{user._count.rsvps}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/10">
                        <IconMessage className="h-5 w-5 text-orange-400" />
                      </div>
                      <span className="text-sm font-medium opacity-70">Ucapan</span>
                    </div>
                    <span className="text-3xl font-black">{user._count.messages}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Account Tip */}
              <Card className="border-none shadow-lg bg-pink-50/50 border border-pink-100/50">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="p-2 h-fit rounded-lg bg-pink-500 text-white">
                      <IconSparkles className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-900">Upgrade ke Pro?</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">Dapatkan fitur kado digital, musik custom, dan hilangkan watermark nika.id.</p>
                      <Button variant="link" className="p-0 h-auto text-pink-500 font-bold hover:no-underline">
                        Lihat Kelebihan Pro →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
