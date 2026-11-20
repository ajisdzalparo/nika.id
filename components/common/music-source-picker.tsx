"use client";

import { useEffect, useRef, useState } from "react";
import { IconBrandYoutube, IconCheck, IconLoader2, IconMusic, IconPlayerPause, IconPlayerPlay, IconTrash, IconUpload } from "@tabler/icons-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractYouTubeId } from "@/components/common/music-toggle";

export interface DefaultMusicItem {
  id: string;
  title: string;
  artist?: string;
  type: "youtube" | "upload";
  url: string;
}

interface MusicSourcePickerProps {
  type?: "youtube" | "upload";
  url: string;
  onChangeType: (type: "youtube" | "upload") => void;
  onChangeUrl: (url: string) => void;
  allowDefaults?: boolean;
}

export function MusicSourcePicker({ type, url, onChangeType, onChangeUrl, allowDefaults = true }: MusicSourcePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [defaults, setDefaults] = useState<DefaultMusicItem[]>([]);
  const [tab, setTab] = useState<"default" | "youtube" | "upload">(() => {
    if (type) return type;
    if (url && !extractYouTubeId(url)) return "upload";
    return "youtube";
  });
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    if (!allowDefaults) return;
    let active = true;
    fetch("/api/music/defaults")
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        const list = (d.items ?? []) as DefaultMusicItem[];
        setDefaults(list);
        if (!url && list.length > 0) {
          setTab("default");
        }
      })
      .catch(() => {});
    return () => {
      active = false;
      previewAudioRef.current?.pause();
    };
  }, [allowDefaults, url]);

  useEffect(() => {
    if (type && tab !== "default" && tab !== type) {
      setTab(type);
    }
  }, [type, tab]);

  const effectiveTab = allowDefaults && defaults.length > 0 && tab === "default" ? "default" : tab === "default" ? "youtube" : tab;
  const youtubeId = effectiveTab === "youtube" ? extractYouTubeId(url) : null;

  const togglePreview = (item: DefaultMusicItem) => {
    if (item.type !== "upload") {
      window.open(item.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (playingId === item.id) {
      previewAudioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    previewAudioRef.current?.pause();
    const audio = new Audio(item.url);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => toast.error("Tidak dapat memutar pratinjau audio"));
    previewAudioRef.current = audio;
    setPlayingId(item.id);
  };

  const handleUploadAudio = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/audio", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Gagal upload audio");
      }

      setTab("upload");
      onChangeType("upload");
      onChangeUrl(data.url);
      setUploadedFileName(file.name);
      toast.success("Audio berhasil diunggah ke storage");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal upload audio");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const hasDefaults = allowDefaults && defaults.length > 0;

  return (
    <div className="space-y-4 rounded-xl border border-[#E1D8C9] bg-[#F7F3EC]/60 p-4">
      <div className="space-y-2">
        <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B6358]">Sumber Musik</Label>
        <div className={`grid grid-cols-1 gap-2.5 ${hasDefaults ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          {hasDefaults && (
            <button
              type="button"
              onClick={() => setTab("default")}
              className={`flex min-h-14 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
                effectiveTab === "default"
                  ? "border-[#1E1B17] bg-[#FFFDF9] text-[#1E1B17] shadow-xs"
                  : "border-[#E1D8C9] bg-[#FFFDF9]/50 text-[#6B6358] hover:border-[#CFC5B4] hover:bg-[#FFFDF9]"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  effectiveTab === "default" ? "bg-[#1E1B17] text-[#F7F3EC]" : "bg-[#EFE8DC] text-[#8A6A2F]"
                }`}
              >
                <IconMusic size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">Musik Default</p>
                <p className="mt-0.5 truncate text-xs text-[#6B6358]">{defaults.length} pilihan siap pakai</p>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setTab("youtube");
              onChangeType("youtube");
            }}
            className={`flex min-h-14 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
              effectiveTab === "youtube"
                ? "border-[#1E1B17] bg-[#FFFDF9] text-[#1E1B17] shadow-xs"
                : "border-[#E1D8C9] bg-[#FFFDF9]/50 text-[#6B6358] hover:border-[#CFC5B4] hover:bg-[#FFFDF9]"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                effectiveTab === "youtube" ? "bg-[#1E1B17] text-[#F7F3EC]" : "bg-[#EFE8DC] text-[#8A6A2F]"
              }`}
            >
              <IconBrandYoutube size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">Link YouTube</p>
              <p className="mt-0.5 truncate text-xs text-[#6B6358]">Tempel link YouTube</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("upload");
              onChangeType("upload");
            }}
            className={`flex min-h-14 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
              effectiveTab === "upload"
                ? "border-[#1E1B17] bg-[#FFFDF9] text-[#1E1B17] shadow-xs"
                : "border-[#E1D8C9] bg-[#FFFDF9]/50 text-[#6B6358] hover:border-[#CFC5B4] hover:bg-[#FFFDF9]"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                effectiveTab === "upload" ? "bg-[#1E1B17] text-[#F7F3EC]" : "bg-[#EFE8DC] text-[#8A6A2F]"
              }`}
            >
              <IconUpload size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">Upload Audio (S3)</p>
              <p className="mt-0.5 truncate text-xs text-[#6B6358]">MP3, WAV, OGG, M4A</p>
            </div>
          </button>
        </div>
      </div>

      {effectiveTab === "default" && (
        <div className="space-y-2">
          {defaults.map((item) => {
            const selected = url === item.url;
            const playing = playingId === item.id;
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                  selected ? "border-[#1E1B17] bg-[#FFFDF9]" : "border-[#E1D8C9] bg-[#FFFDF9]/75 hover:bg-[#FFFDF9]"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => togglePreview(item)}
                    aria-label={item.type === "upload" ? (playing ? "Jeda lagu" : "Putar pratinjau") : "Buka di YouTube"}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFE8DC] text-[#8A6A2F] transition-colors hover:bg-[#E4DCCF]"
                  >
                    {item.type === "youtube" ? (
                      <IconBrandYoutube size={17} />
                    ) : playing ? (
                      <IconPlayerPause size={16} />
                    ) : (
                      <IconPlayerPlay size={16} />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#1E1B17]">{item.title}</p>
                    <p className="truncate text-xs text-[#6B6358]">
                      {item.artist ? `${item.artist} · ` : ""}
                      {item.type === "youtube" ? "YouTube" : "Audio S3"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onChangeType(item.type);
                    onChangeUrl(item.url);
                    setUploadedFileName(item.title);
                  }}
                  className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-medium transition-colors ${
                    selected ? "bg-[#1E1B17] text-[#F7F3EC]" : "border border-[#CFC5B4] bg-white text-[#1E1B17] hover:bg-[#EFE8DC]"
                  }`}
                >
                  {selected && <IconCheck size={14} />}
                  {selected ? "Dipilih" : "Pilih"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {effectiveTab === "youtube" && (
        <div className="space-y-2">
          <Label htmlFor="music-youtube-url" className="text-xs font-medium text-[#4A443B]">
            URL Video YouTube
          </Label>
          <Input
            id="music-youtube-url"
            value={url}
            onChange={(e) => {
              onChangeType("youtube");
              onChangeUrl(e.target.value);
            }}
            placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
            className="h-11 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]"
          />
          {url ? (
            youtubeId ? (
              <p className="flex items-center gap-1.5 text-xs text-emerald-700">
                <IconCheck size={14} /> Link YouTube terbaca (ID: {youtubeId})
              </p>
            ) : (
              <p className="text-xs text-amber-700">Format link YouTube belum dikenali. Contoh: https://youtu.be/xxxx atau youtube.com/watch?v=xxxx</p>
            )
          ) : (
            <p className="text-xs text-[#6B6358]">Mendukung link youtube.com, youtu.be, shorts, dan music.youtube.com.</p>
          )}
        </div>
      )}

      {effectiveTab === "upload" && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/m4a,audio/aac,audio/webm"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadAudio(file);
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex min-h-20 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#CFC5B4] bg-[#FFFDF9] px-4 py-4 text-center transition-colors hover:border-[#8A6A2F] disabled:opacity-60"
          >
            {uploading ? (
              <span className="flex items-center gap-2 text-sm font-medium text-[#1E1B17]">
                <IconLoader2 size={18} className="animate-spin text-[#8A6A2F]" />
                Mengunggah file audio ke S3...
              </span>
            ) : (
              <>
                <span className="flex items-center gap-2 text-sm font-medium text-[#1E1B17]">
                  <IconUpload size={17} className="text-[#8A6A2F]" />
                  {url ? "Ganti file audio" : "Pilih atau unggah file audio"}
                </span>
                <span className="text-xs text-[#6B6358]">MP3, WAV, OGG, M4A, AAC · Maksimal 10MB</span>
              </>
            )}
          </button>

          {url && !extractYouTubeId(url) && (
            <div className="space-y-2.5 rounded-xl border border-[#E1D8C9] bg-[#FFFDF9] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EFE8DC] text-[#8A6A2F]">
                    <IconMusic size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-[#1E1B17]">{uploadedFileName || "Audio tersimpan di storage"}</p>
                    <p className="truncate text-[11px] text-[#6B6358]">{url}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onChangeUrl("");
                    setUploadedFileName("");
                  }}
                  aria-label="Hapus audio"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#6B6358] transition-colors hover:bg-[#EFE8DC] hover:text-red-600"
                >
                  <IconTrash size={15} />
                </button>
              </div>
              <audio controls src={url} className="h-9 w-full" preload="metadata" />
            </div>
          )}

          <details className="text-xs text-[#6B6358]">
            <summary className="cursor-pointer py-1 hover:text-[#1E1B17]">Atau tempel link audio MP3 langsung</summary>
            <Input
              value={url}
              onChange={(e) => {
                onChangeType("upload");
                onChangeUrl(e.target.value);
              }}
              placeholder="https://.../lagu.mp3"
              className="mt-2 h-10 rounded-xl border-[#E1D8C9] bg-[#FFFDF9]"
            />
          </details>
        </div>
      )}
    </div>
  );
}
