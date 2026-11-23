import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { getCatalogItem } from "@/lib/catalog";
import { resolveTemplateMusic } from "@/lib/template-music";
import { MOCK_WEDDING_DATA } from "@/lib/constants/mock-wedding-data";
import AiDesignTemplate from "@/components/templates/ai-design";

// Public preview of a catalog template with sample data.
export default async function CatalogPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getCatalogItem(slug);
  if (!item) notFound();
  if (item.kind === "CODE" && item.componentSlug) redirect(`/preview/${item.componentSlug}`);
  if (!item.theme) notFound();

  // Template music from the CMS wins; otherwise the super admin's default music library
  const music = await resolveTemplateMusic(item.defaultMusic);
  const previewData = music ? { ...MOCK_WEDDING_DATA, music } : MOCK_WEDDING_DATA;

  return (
    <div className="relative">
      <div className="fixed left-1/2 top-4 z-100 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-2 rounded-full border border-[#E1D8C9] bg-[#FFFDF9]/95 p-1.5 shadow-lg backdrop-blur">
        <Link href="/desain" aria-label="Kembali ke koleksi" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#1E1B17] hover:bg-[#EFE8DC]">
          <IconArrowLeft size={18} />
        </Link>
        <p className="min-w-0 flex-1 truncate text-sm text-[#1E1B17]">
          <span className="font-medium">{item.name}</span> <span className="text-[#6B6358]">· {item.category}</span>
        </p>
        <Link href={`/pilih-template?pakai=${item.slug}`} className="flex h-10 shrink-0 items-center rounded-full bg-[#1E1B17] px-4 text-sm font-medium text-[#F7F3EC]">
          Pakai desain
        </Link>
      </div>
      <AiDesignTemplate data={previewData} theme={item.theme} />
    </div>
  );
}
