"use client";

import { useState } from "react";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { getActiveTemplates } from "@/lib/templates";
import { IconCheck, IconEye } from "@tabler/icons-react";

const templates = getActiveTemplates();

export default function PilihTemplatePage() {
  const router = useRouter();
  const [submittingSlug, setSubmittingSlug] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSelect = async (templateSlug: string) => {
    setError("");
    setSubmittingSlug(templateSlug);
    try {
      const res = await fetch("/api/user/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateSlug }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Gagal memilih template");
        setSubmittingSlug(null);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan tak terduga");
      setSubmittingSlug(null);
    }
  };

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col bg-[#FAFAFA] dark:bg-zinc-950 min-h-screen">
        <div className="flex flex-col gap-8 py-10 px-4 lg:px-8 w-full">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <Badge variant="outline" className="mb-4 bg-primary/5 text-primary border-primary/20 px-3 py-1 rounded-full text-xs uppercase tracking-wider font-semibold">
              Koleksi Eksklusif
            </Badge>
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-zinc-900 dark:text-zinc-50 tracking-tight mb-4">Pilih Tema Undangan</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">Temukan desain yang mencerminkan kisah cinta Anda. Semua template dapat dikustomisasi sepenuhnya.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template) => (
              <div
                key={template.slug}
                className="group relative bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image src={template.thumbnail} alt={template.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Content Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="mb-4">
                      <Badge className={`${template.type === "Premium" ? "bg-amber-400 text-amber-950" : "bg-white/20 text-white backdrop-blur-md"} border-none mb-2`}>{template.type}</Badge>
                      <h3 className="font-serif text-2xl font-bold text-white mb-1">{template.name}</h3>
                      <p className="text-white/80 text-sm hidden group-hover:block transition-all animate-in fade-in slide-in-from-bottom-2">{template.category} Style</p>
                    </div>

                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                      <Button className="flex-1 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100" onClick={() => handleSelect(template.slug)} disabled={submittingSlug === template.slug}>
                        {submittingSlug === template.slug ? (
                          "Memproses..."
                        ) : (
                          <>
                            <IconCheck className="w-4 h-4 mr-2" /> Pilih
                          </>
                        )}
                      </Button>
                      <Button variant="secondary" className="w-12 h-10 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md px-0">
                        <IconEye className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 px-6 py-3 rounded-full shadow-lg border border-red-200 animate-in fade-in slide-in-from-bottom-4">{error}</div>}
        </div>
      </div>
    </>
  );
}
