"use client";

import React from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { IconCalendar, IconClock, IconMapPin } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";

interface EventSectionProps {
  data: WeddingData;
}

export function EventSection({ data }: EventSectionProps) {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-rose-400 font-semibold">Waktu & Tempat</p>
          <h2 className="text-3xl sm:text-4xl font-serif italic text-gray-900">Jadwal Acara</h2>
          <div className="h-px w-16 bg-rose-300 mx-auto" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {(data.events && data.events.length > 0 ? data.events : data.event ? [{ id: "legacy", title: "Acara", ...data.event }] : []).map((evt) => (
            <div key={evt.id || evt.title} className="bg-[#FBF7F4] rounded-3xl p-8 space-y-5 hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-rose-100 to-pink-100 flex items-center justify-center mx-auto">
                <IconCalendar size={28} className="text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900">{evt.title}</h3>
              <div className="space-y-3 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <IconCalendar size={16} />
                  {evt.date
                    ? format(new Date(evt.date), "EEEE, d MMMM yyyy", {
                        locale: idLocale,
                      })
                    : "-"}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <IconClock size={16} />
                  Pukul : {evt.time || "-"} WIB
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 max-w-xs mx-auto">
                  <IconMapPin size={16} className="shrink-0" />
                  <span>{evt.venue || "-"}</span>
                </div>
                {evt.address && <p className="text-xs text-gray-400 max-w-xs mx-auto">{evt.address}</p>}
              </div>
              {evt.mapUrl && evt.mapUrl !== "https://maps.google.com" && (
                <div className="text-center pt-2">
                  <a
                    href={evt.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-linear-to-r from-rose-500 to-pink-500 text-white text-xs font-bold hover:shadow-lg hover:shadow-rose-200 transition-all"
                  >
                    <IconMapPin size={14} /> Lihat Lokasi
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
