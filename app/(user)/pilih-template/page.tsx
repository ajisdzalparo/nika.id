import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

// Mock template data
const templates = [
  {
    id: "1",
    name: "Classic Elegant",
    category: "Klasik",
    type: "Gratis",
    thumbnail: "/placeholder.svg",
  },
  {
    id: "2",
    name: "Modern Minimalist",
    category: "Modern",
    type: "Premium",
    thumbnail: "/placeholder.svg",
  },
  {
    id: "3",
    name: "Rustic Garden",
    category: "Outdoor",
    type: "Premium",
    thumbnail: "/placeholder.svg",
  },
  {
    id: "4",
    name: "Vintage Romance",
    category: "Klasik",
    type: "Gratis",
    thumbnail: "/placeholder.svg",
  },
];

export default function PilihTemplatePage() {
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
                <div className="relative aspect-[3/4] bg-muted">
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
                    <Button size="sm">Pilih Template</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
