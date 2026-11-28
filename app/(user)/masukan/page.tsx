import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { FeedbackForm } from "@/components/user/feedback-form";
import { TestimonialForm } from "@/components/user/testimonial-form";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { FEEDBACK_FEATURES, type FeedbackFeature } from "@/lib/feedback-shared";

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ fitur?: string; dari?: string }> }) {
  const session = await getSession(undefined, "user");
  if (!session) redirect("/login");
  const { fitur, dari } = await searchParams;

  const [rows, testimonial, owner] = await Promise.all([
    prisma.feedback.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.testimonial.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { accountType: true, name: true, partnerName: true } }),
  ]);
  const defaultName = [owner?.name, owner?.partnerName].filter(Boolean).join(" & ");
  const initialFeature = FEEDBACK_FEATURES.some((f) => f.id === fitur) ? (fitur as FeedbackFeature) : undefined;
  const fromPath = typeof dari === "string" && dari.startsWith("/") ? dari.slice(0, 200) : undefined;

  return (
    <>
      <SiteHeader user={session.user} />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8 lg:pt-10">
        <div className="w-full space-y-8">
          <header className="max-w-2xl space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6424]">Masukan</p>
            <h2 className="font-serif text-4xl font-medium text-[#1F1A14] md:text-5xl">Bantu kami jadi lebih baik</h2>
            <p className="text-[15px] leading-relaxed text-[#6B5F50]">
              Ada yang membingungkan, kurang, atau justru sudah pas? Ceritakan pengalamanmu memakai SatuMoment. Setiap masukan dibaca tim kami, dan kamu akan
              dapat kabar saat statusnya berubah.
            </p>
          </header>
          {owner?.accountType !== "CLIENT" && (
            <TestimonialForm
              defaultName={defaultName}
              initial={
                testimonial
                  ? {
                      id: testimonial.id,
                      displayName: testimonial.displayName,
                      city: testimonial.city,
                      rating: testimonial.rating,
                      message: testimonial.message,
                      status: testimonial.status,
                      adminNote: testimonial.adminNote,
                      createdAt: testimonial.createdAt.toISOString(),
                    }
                  : null
              }
            />
          )}
          <FeedbackForm
            initialFeature={initialFeature}
            fromPath={fromPath}
            initialItems={rows.map((r) => ({
              id: r.id,
              category: r.category,
              feature: r.feature,
              rating: r.rating,
              message: r.message,
              pagePath: r.pagePath,
              status: r.status,
              adminReply: r.adminReply,
              repliedAt: r.repliedAt?.toISOString() ?? null,
              createdAt: r.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </>
  );
}
