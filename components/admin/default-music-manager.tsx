"use client";

import { useState } from "react";
import { IconLoader2, IconMusic, IconPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { MusicSourcePicker } from "@/components/common/music-source-picker";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AdminDefaultMusic {
  id: string;
  title: string;
  artist: string;
  type: "youtube" | "upload";
  url: string;
  isActive: boolean;
}

export function DefaultMusicManager({ initialItems }: { initialItems: AdminDefaultMusic[] }) {
  const [items, setItems] = useState<AdminDefaultMusic[]>(initialItems);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [type, setType] = useState<"youtube" | "upload">("upload");
  const [url, setUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminDefaultMusic | null>(null);
  const [deleting, setDeleting] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      return toast.error("Judul lagu dan sumber musik wajib diisi");
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/default-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), artist: artist.trim(), type, url: url.trim(), isActive }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j.message || "Gagal menambah musik default");
      setItems((prev) => [j.item, ...prev]);
      setTitle("");
      setArtist("");
      setUrl("");
      toast.success("Musik default ditambahkan");
    } finally {
      setSaving(false);
    }
  };

  const toggleShow = async (item: AdminDefaultMusic) => {
    const next = !item.isActive;
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, isActive: next } : x)));
    const res = await fetch(`/api/admin/default-music/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: next }),
    });
    if (!res.ok) {
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, isActive: item.isActive } : x)));
      return toast.error("Gagal mengubah status tampilan");
    }
    toast.success(next ? `“${item.title}” ditampilkan ke user` : `“${item.title}” disembunyikan`);
  };

  const remove = async (item: AdminDefaultMusic) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/default-music/${item.id}`, { method: "DELETE" });
      if (!res.ok) return toast.error("Gagal menghapus musik");
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      toast.success("Musik default dihapus");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EDDD] text-[#8A6424]">
            <IconMusic size={20} />
          </span>
          <div>
            <CardTitle>Musik Default Undangan</CardTitle>
            <CardDescription>Kelola daftar lagu bawaan dan atur lagu mana yang ditampilkan (Show/Hide) ke user maupun pilihan template.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={add} className="space-y-4 rounded-xl border border-[#E9DDC6] bg-[#FFFDF9] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="dm-title">Judul Lagu</Label>
              <Input id="dm-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mis. A Thousand Years (Piano)" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dm-artist">Artis / Nuansa (Opsional)</Label>
              <Input id="dm-artist" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Mis. Instrumental Romantis" />
            </div>
          </div>

          <MusicSourcePicker type={type} url={url} onChangeType={setType} onChangeUrl={setUrl} allowDefaults={false} />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 text-sm text-[#4A443B]">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-[#1F1A14]" />
              Tampilkan langsung ke user (Show)
            </label>
            <Button type="submit" disabled={saving} className="h-10 rounded-full px-5">
              {saving ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconPlus className="mr-2 h-4 w-4" />}
              Tambah Musik Default
            </Button>
          </div>
        </form>

        <div className="space-y-2.5">
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E9DDC6] py-8 text-center text-sm text-muted-foreground">
              Belum ada musik default. Tambahkan lewat form di atas.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-[#E9DDC6] bg-[#FFFDF9] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-[#1F1A14]">{item.title}</p>
                    <span className="rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-2 py-0.5 text-[11px] text-[#6B5F50]">
                      {item.type === "youtube" ? "YouTube" : "Audio S3"}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${item.isActive ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-500"}`}>
                      {item.isActive ? "Ditampilkan" : "Disembunyikan"}
                    </span>
                  </div>
                  {item.artist && <p className="text-xs text-[#6B5F50]">{item.artist}</p>}
                  {item.type === "upload" ? (
                    <audio controls src={item.url} className="mt-2 h-8 w-full max-w-md" preload="none" />
                  ) : (
                    <a href={item.url} target="_blank" rel="noreferrer" className="block truncate text-xs text-[#8A6424] hover:underline">
                      {item.url}
                    </a>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6B5F50]">Show</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.isActive}
                      aria-label={`Tampilkan ${item.title}`}
                      onClick={() => toggleShow(item)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${item.isActive ? "bg-[#1F1A14]" : "bg-[#D9CBAE]"}`}
                    >
                      <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-[#FFFDF9] transition-transform ${item.isActive ? "translate-x-5.5" : "translate-x-1"}`} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    aria-label={`Hapus ${item.title}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6B5F50] transition-colors hover:bg-[#F5EDDD] hover:text-red-600"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent className="border-[#EDE3CF] bg-[#FFFDF9] text-[#1A1510] sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-medium text-[#1A1510]">
              Hapus musik default?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#5E5446]">
              Lagu &ldquo;{deleteTarget?.title}&rdquo; akan dihapus dari daftar musik bawaan undangan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={deleting} className="rounded-full border-[#E9DDC6] bg-white text-[#40372B] hover:bg-[#FCF8F1]">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) void remove(deleteTarget);
              }}
              className="rounded-full bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Menghapus..." : "Ya, hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
