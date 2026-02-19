"use client";

import { useState } from "react";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { getActiveTemplates } from "@/lib/templates";
import { IconEye } from "@tabler/icons-react";

import { useSession } from "@/lib/auth-client";
import { getPlanLimits } from "@/lib/limits";
import { IconLock } from "@tabler/icons-react";

const templates = getActiveTemplates();

export default function PilihTemplatePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [submittingSlug, setSubmittingSlug] = useState<string | null>(null);
  const [error, setError] = useState("");

  const userPlan = (session?.user as unknown as import("@/types/user").UserWithPlan)?.plan || "FREE";
  const limits = getPlanLimits(userPlan);

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
      <SiteHeader user={session?.user} />
      <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <Badge variant="outline" className="rounded-full px-4 py-1 border-primary/20 bg-primary/5 text-primary">
              Langkah 1 dari 3
            </Badge>
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-zinc-900 dark:text-zinc-50">Pilih Desain Undangan</h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">Temukan template yang paling sesuai dengan tema pernikahan Anda. Anda bisa mengubah kontennya nanti.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template) => {
              const isAllowed = limits.allowedTemplateTypes.includes(template.type);

              return (
                <div key={template.slug} className="group flex flex-col bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-zinc-100 dark:border-zinc-800">
                  {/* Image Section */}
                  <div className="aspect-4/5 relative overflow-hidden bg-zinc-100">
                    {template.thumbnail ? (
                      <Image src={template.thumbnail} alt={template.name} fill className={`object-cover transition-transform duration-700 ${isAllowed ? "group-hover:scale-105" : "grayscale opacity-80"}`} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-300">
                        <span className="text-4xl">✨</span>
                      </div>
                    )}

                    {!isAllowed && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white z-10">
                        <IconLock size={32} className="mb-2" />
                        <p className="font-medium text-sm">Premium Only</p>
                      </div>
                    )}

                    {/* Hover Overlay for Buttons */}
                    <div className={`absolute inset-0 bg-black/40 opacity-0 ${isAllowed ? "group-hover:opacity-100" : ""} transition-opacity duration-300 flex items-center justify-center gap-2`}>
                      <Button variant="secondary" className="rounded-full w-10 h-10 p-0 bg-white/90 hover:bg-white text-zinc-900" onClick={() => window.open(`/preview/${template.slug}`, "_blank")}>
                        <IconEye className="w-5 h-5" />
                      </Button>
                      <Button className="rounded-full bg-amber-500 hover:bg-amber-600 text-white px-6" onClick={() => handleSelect(template.slug)} disabled={submittingSlug === template.slug || !isAllowed}>
                        {submittingSlug === template.slug ? "..." : "Pilih"}
                      </Button>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 flex flex-col gap-1 items-start">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">{template.category}</span>
                    <h3 className="font-serif text-xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">{template.name}</h3>
                  </div>
                </div>
              );
            })}
          </div>

          {error && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 px-6 py-3 rounded-full shadow-lg border border-red-200 animate-in fade-in slide-in-from-bottom-4">{error}</div>}
        </div>
      </div>
    </>
  );
}
