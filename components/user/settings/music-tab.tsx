/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { IconBrandYoutube, IconUpload, IconLoader, IconCheck } from "@tabler/icons-react";
import { UpgradeBanner } from "../upgrade-banner";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { WeddingData } from "@/types/wedding";

interface MusicTabProps {
  invitation: { data: WeddingData };
  isEnabled: boolean;
}

export function MusicTab({ invitation, isEnabled }: MusicTabProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [musicUrl, setMusicUrl] = useState("");
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicType, setMusicType] = useState<"youtube" | "upload">("youtube");
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  useEffect(() => {
    if (invitation?.data) {
      setMusicUrl(invitation.data.music?.url || "");
      setMusicEnabled(invitation.data.music?.enabled ?? true);
      setMusicType(invitation.data.music?.type || "youtube");
    }
  }, [invitation]);

  const handleUploadAudio = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/audio", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal upload audio");
      }

      const data = await res.json();
      setMusicUrl(data.url);
      setUploadedFileName(file.name);
      toast.success("Audio berhasil diupload");
    } catch (e: any) {
      toast.error(e.message || "Gagal upload audio");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const currentData = invitation?.data || {};
      const newData = {
        ...currentData,
        music: { ...currentData.music, enabled: musicEnabled, url: musicUrl, type: musicType },
      };

      const res = await fetch("/api/user/invitation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: newData }),
      });

      if (!res.ok) throw new Error("Gagal update pengaturan");
      toast.success("Pengaturan musik berhasil disimpan");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TabsContent value="music" className="mt-0 space-y-4">
      {!isEnabled ? (
        <UpgradeBanner feature="Musik Latar" plan="Silver" />
      ) : (
        <div className="bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md rounded-xl p-6 border border-zinc-200/50 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

          <div className="mb-6 relative z-10">
            <h3 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-100">Background Music</h3>
            <p className="text-sm text-zinc-500">Pilih sumber musik latar untuk undangan Anda.</p>
          </div>

          <div className="space-y-5 relative z-10">
            {/* Source Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-500 uppercase">Sumber Musik</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMusicType("youtube");
                  }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                    musicType === "youtube" ? "border-red-500 bg-red-50 dark:bg-red-950/30 shadow-sm" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 hover:border-zinc-300"
                  }`}
                >
                  <IconBrandYoutube className={`w-5 h-5 ${musicType === "youtube" ? "text-red-500" : "text-zinc-400"}`} />
                  <div className="text-left">
                    <p className={`text-sm font-medium ${musicType === "youtube" ? "text-red-700 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400"}`}>Link YouTube</p>
                    <p className="text-[10px] text-zinc-400">Paste link video</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMusicType("upload");
                  }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                    musicType === "upload" ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50 hover:border-zinc-300"
                  }`}
                >
                  <IconUpload className={`w-5 h-5 ${musicType === "upload" ? "text-primary" : "text-zinc-400"}`} />
                  <div className="text-left">
                    <p className={`text-sm font-medium ${musicType === "upload" ? "text-primary" : "text-zinc-600 dark:text-zinc-400"}`}>Upload File</p>
                    <p className="text-[10px] text-zinc-400">MP3, WAV, OGG</p>
                  </div>
                </button>
              </div>
            </div>

            {/* YouTube Input */}
            {musicType === "youtube" && (
              <div className="space-y-2">
                <Label htmlFor="music-url" className="text-xs font-bold text-zinc-500 uppercase">
                  URL YouTube
                </Label>
                <Input
                  id="music-url"
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-primary"
                />
                <p className="text-[10px] text-zinc-400">Paste link YouTube yang ingin dijadikan musik latar.</p>
              </div>
            )}

            {/* Upload Input */}
            {musicType === "upload" && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-500 uppercase">File Audio</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/aac"
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
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-primary dark:hover:border-primary transition-colors bg-zinc-50/50 dark:bg-zinc-950/50 text-sm text-zinc-500 hover:text-primary"
                >
                  {uploading ? (
                    <>
                      <IconLoader className="animate-spin w-4 h-4" />
                      Mengupload...
                    </>
                  ) : musicUrl && uploadedFileName ? (
                    <>
                      <IconCheck className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">{uploadedFileName}</span>
                    </>
                  ) : musicUrl ? (
                    <>
                      <IconCheck className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400 truncate max-w-xs">Audio tersimpan</span>
                    </>
                  ) : (
                    <>
                      <IconUpload className="w-4 h-4" />
                      Klik untuk upload file audio
                    </>
                  )}
                </button>
                <p className="text-[10px] text-zinc-400">Maksimal 10MB. Format: MP3, WAV, OGG.</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input type="checkbox" id="music-enabled" checked={musicEnabled} onChange={(e) => setMusicEnabled(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
              <Label htmlFor="music-enabled" className="text-sm">
                Aktifkan Musik
              </Label>
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto rounded-lg mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? <IconLoader className="animate-spin w-4 h-4 mr-2" /> : null}
              Simpan Perubahan
            </Button>
          </div>
        </div>
      )}
    </TabsContent>
  );
}
