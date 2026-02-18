"use client";

import React from "react";
import { WeddingData } from "@/types/wedding";

interface LoveStorySectionProps {
  data: WeddingData;
}

export function LoveStorySection({ data }: LoveStorySectionProps) {
  if (!data.loveStory?.enabled || data.loveStory.chapters.length === 0) return null;

  return (
    <section className="py-20 px-6 bg-[#FBF7F4]">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-rose-400 font-semibold">Cerita Kami</p>
          <h2 className="text-3xl sm:text-4xl font-serif italic text-gray-900">Love Story</h2>
          <div className="h-px w-16 bg-rose-300 mx-auto" />
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-rose-200" />

          <div className="space-y-10">
            {data.loveStory.chapters.map((chapter, i) => (
              <div key={i} className="relative pl-16">
                {/* Timeline dot */}
                <div className="absolute left-4 top-1 w-5 h-5 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 border-4 border-[#FBF7F4] shadow" />
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{chapter.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{chapter.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
