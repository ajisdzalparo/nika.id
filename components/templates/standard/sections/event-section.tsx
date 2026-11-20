import React from "react";
import { IconCalendarEvent, IconClock, IconMapPin } from "@tabler/icons-react";
import { WeddingData } from "@/types/wedding";
import { SectionHeader, formatIndonesianDate } from "../shared";

export function EventSection({ data }: { data: WeddingData }) {
  const eventsList =
    data.events && data.events.length > 0
      ? data.events
      : data.event
        ? [{ id: "default", title: "Akad & Resepsi", ...data.event }]
        : [];

  if (eventsList.length === 0) return null;

  return (
    <section className="border-y border-[#E5DCCF] bg-[#F2ECE2]/75 px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-4xl space-y-12">
        <SectionHeader
          kicker="Rangkaian Acara"
          title="Waktu & Tempat"
          subtitle="Kehadiran dan doa restu Bapak/Ibu/Saudara/i merupakan kehormatan terbesar bagi kami."
        />

        <div
          className={`grid gap-6 ${
            eventsList.length === 1 ? "mx-auto max-w-xl grid-cols-1" : "md:grid-cols-2"
          }`}
        >
          {eventsList.map((ev, index) => (
            <article
              key={ev.id || `${ev.title}-${index}`}
              className="relative flex flex-col justify-between border border-[#DFD4C4] bg-[#FFFDF9] p-7 text-center shadow-[0_20px_50px_-32px_rgba(31,28,24,0.28)] sm:p-9"
            >
              <div
                className="pointer-events-none absolute inset-2 border border-[#C8B08A]/35"
                aria-hidden="true"
              />

              <div className="relative space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#9A7B4F]">
                    Acara {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-serif text-2xl font-normal text-[#1F1C18] sm:text-3xl">
                    {ev.title}
                  </h3>
                </div>

                <div className="mx-auto h-px w-14 bg-[#C8B08A]/70" />

                <div className="space-y-4 text-sm text-[#4B443B]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-[#8A7F72]">
                      <IconCalendarEvent size={14} stroke={1.6} className="text-[#9A7B4F]" />
                      Tanggal
                    </span>
                    <p className="font-medium text-[#1F1C18]">
                      {formatIndonesianDate(ev.date)}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-[#8A7F72]">
                      <IconClock size={14} stroke={1.6} className="text-[#9A7B4F]" />
                      Pukul
                    </span>
                    <p className="font-medium text-[#1F1C18]">{ev.time} WIB</p>
                  </div>

                  <div className="flex flex-col items-center gap-1 pt-1">
                    <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-[#8A7F72]">
                      <IconMapPin size={14} stroke={1.6} className="text-[#9A7B4F]" />
                      Lokasi
                    </span>
                    <p className="font-serif text-lg text-[#1F1C18]">{ev.venue}</p>
                    {ev.address ? (
                      <p className="max-w-xs text-xs leading-relaxed text-[#6B6257]">
                        {ev.address}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {ev.mapUrl && ev.mapUrl !== "https://maps.google.com" ? (
                <div className="relative mt-7 pt-2">
                  <a
                    href={ev.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-[#1F1C18] px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-[#1F1C18] transition-colors hover:bg-[#1F1C18] hover:text-[#FAF6F0]"
                  >
                    <IconMapPin size={14} stroke={1.6} />
                    Buka Google Maps
                  </a>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
