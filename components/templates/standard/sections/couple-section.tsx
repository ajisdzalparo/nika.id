/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { IconHeart, IconBrandInstagram } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";

interface CoupleSectionProps {
  data: WeddingData;
}

export function CoupleSection({ data }: CoupleSectionProps) {
  return (
    <section className="py-20 px-6 bg-[#FBF7F4]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-rose-400 font-semibold">Mempelai</p>
          <h2 className="text-3xl sm:text-4xl font-serif italic text-gray-900">Pasangan Pengantin</h2>
          <div className="h-px w-16 bg-rose-300 mx-auto" />
        </div>

        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
          {/* Groom */}
          <div className="text-center space-y-6 animate-in slide-in-from-left duration-700">
            <div className="relative inline-block">
              <div className="w-48 h-60 sm:w-56 sm:h-72 rounded-t-full overflow-hidden border-4 border-white shadow-2xl mx-auto bg-gray-100">
                {data.groom.photo ? <img src={data.groom.photo} alt={data.groom.fullName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-5xl">🤵</div>}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-serif italic text-gray-900">{data.groom.fullName}</h3>
              <p className="text-sm text-gray-500">Putra dari</p>
              <p className="text-base font-semibold text-gray-700">
                Bapak {data.groom.fatherName} &amp; Ibu {data.groom.motherName}
              </p>
              {data.groom.instagram && (
                <a href={`https://instagram.com/${data.groom.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-rose-400 hover:text-rose-500 transition-colors">
                  <IconBrandInstagram size={16} /> @{data.groom.instagram}
                </a>
              )}
            </div>
          </div>

          {/* Divider on mobile */}
          <div className="md:hidden flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-rose-200" />
              <IconHeart size={24} className="text-rose-400 fill-rose-300" />
              <div className="h-px w-8 bg-rose-200" />
            </div>
          </div>

          {/* Bride */}
          <div className="text-center space-y-6 animate-in slide-in-from-right duration-700">
            <div className="relative inline-block">
              <div className="w-48 h-60 sm:w-56 sm:h-72 rounded-t-full overflow-hidden border-4 border-white shadow-2xl mx-auto bg-gray-100">
                {data.bride.photo ? <img src={data.bride.photo} alt={data.bride.fullName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-5xl">👰</div>}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-serif italic text-gray-900">{data.bride.fullName}</h3>
              <p className="text-sm text-gray-500">Putri dari</p>
              <p className="text-base font-semibold text-gray-700">
                Bapak {data.bride.fatherName} &amp; Ibu {data.bride.motherName}
              </p>
              {data.bride.instagram && (
                <a href={`https://instagram.com/${data.bride.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-rose-400 hover:text-rose-500 transition-colors">
                  <IconBrandInstagram size={16} /> @{data.bride.instagram}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
