"use client";

import React, { useState } from "react";
import { IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";
import { SectionHeader } from "../shared";

export function GallerySection({ data }: { data: WeddingData }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data.gallery || data.gallery.length === 0) return null;

  const total = data.gallery.length;
  const goPrev = () =>
    setActiveIndex((prev) => (prev === null ? null : (prev - 1 + total) % total));
  const goNext = () =>
    setActiveIndex((prev) => (prev === null ? null : (prev + 1) % total));

  return (
    <section className="border-t border-[#E5DCCF] bg-[#F2ECE2]/60 px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-5xl space-y-12">
        <SectionHeader
          kicker="Momen Berharga"
          title="Galeri Foto"
          subtitle="Potret kehangatan sebelum melangkah bersama menuju babak baru."
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
          {data.gallery.map((url, idx) => {
            const featureFirst = idx === 0 && total >= 4;
            return (
              <button
                key={`${url}-${idx}`}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`group relative overflow-hidden border border-[#DFD4C4] bg-[#FFFDF9] p-1.5 text-left shadow-sm transition-all hover:border-[#B0915D] focus-visible:outline-2 focus-visible:outline-[#9A7B4F] ${
                  featureFirst ? "col-span-2 aspect-[16/10] sm:col-span-2" : "aspect-[4/5]"
                }`}
              >
                <div className="relative h-full w-full overflow-hidden bg-[#EFE8DC]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Galeri ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1F1C18]/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activeIndex !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#181512]/90 p-4 backdrop-blur-xs"
          onClick={() => setActiveIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau foto galeri"
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white transition-colors hover:bg-white/15"
            aria-label="Tutup pratinjau"
          >
            <IconX size={18} />
          </button>

          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white transition-colors hover:bg-white/15 sm:left-6"
                aria-label="Foto sebelumnya"
              >
                <IconChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white transition-colors hover:bg-white/15 sm:right-6"
                aria-label="Foto berikutnya"
              >
                <IconChevronRight size={20} />
              </button>
            </>
          ) : null}

          <div
            className="max-h-[85vh] max-w-4xl overflow-hidden border border-[#C8B08A]/40 bg-[#1F1C18] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.gallery[activeIndex]}
              alt={`Galeri ${activeIndex + 1}`}
              className="max-h-[78vh] w-auto object-contain"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
