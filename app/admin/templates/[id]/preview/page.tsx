import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TemplateRenderer } from "@/components/template-renderer";
import { getTemplateBySlug } from "@/lib/templates";
import { MOCK_WEDDING_DATA } from "@/lib/constants/mock-wedding-data";

export default async function TemplatePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const template = getTemplateBySlug(id);

  if (!template) {
    notFound();
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/templates">
            <Button variant="ghost" size="sm" className="text-white hover:text-white/80">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </Link>
          <div>
            <span className="font-semibold">Preview Mode:</span> {template.name} ({template.slug})
          </div>
        </div>
        <div className="text-xs text-muted-foreground hidden sm:block">Data yang ditampilkan adalah data dummy</div>
      </div>

      <div className="pt-16">
        <TemplateRenderer slug={template.slug} data={MOCK_WEDDING_DATA} />
      </div>
    </div>
  );
}
