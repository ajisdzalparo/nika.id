import React from "react";
import { IconMailOpened } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";
import {
  BotanicalDivider,
  extractInitials,
  formatShortIndonesianDate,
} from "../shared";

export function CoverPage({
  data,
  onOpen,
}: {
  data: WeddingData;
  onOpen: () => void;
}) {
  const primaryDate = data.events?.[0]?.date ?? data.event?.date;
  const formattedDate = primaryDate ? formatShortIndonesianDate(primaryDate) : "";
  const heroPhoto =
    data.gallery?.[0] || data.bride.photo || data.groom.photo || "";
  const initials = extractInitials(data.groom.nickname, data.bride.nickname);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#F6F0E6] px-5 py-12 text-[#1F1C18]">
      {heroPhoto ? (
        <div className="pointer-events-none absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroPhoto}
            alt=""
            className="h-full w-full scale-105 object-cover opacity-20 blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F6F0E6]/85 via-[#F6F0E6]/80 to-[#EFE6D8]" />
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 25%, rgba(200, 176, 138, 0.22), transparent 60%)",
          }}
        />
      )}

      <div className="relative z-10 w-full max-w-md border border-[#D8CBB8] bg-[#FFFDF9]/95 p-7 text-center shadow-[0_24px_70px_-28px_rgba(31,28,24,0.28)] backdrop-blur-sm sm:p-10">
        <div
          className="pointer-events-none absolute inset-2.5 border border-[#C8B08A]/45"
          aria-hidden="true"
        />

        <div className="relative space-y-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#C8B08A]/70 bg-[#FAF6EE] font-serif text-sm tracking-wider text-[#8C6D3F]">
            {initials.a}
            <span className="mx-0.5 text-[11px] italic text-[#B0915D]">&amp;</span>
            {initials.b}
          </div>

          {heroPhoto ? (
            <div className="mx-auto w-36 overflow-hidden rounded-t-full border border-[#D8CBB8] bg-[#F3ECE1] p-1.5 shadow-sm sm:w-40">
              <div className="aspect-[4/5] w-full overflow-hidden rounded-t-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroPhoto}
                  alt={`${data.groom.nickname} & ${data.bride.nickname}`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-2.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#9A7B4F]">
              The Wedding Of
            </p>
            <h1 className="font-serif text-4xl font-normal leading-tight tracking-tight text-[#1F1C18] sm:text-[2.75rem]">
              {data.groom.nickname}
              <span className="mx-2 font-serif text-3xl italic text-[#9A7B4F]">
                &amp;
              </span>
              {data.bride.nickname}
            </h1>
            {formattedDate ? (
              <p className="text-xs uppercase tracking-[0.22em] text-[#6B6257]">
                {formattedDate}
              </p>
            ) : null}
          </div>

          <BotanicalDivider />

          <div className="mx-auto max-w-xs space-y-1.5 border border-[#E5DCCF] bg-[#FAF6F0] px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#7B7165]">
              Kepada Yth. Bapak / Ibu / Saudara/i
            </p>
            <p className="font-serif text-xl font-medium text-[#1F1C18]">
              {data.guestName || "Tamu Undangan"}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="inline-flex w-full items-center justify-center gap-2.5 bg-[#1F1C18] px-7 py-3.5 text-xs font-medium uppercase tracking-[0.22em] text-[#FAF6F0] shadow-md transition-all hover:bg-[#332E27] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A7B4F] active:scale-[0.99]"
          >
            <IconMailOpened size={16} stroke={1.6} />
            Buka Undangan
          </button>
        </div>
      </div>
    </div>
  );
}
