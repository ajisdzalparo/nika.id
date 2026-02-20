"use client";

import React from "react";
import { IconHeart } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";

interface ClosingSectionProps {
  data: WeddingData;
}

export function ClosingSection({ data }: ClosingSectionProps) {
  return (
    <>
      <section className="py-20 px-6 bg-linear-to-b from-white to-rose-50 text-center">
        <div className="max-w-lg mx-auto space-y-6">
          <p className="text-sm text-gray-500 leading-relaxed">Atas kehadiran dan doa restunya kami ucapkan terima kasih</p>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-rose-400 font-semibold">Kami Yang Berbahagia</p>
            <h2 className="text-4xl sm:text-5xl font-serif italic text-gray-900">
              {data.groom.nickname} &amp; {data.bride.nickname}
            </h2>
          </div>
          <IconHeart size={24} className="mx-auto text-rose-300 fill-rose-300" />
        </div>
      </section>

      <footer className="py-8 px-6 bg-gray-900 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Design with 💕 by nika.id</p>
      </footer>
    </>
  );
}
