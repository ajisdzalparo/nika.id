"use client";

import React from "react";
import { IconChevronDown } from "@tabler/icons-react";

interface CoverPageProps {
  groom: string;
  bride: string;
  guestName?: string;
  onOpen: () => void;
}

export function CoverPage({ groom, bride, guestName, onOpen }: CoverPageProps) {
  return (
    <div className="fixed inset-0 z-50 bg-linear-to-b from-rose-50 via-white to-pink-50 flex items-center justify-center">
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
      <div className="relative z-10 text-center space-y-8 px-6 animate-in fade-in zoom-in duration-700">
        <p className="text-xs uppercase tracking-[0.5em] text-rose-400 font-semibold">The Wedding Of</p>

        <div className="space-y-3">
          <h1 className="text-4xl sm:text-7xl font-serif font-light italic text-gray-900">{groom}</h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-rose-300" />
            <span className="text-rose-400 text-lg">&amp;</span>
            <div className="h-px w-8 bg-rose-300" />
          </div>
          <h1 className="text-4xl sm:text-7xl font-serif font-light italic text-gray-900">{bride}</h1>
        </div>

        {guestName && (
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Kepada Bpk/Ibu/Saudara/i</p>
            <p className="text-lg font-bold text-gray-800">{guestName}</p>
          </div>
        )}

        <button
          onClick={onOpen}
          className="group inline-flex flex-col items-center gap-2 px-10 py-4 rounded-full bg-linear-to-r from-rose-500 to-pink-500 text-white font-bold shadow-xl shadow-rose-200 hover:shadow-2xl hover:shadow-rose-300 hover:scale-105 transition-all"
        >
          <span>Buka Undangan</span>
          <IconChevronDown size={16} className="animate-bounce" />
        </button>
      </div>
    </div>
  );
}
