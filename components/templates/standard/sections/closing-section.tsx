import React from "react";
import { WeddingData } from "@/types/wedding";
import { BotanicalDivider, extractInitials } from "../shared";

export function ClosingSection({ data }: { data: WeddingData }) {
  const initials = extractInitials(data.groom.nickname, data.bride.nickname);

  return (
    <footer className="bg-[#1E1B17] px-6 py-20 text-center text-[#F4EDE2]">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#C8B08A]/50 font-serif text-sm tracking-wider text-[#D8C49E]">
          {initials.a}
          <span className="mx-0.5 text-[11px] italic">&amp;</span>
          {initials.b}
        </div>

        <p className="text-[11px] uppercase tracking-[0.3em] text-[#C8B08A]">
          Terima Kasih
        </p>

        <p className="font-serif text-base italic leading-relaxed text-[#DDD3C4] sm:text-lg">
          Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i
          berkenan hadir untuk memberikan doa restu kepada kedua mempelai.
        </p>

        <BotanicalDivider tone="light" className="py-1" />

        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-[0.22em] text-[#AFA596]">
            Kami yang berbahagia
          </p>
          <p className="font-serif text-3xl font-normal text-[#FFFDF9] sm:text-4xl">
            {data.groom.nickname}
            <span className="mx-2 font-serif italic text-[#C8B08A]">&amp;</span>
            {data.bride.nickname}
          </p>
        </div>

        <div className="border-t border-white/10 pt-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#9A9082]">
            {data.agencyBranding?.name ? `Dibuat oleh ${data.agencyBranding.name}` : "Dibuat dengan SatuMoment"}
          </p>
        </div>
      </div>
    </footer>
  );
}
