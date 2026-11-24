/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense } from "react";
import Link from "next/link";
import { templateRegistry } from "@/components/templates/registry";
import { TemplateLoadingScreen } from "@/components/common/template-loading-screen";

interface TemplateRendererProps {
  slug: string;
  data: any;
}

export function TemplateRenderer({ slug, data }: TemplateRendererProps) {
  const templateItem = templateRegistry[slug];

  if (!templateItem) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FCF8F1] px-5 text-[#1F1A14]">
        <div className="max-w-md border border-[#DFD4C4] bg-[#FFFDF9] p-8 text-center shadow-[0_20px_50px_-30px_rgba(30,27,23,0.22)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-[#9A7B4F]">
            Template Tidak Ditemukan
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[#1F1A14]">
            Desain belum tersedia
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B5F50]">
            Template dengan ID &ldquo;{slug}&rdquo; belum terdaftar atau sedang dalam pembaruan.
          </p>
          <Link
            href="/desain"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-[#1F1A14] px-6 text-xs font-medium uppercase tracking-[0.18em] text-[#FCF8F1] hover:bg-[#332E27]"
          >
            Lihat Template
          </Link>
        </div>
      </div>
    );
  }

  const Component = templateItem.component;

  return (
    <Suspense fallback={<TemplateLoadingScreen label="Memuat template" />}>
      <Component data={data} />
    </Suspense>
  );
}
