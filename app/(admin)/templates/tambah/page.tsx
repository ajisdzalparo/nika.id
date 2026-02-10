import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function AddTemplatePage() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tambah Template Baru</h1>
            <p className="text-muted-foreground">Upload desain undangan baru ke katalog</p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Form Template</CardTitle>
              <CardDescription>Lengkapi informasi template undangan</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Template</Label>
                  <Input id="name" placeholder="Contoh: Classic Elegant" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="klasik">Klasik</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="outdoor">Outdoor</SelectItem>
                      <SelectItem value="minimalis">Minimalis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="component-id">ID Komponen Kode</Label>
                  <Input id="component-id" placeholder="template-classic-01" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Upload Thumbnail</Label>
                  <Input id="thumbnail" type="file" accept="image/*" required />
                  <p className="text-xs text-muted-foreground">Ukuran optimal: 600x800px, format: JPG/PNG</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipe Template</Label>
                  <Select>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gratis">Gratis</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1">
                    Simpan Template
                  </Button>
                  <Link href="/admin/templates" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Batal
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
