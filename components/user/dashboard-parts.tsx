"use client";

import { useState } from "react";
import { IconBrandWhatsapp, IconCheck, IconCopy } from "@tabler/icons-react";

export function ShareLink({ url, couple }: { url: string; couple: string }) {
  const [copied, setCopied] = useState(false);
  const text = `Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di pernikahan ${couple}.\n\n${url}`;

  return (
    <div className="space-y-3">
      <div className="flex min-h-12 items-center rounded-xl border border-[#E1D8C9] bg-[#F7F3EC] px-4">
        <span className="truncate font-mono text-[13px] text-[#6B6358]">{url.replace(/^https?:\/\//, "")}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            navigator.clipboard?.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
          className="flex h-11 items-center justify-center gap-2 rounded-full border border-[#1E1B17] text-sm font-medium text-[#1E1B17] transition-colors hover:bg-[#1E1B17] hover:text-[#F7F3EC]"
        >
          {copied ? <IconCheck size={17} /> : <IconCopy size={17} />} {copied ? "Tersalin" : "Salin link"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#1E1B17] text-sm font-medium text-[#F7F3EC] transition-opacity hover:opacity-90"
        >
          <IconBrandWhatsapp size={17} /> Kirim ke WA
        </a>
      </div>
    </div>
  );
}
