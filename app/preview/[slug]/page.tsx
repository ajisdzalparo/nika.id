"use client";

import { use } from "react";
import { TemplateRenderer } from "@/components/template-renderer";
import { MOCK_WEDDING_DATA } from "@/lib/constants/mock-wedding-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IconArrowLeft, IconEdit } from "@tabler/icons-react";

interface PreviewPageProps {
  params: Promise<{ slug: string }>;
}

export default function TemplatePreviewPage({ params }: PreviewPageProps) {
  const { slug } = use(params);

  return (
    <div className="relative">
      {/* Floating Toolbar */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-100 flex items-center gap-2 p-2 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl scale-90 md:scale-100">
        <Button variant="ghost" size="sm" asChild className="rounded-xl">
          <Link href="/#templates">
            <IconArrowLeft size={18} className="mr-2" />
            Kembali
          </Link>
        </Button>
        <div className="w-px h-6 bg-slate-200 mx-2" />
        <div className="px-3">
          <span className="text-sm font-semibold text-slate-900">Preview: </span>
          <span className="text-sm text-pink-500 capitalize">{slug.replace(/-/g, " ")}</span>
        </div>
        <Button size="sm" asChild className="bg-pink-500 hover:bg-pink-600 rounded-xl ml-2 group">
          <Link href="/register">
            <IconEdit size={18} className="mr-2 group-hover:rotate-12 transition-transform" />
            Pakai Template Ini
          </Link>
        </Button>
      </div>

      {/* Template Render */}
      <TemplateRenderer slug={slug} data={MOCK_WEDDING_DATA} />
    </div>
  );
}
