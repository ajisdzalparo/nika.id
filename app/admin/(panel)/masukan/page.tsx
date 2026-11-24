import { SiteHeader } from "@/components/site-header";
import { FeedbackInbox } from "@/components/admin/feedback-inbox";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const rows = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { user: { select: { name: true, email: true, accountType: true } } },
  });

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <header className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">Suara pengguna</p>
            <h1 className="font-serif text-4xl font-medium text-[#1E1B17]">Masukan</h1>
            <p className="max-w-2xl text-[15px] text-[#6B6358]">
              Saran, laporan masalah, ide fitur, dan nilai kepuasan dari pengguna. Ubah status atau beri balasan, pengguna akan mendapat notifikasi.
            </p>
          </header>
          <FeedbackInbox
            initialItems={rows.map((r) => ({
              id: r.id,
              category: r.category,
              feature: r.feature,
              rating: r.rating,
              message: r.message,
              pagePath: r.pagePath,
              status: r.status,
              adminReply: r.adminReply,
              createdAt: r.createdAt.toISOString(),
              user: { name: r.user.name, email: r.user.email, accountType: r.user.accountType },
            }))}
          />
        </div>
      </div>
    </>
  );
}
