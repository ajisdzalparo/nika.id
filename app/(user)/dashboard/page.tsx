import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconCopy, IconExternalLink, IconBrush, IconChartBar, IconMessage, IconUsers, IconBrandWhatsapp } from "@tabler/icons-react";
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

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
  const greeting = getGreeting();

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col bg-[#FAFAFA] dark:bg-zinc-950">
        <div className="flex flex-col gap-8 py-10 px-4 lg:px-8 w-full">
          {/* Hero / Welcome Section with "Bento" feel */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/50 p-8 md:p-12">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                  <Badge variant="outline" className="mb-4 bg-primary/5 text-primary border-primary/20 px-3 py-1 rounded-full text-xs uppercase tracking-wider font-semibold">
                    {user.role === "admin" ? "Admin Access" : "Premium Member"}
                  </Badge>
                  <h1 className="font-serif text-4xl md:text-5xl font-medium text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
                    {greeting}, <span className="italic text-primary">{user.name?.split(" ")[0]}</span>
                  </h1>
                  <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-lg">Persiapan pernikahanmu sudah berjalan lancar. Mari cek progres hari ini.</p>
                </div>

                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <div className="px-4 py-2">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Status Undangan</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">Aktif & Publik</span>
                    </div>
                  </div>
                  <Button asChild size="sm" className="rounded-xl h-10 px-5 shadow-none bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200">
                    <Link href={`/${user.invitationSlug}`} target="_blank">
                      Lihat <IconExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Main Link Box */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 max-w-2xl">
                <div className="pl-4 flex-1 truncate font-mono text-sm text-zinc-500">{invitationUrl}</div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none rounded-xl gap-2 hover:bg-white border-zinc-200 shadow-sm">
                    <IconCopy className="w-3.5 h-3.5" /> Salin
                  </Button>
                  <Button size="sm" className="flex-1 sm:flex-none rounded-xl gap-2 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90">
                    <IconBrandWhatsapp className="w-3.5 h-3.5" /> Sebar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Grid Layout for Stats & Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Main Stats - Glass Card */}
            <div className="md:col-span-2 lg:col-span-2 row-span-2 rounded-xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl shadow-zinc-200/20 dark:shadow-black/40 p-10 flex flex-col justify-between group relative overflow-hidden">
              {/* Ambient Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="p-3 bg-primary/10 text-primary rounded-lg">
                  <IconChartBar size={28} strokeWidth={1.5} />
                </div>
                <Badge variant="outline" className="rounded-full border-primary/20 text-primary bg-primary/5">
                  Real-time Insight
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-8 relative z-10">
                <div>
                  <p className="text-zinc-500 font-medium text-sm lg:text-base uppercase tracking-widest mb-2">Total Views</p>
                  <h3 className="text-5xl lg:text-7xl font-serif text-zinc-900 dark:text-white tracking-tight">{user.views || 0}</h3>
                </div>
                <div>
                  <p className="text-zinc-500 font-medium text-sm lg:text-base uppercase tracking-widest mb-2">Confirmed</p>
                  <h3 className="text-5xl lg:text-7xl font-serif text-zinc-900 dark:text-white tracking-tight">{user._count.rsvps}</h3>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-zinc-200/50 dark:border-white/5 relative z-10">
                <p className="text-sm text-zinc-400">Statistik diperbarui secara otomatis setiap ada interaksi tamu.</p>
              </div>
            </div>

            {/* Action: Edit Content - Glass Card */}
            <Link
              href="/editor"
              className="group relative overflow-hidden rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 p-8 flex flex-col justify-center min-h-[220px] transition-all duration-500 hover:bg-white/60 dark:hover:bg-white/10 hover:scale-[1.02] shadow-sm hover:shadow-2xl hover:shadow-primary/10"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity duration-500">
                <IconBrush size={100} className="text-primary" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-lg flex items-center justify-center text-zinc-900 dark:text-white mb-6 shadow-sm border border-white/50 dark:border-white/10 group-hover:scale-110 transition-transform duration-500">
                  <IconBrush size={26} className="text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-medium text-zinc-900 dark:text-white mb-2">Editor</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">Kustomisasi detail tampilan, teks, dan media undangan.</p>
              </div>
            </Link>

            {/* Action: Guest Book - Glass Card */}
            <Link
              href="/buku-tamu"
              className="group relative overflow-hidden rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 p-8 flex flex-col justify-center min-h-[220px] transition-all duration-500 hover:bg-white/60 dark:hover:bg-white/10 hover:scale-[1.02] shadow-sm hover:shadow-2xl hover:shadow-primary/10"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity duration-500">
                <IconMessage size={100} className="text-primary" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-lg flex items-center justify-center text-zinc-900 dark:text-white mb-6 shadow-sm border border-white/50 dark:border-white/10 group-hover:scale-110 transition-transform duration-500">
                  <IconMessage size={26} className="text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-medium text-zinc-900 dark:text-white mb-2">Wishes</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{user._count.messages} ucapan doa dari para tamu undangan.</p>
              </div>
            </Link>

            {/* Action: Guest Management - Glass Card */}
            <Link
              href="/manajemen-tamu"
              className="md:col-span-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border border-transparent p-8 flex items-center justify-between group transition-all hover:scale-[1.01] hover:shadow-2xl shadow-xl overflow-hidden relative"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

              <div className="flex items-center gap-6 relative z-10">
                <div className="w-20 h-20 rounded-lg bg-white/10 dark:bg-black/5 border border-white/10 dark:border-black/5 flex items-center justify-center text-white dark:text-zinc-900">
                  <IconUsers size={36} />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-medium mb-1">Guest List</h3>
                  <p className="text-white/60 dark:text-zinc-600">Kelola daftar hadir dan sebar undangan personal.</p>
                </div>
              </div>
              <div className="w-14 h-14 rounded-full border border-white/20 dark:border-black/10 flex items-center justify-center text-white/50 dark:text-zinc-400 group-hover:bg-white group-hover:text-zinc-900 dark:group-hover:bg-zinc-900 dark:group-hover:text-white transition-all duration-300">
                <IconExternalLink size={24} />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
