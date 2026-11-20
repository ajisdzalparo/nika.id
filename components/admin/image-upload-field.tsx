"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { IconLink, IconLoader2, IconPhotoUp, IconX } from "@tabler/icons-react";

const MAX_MB = 5;
const ACCEPT = "image/jpeg,image/png,image/webp";

/** Uploads an image to storage (/api/upload/image) and returns its public URL; a pasted URL also works. */
export function ImageUploadField({ value, onChange, aspect = "aspect-[9/16]" }: { value: string; onChange: (url: string) => void; aspect?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) return toast.error("Gunakan gambar JPG, PNG, atau WebP");
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`Ukuran maksimal ${MAX_MB}MB`);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.url) throw new Error(j.error || "Upload gagal");
      onChange(j.url);
      toast.success("Gambar terunggah");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files?.[0]);
        }}
        className={`relative w-40 overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${aspect} ${dragging ? "border-[#8A6A2F] bg-[#F4EAD6]" : "border-zinc-300 bg-zinc-50"}`}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Thumbnail" className="absolute inset-0 h-full w-full object-cover" />
            <button type="button" onClick={() => onChange("")} aria-label="Hapus gambar" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950/70 text-zinc-50 hover:bg-zinc-950">
              <IconX size={15} />
            </button>
          </>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center text-xs text-zinc-500">
            {uploading ? <IconLoader2 size={22} className="animate-spin text-[#8A6A2F]" /> : <IconPhotoUp size={22} className="text-[#8A6A2F]" />}
            {uploading ? "Mengunggah…" : "Klik atau seret gambar ke sini"}
            <span className="text-[11px] text-zinc-400">JPG, PNG, WebP · maks {MAX_MB}MB</span>
          </button>
        )}
        {uploading && value && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <IconLoader2 size={22} className="animate-spin" />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {value && (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="min-h-9 text-zinc-700 underline-offset-4 hover:underline">
            Ganti gambar
          </button>
        )}
        <button type="button" onClick={() => setShowUrl((s) => !s)} className="flex min-h-9 items-center gap-1 text-zinc-500 hover:text-zinc-800">
          <IconLink size={14} /> {showUrl ? "Tutup" : "Pakai URL"}
        </button>
      </div>
      {showUrl && (
        <input
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-[15px] outline-none focus:border-zinc-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
        />
      )}
    </div>
  );
}
