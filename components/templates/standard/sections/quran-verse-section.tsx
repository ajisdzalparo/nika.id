"use client";

import React from "react";
import { IconHeart } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";

interface QuranVerseSectionProps {
  data: WeddingData;
}

export function QuranVerseSection({ data }: QuranVerseSectionProps) {
  if (!data.quote) return null;

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <IconHeart size={24} className="mx-auto text-rose-300 fill-rose-300" />
        <p className="text-base sm:text-lg leading-relaxed italic text-gray-600 font-serif">&ldquo;{data.quote.text}&rdquo;</p>
        <p className="text-sm font-bold uppercase tracking-wider text-rose-400">{data.quote.source}</p>
      </div>
    </section>
  );
}
