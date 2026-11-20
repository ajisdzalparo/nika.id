"use client";

import React from "react";
import { IconArrowDown } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";
import { useCountdown } from "@/hooks/use-countdown";
import { BotanicalDivider, formatIndonesianDate } from "../shared";

export function HeroSection({ data }: { data: WeddingData }) {
  const primaryEvent = data.events?.[0] ?? data.event;
  const eventDate = primaryEvent?.date ? new Date(primaryEvent.date) : new Date();
  const timeLeft = useCountdown(eventDate);
  const heroPhoto =
    data.gallery?.[0] || data.bride.photo || data.groom.photo || "";

  return (
    <section className="relative overflow-hidden border-b border-[#E5DCCF] px-5 pb-20 pt-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col items-center text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#9A7B4F]">
            Walimatul Urs &middot; Undangan Pernikahan
          </p>

          <div className="mt-8 w-full max-w-md sm:max-w-lg">
            {heroPhoto ? (
              <div className="mx-auto w-56 rounded-t-full border border-[#D4C4AE] bg-[#FFFDF9] p-2.5 shadow-[0_24px_60px_-28px_rgba(31,28,24,0.28)] sm:w-64">
                <div className="aspect-[3/4] w-full overflow-hidden rounded-t-full bg-[#EFE8DC]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroPhoto}
                    alt={`${data.groom.nickname} & ${data.bride.nickname}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <h1 className="mt-9 font-serif text-5xl font-normal tracking-tight text-[#1F1C18] sm:text-6xl md:text-7xl">
            {data.groom.nickname}
            <span className="mx-3 font-serif text-4xl italic text-[#9A7B4F] sm:mx-4 sm:text-6xl">
              &amp;
            </span>
            {data.bride.nickname}
          </h1>

          <BotanicalDivider className="mt-6" />

          <div className="mt-5 space-y-1.5">
            <p className="font-serif text-lg text-[#4B443B] sm:text-xl">
              {formatIndonesianDate(eventDate)}
            </p>
            {primaryEvent?.venue ? (
              <p className="text-xs uppercase tracking-[0.2em] text-[#7D7366]">
                {primaryEvent.venue}
              </p>
            ) : null}
          </div>

          <div className="mt-10 grid w-full max-w-lg grid-cols-4 gap-2.5 sm:gap-4">
            {[
              { label: "Hari", value: timeLeft.days },
              { label: "Jam", value: timeLeft.hours },
              { label: "Menit", value: timeLeft.minutes },
              { label: "Detik", value: timeLeft.seconds },
            ].map((item) => (
              <div
                key={item.label}
                className="relative border border-[#E3DACD] bg-[#FFFDF9] px-2 py-4 shadow-[0_10px_30px_-22px_rgba(31,28,24,0.3)] sm:py-5"
              >
                <span
                  className="absolute inset-x-4 top-0 h-px bg-[#B0915D]/50"
                  aria-hidden="true"
                />
                <span className="block font-serif text-2xl font-normal tabular-nums text-[#1F1C18] sm:text-4xl">
                  {String(item.value).padStart(2, "0")}
                </span>
                <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.22em] text-[#8A7F72]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-12 inline-flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.26em] text-[#8A7F72]">
            <span>Gulir ke bawah</span>
            <IconArrowDown size={14} className="animate-bounce text-[#9A7B4F]" />
          </div>
        </div>
      </div>
    </section>
  );
}
