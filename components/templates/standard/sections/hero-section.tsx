"use client";

import React from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { IconHeart } from "@tabler/icons-react";
import { useCountdown } from "@/hooks/use-countdown";
import { WeddingData } from "@/types/wedding";

interface HeroSectionProps {
  data: WeddingData;
}

export function HeroSection({ data }: HeroSectionProps) {
  const primaryEvent = data.events?.[0] || data.event;
  const eventDate = primaryEvent?.date ? new Date(primaryEvent.date) : new Date();
  const countdown = useCountdown(eventDate);

  return (
    <section className="relative h-screen flex flex-col items-center justify-center text-center px-6 bg-linear-to-b from-pink-50 via-white to-[#FBF7F4] overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
      <div className="z-10 space-y-6 animate-in fade-in zoom-in duration-700">
        <p className="text-xs uppercase tracking-[0.5em] text-rose-400 font-semibold">The Wedding Of</p>
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-7xl font-serif font-light italic text-gray-900">{data.groom.nickname}</h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-rose-300" />
            <IconHeart size={20} className="text-rose-400 fill-rose-400" />
            <div className="h-px w-12 bg-rose-300" />
          </div>
          <h1 className="text-4xl sm:text-7xl font-serif font-light italic text-gray-900">{data.bride.nickname}</h1>
        </div>
        <p className="text-sm tracking-widest text-gray-500">{format(eventDate, "dd MMMM yyyy", { locale: idLocale })}</p>

        {/* Countdown */}
        <div className="flex justify-center gap-3 sm:gap-6 pt-4">
          {[
            { value: countdown.days, label: "Hari" },
            { value: countdown.hours, label: "Jam" },
            { value: countdown.minutes, label: "Menit" },
            { value: countdown.seconds, label: "Detik" },
          ].map((item) => (
            <div key={item.label} className="w-16 sm:w-20">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{String(item.value).padStart(2, "0")}</div>
              <div className="text-[10px] sm:text-xs text-rose-400 uppercase tracking-wider font-semibold">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
