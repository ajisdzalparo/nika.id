/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { IconHeart, IconMapPin, IconCalendar, IconGift, IconPlayerPlay, IconChevronDown } from "@tabler/icons-react";
import { MusicToggle } from "@/components/common/music-toggle";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WeddingData } from "@/types/wedding";
import { toast } from "sonner";
import { RSVPSection } from "@/components/templates/royal-gold/rsvp-section";
import { VideoSection } from "@/components/common/video-section";

gsap.registerPlugin(ScrollTrigger);

export default function RoyalGold({ data }: { data: WeddingData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Normalisasi data: gunakan 'events' array, tapi fallback ke 'event' tunggal jika 'events' kosong
  const eventsToRender: any[] =
    data.events && data.events.length > 0
      ? data.events
      : data.event
        ? [
            {
              id: "primary",
              title: "Acara Pernikahan",
              date: data.event.date,
              time: data.event.time,
              venue: data.event.venue,
              address: data.event.address,
              maps: data.event.mapUrl || (data.event as any).maps,
            },
          ]
        : [];

  const eventDate = React.useMemo(() => {
    const firstEventDate = eventsToRender[0]?.date;
    return firstEventDate ? new Date(firstEventDate) : new Date();
  }, [eventsToRender]);

  // Countdown Logic
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeLeft({
        days: Math.max(0, differenceInDays(eventDate, now)),
        hours: Math.max(0, differenceInHours(eventDate, now) % 24),
        minutes: Math.max(0, differenceInMinutes(eventDate, now) % 60),
        seconds: Math.max(0, differenceInSeconds(eventDate, now) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [eventDate]);

  useEffect(() => {
    if (isOpen) {
      // GSAP Animations after opening
      gsap.from(".luxury-reveal", {
        y: 100,
        opacity: 0,
        stagger: 0.2,
        duration: 1.2,
        ease: "power4.out",
        scrollTrigger: {
          trigger: ".luxury-reveal",
          start: "top 90%",
        },
      });

      gsap.utils.toArray(".reveal-section").forEach((section: any) => {
        gsap.from(section, {
          opacity: 0,
          y: 50,
          duration: 1.5,
          ease: "expo.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
          },
        });
      });
    }
  }, [isOpen]);

  const groomName = data.groom?.nickname || data.groom?.fullName?.split(" ")[0] || "";
  const brideName = data.bride?.nickname || data.bride?.fullName?.split(" ")[0] || "";

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#2C2C2C] font-serif overflow-x-hidden">
      {/* 1. Entrance Overlay / Cover */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div exit={{ y: "-100%", transition: { duration: 1, ease: [0.76, 0, 0.24, 1] } }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1A1A1A] p-6 text-center text-[#D4AF37]">
            {/* Background elements for cover */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/gold-dust.png')]" />
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.5 }} className="z-10 space-y-8">
              <div className="relative w-32 h-32 mx-auto border-2 border-[#D4AF37] rounded-full flex items-center justify-center p-4 overflow-hidden">
                <Image src={data.groom?.photo || data.bride?.photo || "https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=2070"} fill className="object-cover rounded-full" alt="Icon" />
              </div>
              <div className="space-y-2">
                <p className="tracking-[0.5em] text-xs uppercase text-white/60">Wedding Invitation</p>
                <h1 className="text-4xl md:text-7xl font-light italic">
                  {groomName} &amp; {brideName}
                </h1>
              </div>

              <div className="space-y-4">
                <p className="text-sm italic text-white/80">Dear,</p>
                <h2 className="text-2xl font-bold uppercase tracking-widest">{data.guestName || "Special Guest"}</h2>
              </div>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#D4AF37", color: "#000" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="group relative flex items-center gap-3 border border-[#D4AF37] px-8 py-4 rounded-full font-sans font-bold tracking-[0.2em] transition-all mx-auto"
              >
                <IconPlayerPlay className="w-4 h-4 fill-current group-hover:animate-ping" />
                BUKA UNDANGAN
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Content (Visible after opening) */}
      <main className={`${!isOpen ? "h-screen overflow-hidden" : ""}`}>
        {/* Hero Section */}
        <section className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
          {/* Parallax Background */}
          <motion.div style={{ y: 0 }} className="absolute inset-0 z-0 opacity-20">
            <Image src={data.gallery?.[0] || data.bride?.photo || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070"} fill className="object-cover" alt="bg" />
          </motion.div>

          <div className="z-10 space-y-12 luxury-reveal">
            <IconHeart className="w-12 h-12 mx-auto text-[#D4AF37] opacity-30 animate-pulse" />
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-12">
              <h1 className="text-5xl md:text-9xl font-light font-display italic text-[#B8860B]">{groomName}</h1>
              <span className="text-2xl md:text-3xl text-[#D4AF37] font-sans">&amp;</span>
              <h1 className="text-5xl md:text-9xl font-light font-display italic text-[#B8860B]">{brideName}</h1>
            </div>

            <div className="flex items-center justify-center gap-4 text-[#D4AF37]">
              <div className="h-px w-20 bg-current/30" />
              <p className="text-xl tracking-[0.4em] font-sans">{format(eventDate, "MMMM d . yyyy")}</p>
              <div className="h-px w-20 bg-current/30" />
            </div>
          </div>

          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-10 text-[#D4AF37]">
            <IconChevronDown className="w-8 h-8" />
          </motion.div>
        </section>

        {/* Countdown Section */}
        <section className="py-24 px-6 bg-[#1A1A1A] text-white overflow-hidden reveal-section">
          <div className="max-w-4xl mx-auto space-y-12 text-center">
            <h2 className="text-3xl font-light tracking-[0.3em] uppercase text-[#D4AF37]">The Big Day Countdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Hari", value: timeLeft.days },
                { label: "Jam", value: timeLeft.hours },
                { label: "Menit", value: timeLeft.minutes },
                { label: "Detik", value: timeLeft.seconds },
              ].map((item, i) => (
                <motion.div key={i} whileHover={{ scale: 1.05 }} className="bg-[#2C2C2C] p-8 rounded-3xl border border-[#D4AF37]/20 shadow-2xl transition-all">
                  <p className="text-5xl font-black text-[#D4AF37]">{item.value}</p>
                  <p className="text-xs uppercase tracking-widest opacity-50 mt-2">{item.label}</p>
                </motion.div>
              ))}
            </div>
            <p className="text-sm italic opacity-60">Menghitung waktu menuju hari bahagia kami.</p>
          </div>
        </section>

        {/* Couple Section */}
        <section className="py-32 px-6 overflow-hidden bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-24 font-serif">
            {/* Groom */}
            <div className="flex flex-col items-center space-y-8 reveal-section">
              <div className="relative group">
                <div className="relative w-72 h-[450px] bg-[#FFF9EA] rounded-full border-12 border-[#FFF9EA] shadow-2xl overflow-hidden">
                  <Image src={data.groom?.photo || "https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=2070"} fill className="object-cover grayscale-50 group-hover:grayscale-0 transition-all duration-1000" alt="Groom" />
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white text-[#D4AF37] px-10 py-3 rounded-full shadow-xl border border-[#D4AF37]/20 font-bold tracking-widest uppercase">Groom</div>
              </div>
              <div className="text-center space-y-4">
                <h3 className="text-4xl text-[#B8860B] font-display italic">{data.groom?.fullName}</h3>
                <div className="space-y-1 opacity-70">
                  <p className="text-xs uppercase tracking-widest mb-2 font-bold">Putra Dari</p>
                  <p className="text-lg">Bpk. {data.groom?.fatherName}</p>
                  <p className="text-lg">&amp; Ibu {data.groom?.motherName}</p>
                </div>
              </div>
            </div>

            {/* Bride */}
            <div className="flex flex-col items-center space-y-8 reveal-section" style={{ transitionDelay: "200ms" }}>
              <div className="relative group">
                <div className="relative w-72 h-[450px] bg-[#FFF9EA] rounded-full border-12 border-[#FFF9EA] shadow-2xl overflow-hidden">
                  <Image src={data.bride?.photo || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070"} fill className="object-cover grayscale-50 group-hover:grayscale-0 transition-all duration-1000" alt="Bride" />
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white text-[#D4AF37] px-10 py-3 rounded-full shadow-xl border border-[#D4AF37]/20 font-bold tracking-widest uppercase">Bride</div>
              </div>
              <div className="text-center space-y-4">
                <h3 className="text-4xl text-[#B8860B] font-display italic">{data.bride?.fullName}</h3>
                <div className="space-y-1 opacity-70">
                  <p className="text-xs uppercase tracking-widest mb-2 font-bold">Putri Dari</p>
                  <p className="text-lg">Bpk. {data.bride?.fatherName}</p>
                  <p className="text-lg">&amp; Ibu {data.bride?.motherName}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Schedule Section (Multiple Events) */}
        <section className="py-32 px-6 bg-[#F9F5F0] relative overflow-hidden reveal-section">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="max-w-5xl mx-auto space-y-16 text-center relative">
            <div className="space-y-4">
              <IconHeart className="w-10 h-10 mx-auto text-[#D4AF37] opacity-40" />
              <h2 className="text-5xl font-light italic text-[#B8860B]">The Celebration</h2>
              <p className="tracking-widest uppercase text-xs opacity-50">Saved the date</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {eventsToRender.map((evt: any, idx: number) => (
                <div key={idx} className="bg-white p-12 rounded-[50px] shadow-2xl border border-[#D4AF37]/10 space-y-8 group hover:border-[#D4AF37]/40 transition-all">
                  <div className="space-y-4">
                    <h3 className="text-3xl font-light italic text-[#B8860B]">{evt.title}</h3>
                    <div className="h-px w-12 bg-[#D4AF37]/30 mx-auto" />
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <IconCalendar className="w-8 h-8 mx-auto text-[#D4AF37]" />
                      <p className="text-sm uppercase tracking-widest font-bold">Waktu &amp; Tanggal</p>
                      <p className="text-xl text-[#B8860B]">{evt.date ? format(new Date(evt.date), "EEEE, d MMMM yyyy", { locale: idLocale }) : "-"}</p>
                      <p className="text-lg font-light opacity-60 font-sans">{evt.time || "-"} WIB</p>
                    </div>
                    <div className="space-y-2">
                      <IconMapPin className="w-8 h-8 mx-auto text-[#D4AF37]" />
                      <p className="text-sm uppercase tracking-widest font-bold">Lokasi Acara</p>
                      <p className="text-xl text-[#B8860B] uppercase font-bold">{evt.venue || "-"}</p>
                      <p className="text-sm opacity-60 leading-relaxed max-w-xs mx-auto">{evt.address || "-"}</p>
                    </div>
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={evt.maps || evt.mapUrl}
                      target="_blank"
                      className="inline-block bg-[#1A1A1A] text-[#D4AF37] px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all"
                    >
                      View Location
                    </motion.a>
                  </div>
                </div>
              ))}
            </div>

            {/* Streaming support */}
            {data.streaming?.enabled && (
              <div className="bg-[#1A1A1A] text-[#D4AF37] p-12 rounded-[50px] shadow-2xl space-y-6 max-w-2xl mx-auto">
                <h4 className="text-2xl font-light italic">Saksikan melalui {data.streaming.platform}</h4>
                <p className="text-sm opacity-60">Bagi kerabat yang berhalangan hadir secara fisik.</p>
                <motion.a whileHover={{ scale: 1.05 }} href={data.streaming.url} target="_blank" className="inline-block border border-[#D4AF37] px-10 py-3 rounded-full text-xs font-bold uppercase tracking-widest">
                  Join Streaming
                </motion.a>
              </div>
            )}
          </div>
        </section>

        {/* Extended Family (Turut Mengundang) */}
        {data.extendedFamily?.members && data.extendedFamily.members.length > 0 && (
          <section className="py-32 px-6 bg-white reveal-section">
            <div className="max-w-3xl mx-auto text-center space-y-12">
              <div className="space-y-2">
                <h2 className="text-4xl font-light italic text-[#B8860B]">{data.extendedFamily.title}</h2>
                <div className="h-px w-24 bg-[#D4AF37] mx-auto opacity-30" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.extendedFamily.members.map((name, i) => (
                  <p key={i} className="text-xl font-light opacity-80">
                    {name}
                  </p>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Video Section */}
        <VideoSection data={data} />

        {/* Video Section */}

        {/* Gallery */}
        {data.gallery && data.gallery.length > 0 && (
          <section className="py-32 px-6 bg-white reveal-section border-t border-[#F9F5F0]">
            <div className="max-w-7xl mx-auto space-y-16">
              <div className="text-center space-y-2">
                <h2 className="text-5xl font-light italic text-[#B8860B]">Gallery Of Love</h2>
                <div className="h-px w-24 bg-[#D4AF37] mx-auto opacity-30" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {data.gallery.map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`relative overflow-hidden rounded-2xl shadow-lg border-4 border-[#FFFDF9] ${i % 5 === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"}`}
                  >
                    <Image src={img} fill className="object-cover transition-transform duration-1000 hover:scale-110" alt={`Gallery ${i}`} />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Health Protocols */}
        {data.protocol?.enabled && (
          <section className="py-24 px-8 bg-[#1A1A1A] text-[#D4AF37] text-center space-y-12">
            <div className="space-y-4 reveal-section">
              <h2 className="text-3xl font-light italic">Health Protocols</h2>
              <p className="text-sm opacity-50 max-w-xs mx-auto italic">Mohon kesediaannya mematuhi protokol kesehatan demi kenyamanan bersama.</p>
            </div>
            <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto reveal-section">
              {(data.protocol.items || ["Masker", "Cuci Tangan", "Jaga Jarak"]).map((item, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="w-16 h-16 rounded-full border border-[#D4AF37]/30 mx-auto flex items-center justify-center text-3xl">
                    {item.includes("Masker") && "😷"}
                    {item.includes("Cuci") && "🧼"}
                    {item.includes("Jarak") && "↔️"}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest">{item}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gift Section */}
        {data.gifts?.enabled && (
          <section className="py-32 px-6 bg-[#FDF8F2] text-black reveal-section">
            <div className="max-w-xl mx-auto space-y-12 text-center">
              <div className="space-y-4">
                <IconGift className="w-12 h-12 mx-auto text-[#D4AF37]" />
                <h2 className="text-5xl font-light italic text-[#B8860B]">Wedding Gift</h2>
                <p className="opacity-70">Segenap doa restu Anda adalah kado terindah bagi kami. Namun jika ingin berbagi kado, Anda bisa melalui:</p>
              </div>

              <div className="space-y-6">
                {data.gifts?.bankAccounts?.map((bank, i) => (
                  <motion.div key={i} whileHover={{ y: -10 }} className="p-10 border border-[#D4AF37]/20 rounded-[40px] bg-white text-black space-y-4 shadow-xl">
                    <p className="text-sm uppercase tracking-widest font-bold text-[#B8860B]">{bank.bankName}</p>
                    <p className="text-4xl font-black">{bank.accountNumber}</p>
                    <p className="text-sm opacity-60 italic">a.n {bank.accountHolder}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(bank.accountNumber);
                        toast.success("Nomor rekening disalin!");
                      }}
                      className="mt-6 border-2 border-[#D4AF37] px-8 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-white transition-all"
                    >
                      Salin Rekening
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* RSVP */}
        <RSVPSection />

        {/* Story Section */}
        <section className="py-32 px-6 bg-white reveal-section">
          <div className="max-w-3xl mx-auto space-y-10 text-center">
            <div className="relative inline-block px-12 py-4">
              <div className="absolute inset-0 border-y-2 border-[#D4AF37]/20" />
              <h2 className="text-5xl font-light italic text-[#B8860B]">{data.story?.title || "Our Story"}</h2>
            </div>
            <p className="text-lg leading-relaxed text-[#4A403A] opacity-80 whitespace-pre-line italic font-serif px-6">{data.story?.content}</p>
          </div>
        </section>

        {/* Floating Music Button */}
        {data.music?.enabled && data.music.url && isOpen && <MusicToggle url={data.music.url} type={data.music.type} autoPlay={true} />}

        {/* Footer */}
        <footer className="py-32 px-6 bg-[#1A1A1A] text-[#D4AF37] text-center border-t border-[#D4AF37]/10">
          <div className="space-y-4 luxury-reveal">
            <p className="text-sm tracking-[0.5em] uppercase opacity-40">Created with love</p>
            <h1 className="text-5xl font-light italic">
              {groomName} &amp; {brideName}
            </h1>
            <p className="text-xs uppercase tracking-widest pt-12 opacity-30 font-sans">Official Invitation by Nika.id</p>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .font-display {
          font-family: serif;
        }
      `}</style>
    </div>
  );
}
