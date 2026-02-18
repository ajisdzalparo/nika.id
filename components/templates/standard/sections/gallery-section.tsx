/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { WeddingData } from "@/types/wedding";

interface GallerySectionProps {
  data: WeddingData;
}

export function GallerySection({ data }: GallerySectionProps) {
  if (!data.gallery || data.gallery.length === 0) return null;

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-rose-400 font-semibold">Galeri</p>
          <h2 className="text-3xl sm:text-4xl font-serif italic text-gray-900">Momen Bahagia</h2>
          <div className="h-px w-16 bg-rose-300 mx-auto" />
        </div>
        <div className="columns-2 md:columns-3 gap-3 space-y-3">
          {data.gallery.map((photo, i) => (
            <div key={i} className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow break-inside-avoid">
              <img src={photo} alt={`Gallery ${i + 1}`} className="w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
