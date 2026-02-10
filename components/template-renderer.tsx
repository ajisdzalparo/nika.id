/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense } from "react";
import { templateRegistry } from "@/components/templates/registry";

interface TemplateRendererProps {
  slug: string;
  data: any;
}

export function TemplateRenderer({ slug, data }: TemplateRendererProps) {
  const templateItem = templateRegistry[slug];

  if (!templateItem) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Template Tidak Ditemukan</h1>
          <p className="text-gray-600">Template dengan ID "{slug}" belum terdaftar atau file tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const Component = templateItem.component;

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading Template...</div>}>
      <Component data={data} />
    </Suspense>
  );
}
