"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

type Template = {
  id: string;
  name: string;
  category: string;
  type: string;
  thumbnail: string;
};

export default function PilihTemplatePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/templates");
        if (!res.ok) throw new Error("Gagal memuat template");
        const data = await res.json();
        setTemplates(data);
      } catch (err) {
        console.error(err);
        setError("Tidak dapat memuat daftar template");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSelect = async (templateId: string) => {
    setError("");
    setSubmittingId(templateId);
    try {
      const res = await fetch("/api/user/template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ templateId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Gagal memilih template");
        setSubmittingId(null);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan tak terduga");
      setSubmittingId(null);
    }
  };
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pilih Template</h1>
            <p className="text-muted-foreground">Pilih desain undangan yang sesuai dengan tema pernikahan Anda</p>
          </div>

          {/* Template Catalog */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="relative aspect-3/4 bg-muted">
                  <Image src={template.thumbnail} alt={template.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary">Live Preview</Button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.category}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={template.type === "Premium" ? "default" : "secondary"}>{template.type}</Badge>
                    <Button
                      size="sm"
                      onClick={() => handleSelect(template.id)}
                      disabled={submittingId === template.id}
                    >
                      {submittingId === template.id ? "Memilih..." : "Pilih Template"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loading && <p className="text-sm text-muted-foreground">Memuat template...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </>
  );
}
