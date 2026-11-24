"use client";

import { useEffect, useState } from "react";
import { IconBrandWhatsapp, IconCheck, IconCopy } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export function ShareLink({ url, couple }: { url: string; couple: string }) {
  const [copied, setCopied] = useState(false);
  const text = `Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di pernikahan ${couple}.\n\n${url}`;

  return (
    <div className="space-y-3">
      <div className="flex min-h-12 items-center rounded-xl border border-[#E9DDC6] bg-[#FCF8F1] px-4">
        <span className="truncate font-mono text-[13px] text-[#6B5F50]">{url.replace(/^https?:\/\//, "")}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            navigator.clipboard?.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
          className="h-11 rounded-full border-[#1F1A14] text-[#1F1A14] hover:bg-[#1F1A14] hover:text-[#FCF8F1]"
        >
          {copied ? <IconCheck size={17} /> : <IconCopy size={17} />} {copied ? "Tersalin" : "Salin link"}
        </Button>
        <Button asChild variant="gold" className="h-11">
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
            <IconBrandWhatsapp size={17} /> Kirim ke WA
          </a>
        </Button>
      </div>
    </div>
  );
}

/** Live days / hours / minutes / seconds until the wedding, in frosted glass tiles. */
export function LiveCountdown({ target }: { target: string }) {
  const end = new Date(target).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  const left = Math.max(0, end - (now ?? end));
  const parts = [
    { label: "Hari", value: Math.floor(left / 86_400_000) },
    { label: "Jam", value: Math.floor(left / 3_600_000) % 24 },
    { label: "Menit", value: Math.floor(left / 60_000) % 60 },
    { label: "Detik", value: Math.floor(left / 1000) % 60 },
  ];
  return (
    <div className="flex gap-2" aria-label="Hitung mundur hari pernikahan">
      {parts.map((p) => (
        <div key={p.label} className="flex min-w-[58px] flex-col items-center rounded-xl border border-white/20 bg-white/10 px-2 py-2 backdrop-blur-md">
          <span className="font-(family-name:--font-landing-display) text-2xl tabular-nums lining-nums leading-none text-white sm:text-[1.7rem]" suppressHydrationWarning>
            {now === null ? "–" : String(p.value).padStart(p.label === "Hari" ? 1 : 2, "0")}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/70">{p.label}</span>
        </div>
      ))}
    </div>
  );
}
