import { SiteHeader } from "@/components/site-header";
import { TestimonialManager } from "@/components/admin/testimonial-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const rows = await prisma.testimonial.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: 300,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="w-full space-y-8">
          <header className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6424]">Apa kata mereka</p>
            <h1 className="font-serif text-4xl font-medium text-[#1F1A14]">Testimoni</h1>
            <p className="max-w-2xl text-[15px] text-[#6B5F50]">
              Testimoni dari pasangan. Yang disetujui tampil di halaman depan. Selama belum ada satu pun yang disetujui, halaman depan menampilkan kartu contoh
              berlabel &ldquo;Contoh&rdquo;, dan kartu itu hilang otomatis begitu testimoni pertama disetujui.
            </p>
          </header>
          <TestimonialManager
            initialItems={rows.map((r) => ({
              id: r.id,
              displayName: r.displayName,
              city: r.city,
              rating: r.rating,
              message: r.message,
              status: r.status,
              adminNote: r.adminNote,
              createdAt: r.createdAt.toISOString(),
              user: { name: r.user.name, email: r.user.email },
            }))}
          />
        </div>
      </div>
    </>
  );
}
