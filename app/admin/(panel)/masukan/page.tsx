import { SiteHeader } from "@/components/site-header";
import { FeedbackInbox } from "@/components/admin/feedback-inbox";
import { prisma } from "@/lib/prisma";
import { Panel, PanelTitle, StatTile } from "@/components/common/studio-ui";

const fmt = new Intl.NumberFormat("id-ID");

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const [surveyRows, snoozed] = await Promise.all([
    prisma.surveyResponse.findMany({
      where: { status: "TERKIRIM" },
      orderBy: { createdAt: "desc" },
      take: 1000,
      include: { user: { select: { name: true } } },
    }),
    prisma.surveyResponse.count({ where: { status: "DITUNDA" } }),
  ]);
  const avg = (k: "designScore" | "easeScore" | "priceScore") => (surveyRows.length ? surveyRows.reduce((s, r) => s + (r[k] ?? 0), 0) / surveyRows.length : 0);
  const promoters = surveyRows.filter((r) => (r.recommend ?? 0) >= 9).length;
  const detractors = surveyRows.filter((r) => (r.recommend ?? 0) <= 6).length;
  const sourceCounts = new Map<string, number>();
  for (const r of surveyRows) if (r.source) sourceCounts.set(r.source, (sourceCounts.get(r.source) ?? 0) + 1);
  const survey = {
    count: surveyRows.length,
    snoozed,
    promoters,
    detractors,
    // Net Promoter Score: % promoters (9–10) minus % detractors (0–6)
    nps: surveyRows.length ? Math.round(((promoters - detractors) / surveyRows.length) * 100) : 0,
    design: avg("designScore"),
    ease: avg("easeScore"),
    price: avg("priceScore"),
    sources: [...sourceCounts.entries()].sort((a, b) => b[1] - a[1]),
    wishes: surveyRows.filter((r) => r.wish).slice(0, 6).map((r) => ({ id: r.id, wish: r.wish as string, name: r.user.name })),
  };

  const rows = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { user: { select: { name: true, email: true, accountType: true } } },
  });

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="w-full space-y-8">
          <header className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6424]">Suara pengguna</p>
            <h1 className="font-serif text-4xl font-medium text-[#1F1A14]">Masukan</h1>
            <p className="max-w-2xl text-[15px] text-[#6B5F50]">
              Saran, laporan masalah, ide fitur, dan nilai kepuasan dari pengguna. Ubah status atau beri balasan, pengguna akan mendapat notifikasi.
            </p>
          </header>

          {/* Customer survey results */}
          <Panel className="p-5 sm:p-6">
            <PanelTitle>Survei pengguna</PanelTitle>
            {survey.count === 0 ? (
              <p className="text-[15px] text-[#6B5F50]">
                Belum ada jawaban. Survei singkat muncul sesekali di Beranda pengguna yang sudah memakai produk (tidak lebih dari sekali per 4 bulan, bisa ditunda).
              </p>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <StatTile label="Jawaban" value={fmt.format(survey.count)} hint={`${fmt.format(survey.snoozed)} kali ditunda`} />
                  <StatTile label="NPS" value={survey.nps > 0 ? `+${survey.nps}` : survey.nps} hint={`${survey.promoters} promotor · ${survey.detractors} kritikus`} />
                  <StatTile label="Desain" value={survey.design.toFixed(1)} hint="dari 5" />
                  <StatTile label="Kemudahan" value={survey.ease.toFixed(1)} hint="dari 5" />
                  <StatTile label="Harga" value={survey.price.toFixed(1)} hint="dari 5" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="mb-3 text-sm font-medium text-[#1F1A14]">Tahu dari mana</p>
                    <ul className="space-y-2">
                      {survey.sources.map(([name, n]) => (
                        <li key={name} className="text-sm">
                          <div className="flex justify-between text-[#40372B]">
                            <span>{name}</span>
                            <span className="tabular-nums text-[#6B5F50]">{n}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#F3EBDB]">
                            <div className="h-full rounded-full bg-[linear-gradient(90deg,#B8903F,#E6CB86)]" style={{ width: `${(n / survey.count) * 100}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-3 text-sm font-medium text-[#1F1A14]">Fitur yang diinginkan</p>
                    {survey.wishes.length ? (
                      <ul className="space-y-2">
                        {survey.wishes.map((w) => (
                          <li key={w.id} className="rounded-xl bg-[#FCF8F1] p-3 text-sm text-[#40372B]">
                            {w.wish}
                            <span className="mt-1 block text-xs text-[#8E8268]">{w.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-[#6B5F50]">Belum ada usulan fitur.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Panel>
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
              repliedAt: r.repliedAt ? r.repliedAt.toISOString() : null,
              createdAt: r.createdAt.toISOString(),
              user: { name: r.user.name, email: r.user.email, accountType: r.user.accountType },
            }))}
          />
        </div>
      </div>
    </>
  );
}
