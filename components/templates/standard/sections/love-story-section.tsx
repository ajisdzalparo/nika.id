import React from "react";
import { WeddingData } from "@/types/wedding";
import { SectionHeader } from "../shared";

export function LoveStorySection({ data }: { data: WeddingData }) {
  if (!data.loveStory?.enabled || data.loveStory.chapters.length === 0) {
    return null;
  }

  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-3xl space-y-12">
        <SectionHeader
          kicker="Perjalanan Kami"
          title="Kisah Cinta"
          subtitle="Setiap langkah kecil mempertemukan dua hati hingga bermuara pada ikatan yang suci."
        />

        <div className="relative space-y-6 before:absolute before:bottom-4 before:left-5 before:top-4 before:w-px before:bg-[#DDD1C0] sm:before:left-6">
          {data.loveStory.chapters.map((chapter, idx) => (
            <article
              key={`${chapter.title}-${idx}`}
              className="relative pl-14 sm:pl-16"
            >
              <span className="absolute left-0 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-[#C8B08A] bg-[#FFFDF9] font-serif text-xs tracking-wider text-[#8C6D3F] shadow-xs sm:h-12 sm:w-12 sm:text-sm">
                {String(idx + 1).padStart(2, "0")}
              </span>

              <div className="border border-[#DFD4C4] bg-[#FFFDF9] p-6 shadow-[0_14px_38px_-28px_rgba(31,28,24,0.25)] sm:p-7">
                <h3 className="font-serif text-xl font-normal text-[#1F1C18]">
                  {chapter.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#5D554B]">
                  {chapter.content}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
