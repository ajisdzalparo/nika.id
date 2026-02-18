import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { getTemplateBySlug } from "@/lib/templates";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const template = getTemplateBySlug(id);

  if (!template) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
              <p className="text-muted-foreground">Detail template undangan</p>
            </div>
            <Link href={`/preview/${template.slug}`}>
              <Button>Live Preview</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="relative aspect-3/4 rounded-lg overflow-hidden border bg-muted">
                <Image src={template.thumbnail} alt={template.name} fill className="object-cover" />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Template</CardTitle>
                  <CardDescription>Detail metadata template ini (didefinisikan di source code)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Slug</p>
                      <p className="font-mono text-sm bg-muted px-2 py-1 rounded mt-1 inline-block">{template.slug}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Kategori</p>
                      <p className="mt-1">{template.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tipe</p>
                      <Badge variant={template.type === "Premium" ? "default" : "secondary"} className="mt-1">
                        {template.type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge variant={template.isActive ? "default" : "destructive"} className="mt-1">
                        {template.isActive ? "Aktif" : "Arsip"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Deskripsi</p>
                    <p className="text-sm mt-1">{template.description}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
