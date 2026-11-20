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
      <div className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-5 text-[#1E1B17]">
        <div className="max-w-md border border-[#DFD4C4] bg-[#FFFDF9] p-8 text-center shadow-[0_20px_50px_-30px_rgba(30,27,23,0.22)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-[#9A7B4F]">
            Template Tidak Ditemukan
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-[#1E1B17]">
            Desain belum tersedia
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6B6358]">
            Template dengan ID &ldquo;{slug}&rdquo; belum terdaftar atau sedang dalam pembaruan.
          </p>
          <Link
            href="/desain"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-[#1E1B17] px-6 text-xs font-medium uppercase tracking-[0.18em] text-[#F7F3EC] hover:bg-[#332E27]"
          >
            Lihat Koleksi Desain
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
