import React from "react";
import { WeddingData } from "@/types/wedding";
import { BotanicalDivider } from "../shared";

export function QuranVerseSection({ data }: { data: WeddingData }) {
  if (!data.quote) return null;

  return (
    <section className="border-b border-[#E5DCCF] bg-[#F2ECE2]/75 px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-2xl border border-[#DFD4C4] bg-[#FFFDF9] px-6 py-10 text-center shadow-[0_18px_45px_-30px_rgba(31,28,24,0.22)] sm:px-12 sm:py-12">
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#9A7B4F]">
          Firman &amp; Doa
        </p>
        <blockquote className="mt-5 font-serif text-base italic leading-relaxed text-[#3E3830] sm:text-lg">
          &ldquo;{data.quote.text}&rdquo;
        </blockquote>
        <BotanicalDivider className="my-6" />
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#8A6D43]">
          {data.quote.source}
        </p>
      </div>
    </section>
  );
}
