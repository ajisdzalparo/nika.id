import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

// Mock template data
const templates = [
  {
    id: "1",
    name: "Classic Elegant",
    category: "Klasik",
    type: "Gratis",
    thumbnail: "/placeholder.svg",
    status: "Aktif",
  },
  {
    id: "2",
    name: "Modern Minimalist",
    category: "Modern",
    type: "Premium",
    thumbnail: "/placeholder.svg",
    status: "Aktif",
  },
  {
    id: "3",
    name: "Rustic Garden",
    category: "Outdoor",
    type: "Premium",
    thumbnail: "/placeholder.svg",
    status: "Aktif",
  },
  {
    id: "4",
    name: "Vintage Romance",
    category: "Klasik",
    type: "Gratis",
    thumbnail: "/placeholder.svg",
    status: "Archived",
  },
];

export default function TemplatesPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Template Forge</h1>
              <p className="text-muted-foreground">Manajemen desain undangan pernikahan</p>
            </div>
            <Link href="/admin/templates/tambah">
              <Button>Tambah Template</Button>
            </Link>
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-3/4 bg-muted">
                  <Image src={template.thumbnail} alt={template.name} fill className="object-cover" />
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={template.type === "Premium" ? "default" : "secondary"}>{template.type}</Badge>
                    <Badge variant={template.status === "Aktif" ? "default" : "outline"}>{template.status}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      {template.status === "Aktif" ? "Arsipkan" : "Aktifkan"}
                    </Button>
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
