import React from "react";
import { IconBroadcast, IconExternalLink } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";
import { BotanicalDivider } from "../shared";

export function StreamingSection({ data }: { data: WeddingData }) {
  if (!data.streaming?.enabled || !data.streaming.url) return null;

  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-2xl border border-[#DFD4C4] bg-[#FFFDF9] p-8 text-center shadow-[0_20px_50px_-32px_rgba(31,28,24,0.28)] sm:p-11">
        <span className="inline-flex items-center gap-2 border border-[#D8CBB8] bg-[#FAF6F0] px-3.5 py-1 text-[10px] font-medium uppercase tracking-[0.26em] text-[#8C6D3F]">
          <IconBroadcast size={14} stroke={1.6} />
          Siaran Langsung
        </span>

        <h2 className="mt-4 font-serif text-3xl font-normal text-[#1F1C18]">
          Live Streaming
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#5D554B]">
          Bagi sahabat dan kerabat yang berhalangan hadir langsung, saksikan momen
          sakral kami secara virtual melalui{" "}
          <span className="font-medium text-[#1F1C18]">
            {data.streaming.platform || "Live Stream"}
          </span>
          .
        </p>

        <BotanicalDivider className="my-6" />

        <a
          href={data.streaming.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#1F1C18] px-6 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-[#FAF6F0] transition-colors hover:bg-[#332E27]"
        >
          Tonton Siaran Langsung
          <IconExternalLink size={14} stroke={1.6} />
        </a>
      </div>
    </section>
  );
}
