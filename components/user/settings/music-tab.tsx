"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { MusicSourcePicker } from "@/components/common/music-source-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { WeddingData } from "@/types/wedding";
import { UpgradeBanner } from "../upgrade-banner";

interface MusicTabProps {
  invitation: { data: WeddingData };
  isEnabled: boolean;
}

export function MusicTab({ invitation, isEnabled }: MusicTabProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [musicUrl, setMusicUrl] = useState("");
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicType, setMusicType] = useState<"youtube" | "upload">("youtube");

  useEffect(() => {
    if (invitation?.data) {
      setMusicUrl(invitation.data.music?.url || "");
      setMusicEnabled(invitation.data.music?.enabled ?? true);
      setMusicType(invitation.data.music?.type || "youtube");
    }
  }, [invitation]);

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
        <div className="rounded-2xl border border-[#E9DDC6] bg-[#FFFDF9] p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-medium text-[#1F1A14]">Musik Latar</h3>
              <p className="text-sm text-[#6B5F50]">Pilih musik dari link YouTube atau unggah file audio ke S3.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={musicEnabled}
              aria-label="Aktifkan musik latar"
              onClick={() => setMusicEnabled((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${musicEnabled ? "bg-[#1F1A14]" : "bg-[#D9CBAE]"}`}
            >
              <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-[#FFFDF9] transition-transform ${musicEnabled ? "translate-x-5.5" : "translate-x-1"}`} />
            </button>
          </div>

          <MusicSourcePicker type={musicType} url={musicUrl} onChangeType={setMusicType} onChangeUrl={setMusicUrl} />

          <div className="flex items-center justify-between border-t border-[#E9DDC6] pt-4">
            <Label className="text-xs text-[#6B5F50]">Musik diputar saat tamu mengetuk “Buka Undangan”.</Label>
            <Button onClick={handleSave} disabled={loading} className="h-11 rounded-full bg-[#1F1A14] px-6 text-[#FCF8F1] hover:bg-[#2E2A24]">
              {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </div>
        </div>
      )}
    </TabsContent>
  );
}
