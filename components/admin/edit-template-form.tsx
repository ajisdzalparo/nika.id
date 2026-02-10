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

interface Template {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  type: string;
  thumbnail: string;
  isActive: boolean;
}

interface EditTemplateFormProps {
  template: Template;
}

export function EditTemplateForm({ template }: EditTemplateFormProps) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [slug, setSlug] = useState(template.slug);
  const [description, setDescription] = useState(template.description || "");
  const [category, setCategory] = useState(template.category);
  const [type, setType] = useState(template.type.toLowerCase());

  // Thumbnail State
  const [thumbnailMode, setThumbnailMode] = useState("url"); // Default to URL for edit, as it already exists
  const [thumbnailUrl, setThumbnailUrl] = useState(template.thumbnail);
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
      let body: any;
      let headers: any = {};

      if (file) {
        // Use FormData if file is being updated
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", name);
        formData.append("slug", slug);
        formData.append("description", description);
        formData.append("category", category);
        formData.append("type", type === "premium" ? "Premium" : "Gratis");
        formData.append("thumbnail", thumbnailUrl);
        // Browser sets Content-Type to multipart/form-data automatically including boundary
        body = formData;
      } else {
        // Use JSON for metadata only updates
        headers = {
          "Content-Type": "application/json",
        };
        body = JSON.stringify({
          name,
          slug,
          description,
          category,
          type: type === "premium" ? "Premium" : "Gratis",
          thumbnail: thumbnailUrl,
        });
      }

      const res = await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: headers,
        body: body,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Gagal mengupdate template");
        setLoading(false);
        return;
      }

      router.push("/admin/templates");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan tak terduga");
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Edit Template</CardTitle>
        <CardDescription>Ubah informasi template undangan</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Nama Desain</Label>
            <Input id="name" placeholder="Contoh: Romantic Autumn" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Component Key (ID)</Label>
            <Input id="slug" placeholder="romantic-autumn" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            <p className="text-xs text-muted-foreground">String unik yang merujuk ke file komponen .tsx.</p>
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
                <Tabs defaultValue="url" value={thumbnailMode} onValueChange={setThumbnailMode}>
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

          {/* File Replacement */}
          <div className="space-y-2">
            <Label htmlFor="file">Update File Component (.tsx)</Label>
            <Input id="file" type="file" accept=".tsx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-xs text-muted-foreground">Biarkan kosong jika tidak ingin mengubah logic component.</p>
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
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
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
  );
}
