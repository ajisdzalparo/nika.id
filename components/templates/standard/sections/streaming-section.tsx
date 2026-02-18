"use client";

import React from "react";
import { IconDeviceTv } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";

interface StreamingSectionProps {
  data: WeddingData;
}

export function StreamingSection({ data }: StreamingSectionProps) {
  if (!data.streaming?.enabled || !data.streaming.url) return null;

  return (
    <section className="py-20 px-6 bg-[#FBF7F4]">
      <div className="max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mx-auto">
          <IconDeviceTv size={32} className="text-rose-500" />
        </div>
        <h2 className="text-3xl font-serif italic text-gray-900">Live Streaming</h2>
        <p className="text-sm text-gray-500 leading-relaxed">Jika berhalangan hadir, pernikahan kami dapat disaksikan secara langsung melalui link di bawah ini</p>
        <a
          href={data.streaming.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-rose-200 transition-all"
        >
          <IconDeviceTv size={18} /> Tonton via {data.streaming.platform || "Link"}
        </a>
      </div>
    </section>
  );
}
