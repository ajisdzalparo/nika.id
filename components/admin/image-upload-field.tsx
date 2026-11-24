"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { IconLink, IconLoader2, IconPhotoUp, IconX } from "@tabler/icons-react";

const MAX_MB = 5;
const ACCEPT = "image/jpeg,image/png,image/webp";

/** True when the Tailwind aspect class is landscape (e.g. aspect-[16/9]); those boxes get full width instead of a narrow column. */
function isLandscape(aspect: string) {
  const m = aspect.match(/aspect-\[(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\]/);
  if (m) return Number(m[1]) > Number(m[2]);
  return aspect === "aspect-video";
}

/**
 * Uploads an image to storage (/api/upload/image) and returns its public URL; a pasted URL also works.
 * `fit="contain"` shows the whole image (logos, QRIS); the default crops to fill (thumbnails, photos).
 */
export function ImageUploadField({
  value,
  onChange,
  onUploaded,
  aspect = "aspect-[9/16]",
  fit = "cover",
  fullWidth = false,
  compact = false,
  placeholder,
}: {
  value: string;
  onChange: (url: string) => void;
  /** Called only when a file finishes uploading to storage (not while typing a URL). */
  onUploaded?: (url: string) => void;
  aspect?: string;
  fit?: "cover" | "contain";
  /** Fill the parent container width instead of capping landscape boxes at max-w-sm. */
  fullWidth?: boolean;
  /** Tighter height & spacing for embedded studio panels. */
  compact?: boolean;
  placeholder?: string;
}) {
  const wide = isLandscape(aspect);
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
      if (onUploaded) {
        onUploaded(j.url);
      } else {
        onChange(j.url);
        toast.success("Gambar terunggah");
      }
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
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
          fullWidth ? "w-full" : wide ? "w-full max-w-sm" : "w-40"
        } ${value ? aspect : `${aspect} ${compact ? "min-h-28" : "min-h-36"}`} ${
          dragging
            ? "border-[#8A6424] bg-[#F5E8CA]"
            : value
              ? "border-[#E9DDC6] bg-[#FCF8F1]"
              : "border-[#D6CBB8] bg-[#FCF8F1] hover:border-[#B8AD9A]"
        }`}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Pratinjau gambar" className={`absolute inset-0 h-full w-full ${fit === "contain" ? "object-contain p-3" : "object-cover"}`} />
            <button type="button" onClick={() => onChange("")} aria-label="Hapus gambar" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950/70 text-zinc-50 hover:bg-zinc-950">
              <IconX size={15} />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 text-center"
          >
            <span className={`flex shrink-0 items-center justify-center rounded-full bg-[#F5E8CA] text-[#8A6424] ${compact ? "h-9 w-9" : "h-10 w-10"}`}>
              {uploading ? <IconLoader2 size={compact ? 18 : 20} className="animate-spin" /> : <IconPhotoUp size={compact ? 18 : 20} />}
            </span>
            <span className={`${compact ? "text-xs" : "text-sm"} font-medium text-[#40372B]`}>
              {uploading ? "Mengunggah…" : placeholder ?? (wide || fullWidth ? "Klik atau seret gambar ke sini" : "Pilih gambar")}
            </span>
            <span className="text-[11px] text-[#7D7468]">JPG, PNG, WebP · maks {MAX_MB}MB</span>
          </button>
        )}
        {uploading && value && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <IconLoader2 size={22} className="animate-spin" />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      <div className={`flex flex-wrap items-center gap-3 ${compact ? "text-xs" : "text-sm"}`}>
        {value && (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="min-h-8 text-zinc-700 underline-offset-4 hover:underline">
            Ganti gambar
          </button>
        )}
        <button type="button" onClick={() => setShowUrl((s) => !s)} className="flex min-h-8 items-center gap-1 text-zinc-500 hover:text-zinc-800">
          <IconLink size={13} /> {showUrl ? "Tutup URL" : "Pakai URL gambar"}
        </button>
      </div>
      {showUrl && (
        <input
          className={`${compact ? "h-9 text-xs" : "h-11 text-[15px]"} w-full rounded-xl border border-zinc-200 bg-white px-3.5 outline-none focus:border-zinc-400`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
        />
      )}
    </div>
  );
}
