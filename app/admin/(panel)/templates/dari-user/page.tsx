import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { UserDesigns } from "@/components/admin/user-designs";
import { prisma } from "@/lib/prisma";
import { normalizeTheme } from "@/lib/ai-design/color";

export default async function UserDesignsPage() {
  const designs = await prisma.aiDesign.findMany({
    where: { source: "AI" },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: { user: { select: { name: true } } },
  });

  const rows = designs.map((d) => ({
    id: d.id,
    prompt: d.prompt,
    source: d.source,
    createdAt: d.createdAt.toISOString(),
    theme: normalizeTheme(d.theme),
    userName: d.user.name ?? "User",
  }));

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <Link href="/admin/templates" className="inline-flex min-h-11 items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
            <IconArrowLeft size={16} /> Kembali ke koleksi
          </Link>
          <header className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">CMS</p>
            <h2 className="font-serif text-5xl font-medium">Dari desain user</h2>
            <p className="max-w-2xl text-zinc-600">Desain AI terbaru buatan user. Jadikan yang bagus sebagai template katalog. Yang disalin hanya temanya; nama, foto, dan data undangan user tidak ikut.</p>
          </header>
          <UserDesigns rows={rows} />
        </div>
      </div>
    </>
  );
}
