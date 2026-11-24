"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconPhotoPlus, IconX } from "@tabler/icons-react";

const MAX = 3;
const MAX_MB = 5;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

/** Attach up to three reference screenshots; files go to storage and their URLs are passed to the AI. */
export function ReferenceUploader({ value, onChange, disabled = false }: { value: string[]; onChange: (urls: string[]) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);

  const add = async (files: FileList | null) => {
    const list = Array.from(files ?? []).slice(0, MAX - value.length);
    if (!list.length) return;
    setUploading(list.length);
    const urls: string[] = [];
    for (const file of list) {
      if (!ACCEPT.includes(file.type)) {
        toast.error(`${file.name}: gunakan JPG, PNG, atau WebP`);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`${file.name}: maksimal ${MAX_MB}MB`);
        continue;
      }
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.url) urls.push(j.url);
      else toast.error(`${file.name}: upload gagal`);
    }
    setUploading(0);
    if (inputRef.current) inputRef.current.value = "";
    if (urls.length) onChange([...value, ...urls].slice(0, MAX));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((url) => (
          <div key={url} className="group relative h-20 w-14 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Screenshot referensi" className="h-full w-full object-cover object-top" />
            <button
              type="button"
              onClick={() => onChange(value.filter((u) => u !== url))}
              disabled={disabled}
              aria-label="Hapus referensi"
              className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-950/75 text-zinc-50"
            >
              <IconX size={12} />
            </button>
          </div>
        ))}
        {value.length < MAX && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading > 0}
            className="flex h-20 w-14 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-zinc-300 text-[10px] leading-tight text-zinc-500 transition-colors hover:border-[#8A6424] hover:text-zinc-700 disabled:opacity-50"
            aria-label="Tambah screenshot referensi"
          >
            {uploading ? <IconLoader2 size={18} className="animate-spin" /> : <IconPhotoPlus size={18} />}
            {uploading ? "…" : "Tambah"}
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-500">Lampirkan hingga {MAX} screenshot undangan yang disukai. AI meniru suasana, warna, dan gayanya, bukan menyalin isinya.</p>
      <input ref={inputRef} type="file" accept={ACCEPT.join(",")} multiple className="hidden" onChange={(e) => add(e.target.files)} />
    </div>
  );
}
