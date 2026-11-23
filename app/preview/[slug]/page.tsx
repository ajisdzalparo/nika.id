import Link from "next/link";
import { IconArrowLeft, IconEdit } from "@tabler/icons-react";
import { TemplateRenderer } from "@/components/template-renderer";
import { Button } from "@/components/ui/button";
import { MOCK_WEDDING_DATA } from "@/lib/constants/mock-wedding-data";
import { AI_THEME_PRESETS } from "@/lib/ai-design/presets";
import { getCatalog } from "@/lib/catalog";
import { resolveTemplateMusic } from "@/lib/template-music";
import type { WeddingData } from "@/types/wedding";

interface PreviewPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preset?: string }>;
}

export const dynamic = "force-dynamic";

// Public preview of a code template (components/templates) with sample data.
export default async function TemplatePreviewPage({ params, searchParams }: PreviewPageProps) {
  const { slug } = await params;
  const { preset } = await searchParams;

  const presetTheme = slug === "ai-design" && preset ? AI_THEME_PRESETS[preset]?.theme : undefined;

  // Template music from the CMS wins; otherwise the super admin's default music library
  const catalogItem = (await getCatalog()).find((i) => i.componentSlug === slug || i.slug === slug);
  const music = (await resolveTemplateMusic(catalogItem?.defaultMusic)) ?? MOCK_WEDDING_DATA.music;

  const data: WeddingData = { ...MOCK_WEDDING_DATA, music, ...(presetTheme ? { aiTheme: presetTheme } : {}) };

  return (
    <div className="relative">
      {/* Floating Toolbar */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-100 flex items-center gap-2 p-2 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl scale-90 md:scale-100">
        <Button variant="ghost" size="sm" asChild className="rounded-md">
          <Link href="/desain">
            <IconArrowLeft size={18} className="mr-2" />
            Kembali
          </Link>
        </Button>
        <div className="w-px h-6 bg-slate-200 mx-2" />
        <div className="px-3">
          <span className="text-sm font-semibold text-slate-900">Preview: </span>
          <span className="text-sm text-primary capitalize">{catalogItem?.name ?? slug.replace(/-/g, " ")}</span>
        </div>
        <Button size="sm" asChild className="bg-primary hover:bg-primary/90 rounded-md ml-2 group">
          <Link href={catalogItem ? `/pilih-template?pakai=${catalogItem.slug}` : "/register"}>
            <IconEdit size={18} className="mr-2 group-hover:rotate-12 transition-transform" />
            Pakai Template Ini
          </Link>
        </Button>
      </div>

      {/* Template Render */}
      <TemplateRenderer slug={slug} data={data} />
    </div>
  );
}
