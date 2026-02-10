import React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface WeddingData {
  groom: {
    nickname: string;
    fullName: string;
    fatherName: string;
    motherName: string;
  };
  bride: {
    nickname: string;
    fullName: string;
    fatherName: string;
    motherName: string;
  };
  event: {
    date: Date | string;
    location: string;
    mapUrl: string;
  };
  gallery: string[];
  quote: string;
}

export default function SimpleElegant({ data }: { data: WeddingData }) {
  const eventDate = new Date(data.event.date);

  return (
    <div className="min-h-screen bg-slate-50 font-serif text-slate-800">
      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center p-8 text-center bg-white">
        <div className="absolute inset-0 border-20 border-slate-50 pointer-events-none" />
        <div className="animate-fade-in-up space-y-6 z-10">
          <p className="text-xl uppercase tracking-[0.2em] text-slate-500">The Wedding Of</p>
          <h1 className="text-6xl font-script text-slate-900 md:text-8xl">
            {data.groom.nickname} & {data.bride.nickname}
          </h1>
          <p className="text-lg font-light text-slate-600">{format(eventDate, "EEEE, d MMMM yyyy", { locale: id })}</p>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-20 px-4 flex justify-center bg-slate-100">
        <blockquote className="max-w-2xl text-center italic text-slate-600 text-lg">&rdquo;{data.quote}&rdquo;</blockquote>
      </section>

      {/* Couple Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="mx-auto max-w-4xl grid md:grid-cols-2 gap-12 items-center">
          {/* Groom */}
          <div className="text-center space-y-4">
            <div className="w-48 h-48 mx-auto rounded-full bg-slate-200 overflow-hidden border-4 border-slate-300">
              {/* Placeholder for groom photo if available in future data schema */}
              <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500">Groom</div>
            </div>
            <h2 className="text-3xl font-bold">{data.groom.fullName}</h2>
            <p className="text-slate-500">
              Putra dari Bpk. {data.groom.fatherName} & Ibu {data.groom.motherName}
            </p>
          </div>

          {/* Bride */}
          <div className="text-center space-y-4">
            <div className="w-48 h-48 mx-auto rounded-full bg-slate-200 overflow-hidden border-4 border-slate-300">
              {/* Placeholder for bride photo */}
              <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500">Bride</div>
            </div>
            <h2 className="text-3xl font-bold">{data.bride.fullName}</h2>
            <p className="text-slate-500">
              Putri dari Bpk. {data.bride.fatherName} & Ibu {data.bride.motherName}
            </p>
          </div>
        </div>
      </section>

      {/* Event Detail */}
      <section className="bg-slate-900 text-white py-24 text-center px-4">
        <h2 className="text-4xl mb-8 font-serif">Save The Date</h2>
        <div className="space-y-2 mb-8">
          <p className="text-xl">{format(eventDate, "EEEE, d MMMM yyyy", { locale: id })}</p>
          <p className="text-lg opacity-80">Pukul 10.00 WIB - Selesai</p>
        </div>

        <div className="mb-12">
          <p className="font-bold text-xl mb-2">{data.event.location}</p>
          <a href={data.event.mapUrl} target="_blank" rel="noreferrer" className="inline-block border border-white px-6 py-2 hover:bg-white hover:text-slate-900 transition-colors">
            Lihat Lokasi
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-slate-400 bg-slate-950">
        <p>Created with Nika.id</p>
      </footer>
    </div>
  );
}
