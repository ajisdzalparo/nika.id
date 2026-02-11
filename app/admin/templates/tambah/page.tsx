/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AddTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");

  // Thumbnail State
  const [thumbnailMode, setThumbnailMode] = useState("upload"); // Default to upload
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  // Template File State
  const [file, setFile] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingThumbnail(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal upload gambar");

      const data = await res.json();
      setThumbnailUrl(data.url);
    } catch (error) {
      console.error(error);
      alert("Gagal mengupload thumbnail");
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Validasi Input
      if (!thumbnailUrl) {
        throw new Error("Thumbnail wajib diisi (URL atau Upload)");
      }

      if (!slug && name) {
        // Auto-generate slug if empty (though UI enforces it mostly)
        const generatedSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        setSlug(generatedSlug);
      }

      const finalSlug =
        slug ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

      // 2. Upload File Template (jika ada)
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("slug", finalSlug);
        formData.append("name", name);

        const uploadRes = await fetch("/api/templates/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || "Gagal upload file template");
        }
      }

      // 3. Simpan ke Database
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug: finalSlug,
          description,
          category,
          type: type === "premium" ? "Premium" : "Gratis",
          thumbnail: thumbnailUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Gagal menyimpan template ke database");
        setLoading(false);
        return;
      }

      router.push("/admin/templates");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan tak terduga");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tambah Template</h1>
          <p className="text-muted-foreground">Tambahkan desain undangan baru ke dalam sistem</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informasi Template</CardTitle>
          <CardDescription>Isi detail template undangan baru</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nama Desain</Label>
              <Input id="name" placeholder="Contoh: Romantic Autumn" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Component Key (ID)</Label>
              <Input
                id="slug"
                placeholder="romantic-autumn"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                // Not required, will auto-generate
              />
              <p className="text-xs text-muted-foreground">String unik untuk pemanggilan komponen. Kosongkan untuk auto-generate dari nama.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Deskripsi singkat tentang desain ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="klasik">Klasik</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="minimalis">Minimalis</SelectItem>
                  <SelectItem value="rustic">Rustic</SelectItem>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="elegant">Elegant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Thumbnail Section */}
            <div className="space-y-2">
              <Label>Thumbnail</Label>
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <Tabs defaultValue="upload" value={thumbnailMode} onValueChange={setThumbnailMode}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="upload">Upload Gambar</TabsTrigger>
                      <TabsTrigger value="url">URL Eksternal</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="space-y-4">
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="thumbnail-upload">Pilih File Gambar</Label>
                        <Input id="thumbnail-upload" type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={isUploadingThumbnail} />
                      </div>
                      {isUploadingThumbnail && <p className="text-sm text-muted-foreground">Mengupload...</p>}
                    </TabsContent>
                    <TabsContent value="url" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="thumbnail-url">URL Gambar</Label>
                        <Input id="thumbnail-url" placeholder="https://example.com/image.jpg" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Preview */}
                  {thumbnailUrl && (
                    <div className="mt-4">
                      <Label>Preview:</Label>
                      <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border mt-2">
                        <Image src={thumbnailUrl} alt="Thumbnail Preview" fill className="object-cover" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Template File Section */}
            <div className="space-y-2">
              <Label htmlFor="file">File Template (.tsx)</Label>
              <Input id="file" type="file" accept=".tsx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <p className="text-xs text-muted-foreground">Upload file komponen React (.tsx) untuk desain ini.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Label (Access Control)</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gratis">Gratis</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Template"}
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
  );
}
