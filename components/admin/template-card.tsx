"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Template {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category: string;
  type: string;
  thumbnail: string;
  isActive: boolean;
  _count?: {
    users: number;
  };
}

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      await fetch(`/api/templates/${template.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !template.isActive }),
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to update status", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus template");

      router.refresh();
    } catch (error) {
      console.error("Failed to delete template", error);
      alert("Gagal menghapus template. Pastikan tidak ada user yang menggunakan template ini.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow group flex flex-col h-full">
      <div className="relative aspect-video">
        <Image src={template.thumbnail} alt={template.name} fill className="object-cover transition-transform group-hover:scale-105" />
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge variant={template.type === "Premium" ? "default" : "secondary"}>{template.type}</Badge>
          {!template.isActive && <Badge variant="destructive">Archived</Badge>}
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge variant="outline" className="bg-black/50 text-white border-transparent backdrop-blur-sm">
            Used by {template._count?.users || 0} users
          </Badge>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{template.name}</h3>
            <p className="text-xs text-muted-foreground font-mono bg-muted px-1 py-0.5 rounded inline-block mt-1">ID: {template.slug}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px] flex-1">{template.description || "Tidak ada deskripsi."}</p>

        <div className="grid grid-cols-2 gap-2 mt-auto">
          <Link href={`/admin/templates/${template.id}/preview`}>
            <Button variant="outline" size="sm" className="w-full">
              Preview
            </Button>
          </Link>
          <Link href={`/admin/templates/${template.id}`}>
            <Button variant="outline" size="sm" className="w-full">
              Edit
            </Button>
          </Link>

          <Button variant={template.isActive ? "secondary" : "default"} size="sm" onClick={handleToggleStatus} disabled={loading} className="w-full">
            {loading ? "..." : template.isActive ? "Arsipkan" : "Aktifkan"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full" disabled={isDeleting}>
                <IconTrash className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Template {template.name}?</AlertDialogTitle>
                <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan. Template akan dihapus permanen dari sistem. User yang sedang menggunakan template ini mungkin akan mengalami error.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
