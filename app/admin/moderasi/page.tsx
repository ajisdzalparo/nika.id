import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Database, MessageSquare } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";
import type { Session } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ModerationClient, type GuestMessage } from "@/components/admin/moderation-client";

type AdminSession = Session & {
  user: Session["user"] & {
    role?: string;
  };
};

export default async function ModerasiPage() {
  const rawHeaders = await headers();
  const session = (await auth.api.getSession({
    headers: Object.fromEntries(rawHeaders),
  })) as AdminSession | null;

  const role = session?.user.role;
  if (!session || role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch real guest messages
  const guestMessages = await prisma.guestMessage.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          invitationSlug: true,
        },
      },
    },
    take: 100, // Limit to recent 100
  });

  // Serialize dates for Client Component
  const serializedMessages = guestMessages.map((msg) => ({
    ...msg,
    createdAt: msg.createdAt.toISOString(),
  }));

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">Moderasi Konten</h1>
            <p className="text-muted-foreground">Kelola ucapan tamu dan audit media sistem</p>
          </div>

          <Tabs defaultValue="messages" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Ucapan Tamu
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Audit Media
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="space-y-4">
              <ModerationClient initialMessages={serializedMessages as GuestMessage[]} />
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-2">Audit Media & Penyimpanan</h3>
                <p className="text-sm text-muted-foreground mb-6">Monitoring penggunaan ruang penyimpanan oleh foto dan video yang diunggah user.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-xl bg-muted/50 border">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Total Kuota</p>
                    <p className="text-2xl font-bold">5.0 GB</p>
                    <div className="mt-2 text-[10px] text-green-600 bg-green-500/10 w-fit px-1.5 py-0.5 rounded">Standard Plan</div>
                  </div>
                  <div className="p-5 rounded-xl bg-muted/50 border">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Terpakai</p>
                    <p className="text-2xl font-bold">1.2 GB</p>
                    <div className="mt-2 w-full bg-muted overflow-hidden rounded-full h-1.5">
                      <div className="bg-primary h-full w-[24%]" />
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-muted/50 border">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Media Item</p>
                    <p className="text-2xl font-bold">428</p>
                    <p className="mt-2 text-[10px] text-muted-foreground italic">Foto, video, dan thumbnail</p>
                  </div>
                </div>

                <div className="mt-8 p-6 border border-dashed rounded-lg flex flex-col items-center justify-center text-center">
                  <Database className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <h4 className="font-medium">Audit Metadata Detail</h4>
                  <p className="text-sm text-muted-foreground max-w-sm mt-1">Fitur audit untuk menghapus file sampah yang tidak memiliki referensi di database sedang dalam pengembangan.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
