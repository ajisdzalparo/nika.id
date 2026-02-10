/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { IconHeart, IconMapPin, IconCalendar, IconGift, IconMusic, IconMusicOff, IconChevronDown, IconHeartFilled } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WeddingData } from "@/types/wedding";
import { toast } from "sonner";

gsap.registerPlugin(ScrollTrigger);

export default function RomanticElegance({ data }: { data: WeddingData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const petalsContainerRef = useRef<HTMLDivElement>(null);

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

  const mainDate = eventsToRender[0]?.date ? new Date(eventsToRender[0].date) : new Date();

  // Music Logic
  useEffect(() => {
    if (isOpen && data.music?.enabled && data.music.url) {
      if (!audioRef.current) {
        audioRef.current = new Audio(data.music.url);
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch((e) => console.log("Audio play blocked", e));
    }
    return () => {
      audioRef.current?.pause();
    };
  }, [isOpen, data.music]);

  // Floating Petals Logic (GSAP)
  useEffect(() => {
    if (isOpen && petalsContainerRef.current) {
      const container = petalsContainerRef.current;
      const petalCount = 15;

      for (let i = 0; i < petalCount; i++) {
        const petal = document.createElement("div");
        petal.className = "absolute pointer-events-none opacity-20";
        petal.innerHTML = "🌸";
        petal.style.fontSize = `${Math.random() * 20 + 10}px`;
        container.appendChild(petal);

        gsap.set(petal, {
          x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 500),
          y: -50,
          rotation: Math.random() * 360,
        });

        gsap.to(petal, {
          y: (typeof window !== "undefined" ? window.innerHeight : 1000) + 100,
          x: `+=${Math.random() * 200 - 100}`,
          rotation: `+=${Math.random() * 360}`,
          duration: Math.random() * 10 + 10,
          repeat: -1,
          ease: "none",
          delay: Math.random() * 10,
        });
      }
    }
  }, [isOpen]);

  // Section Reveal Animations
  useEffect(() => {
    if (isOpen) {
      gsap.utils.toArray(".romantic-reveal").forEach((el: any) => {
        gsap.from(el, {
          opacity: 0,
          y: 30,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
          },
        });
      });
    }
  }, [isOpen]);

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) audioRef.current.play();
      else audioRef.current.pause();
      setIsMuted(!isMuted);
    }
  };

  const groomName = data.groom?.nickname || data.groom?.fullName?.split(" ")[0] || "";
  const brideName = data.bride?.nickname || data.bride?.fullName?.split(" ")[0] || "";

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-[#5A4B4B] overflow-x-hidden font-serif selection:bg-[#FCE2E6] selection:text-[#5A4B4B]">
      {/* 1. Entrance Cover */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div exit={{ opacity: 0, scale: 1.1, transition: { duration: 1.2, ease: "easeInOut" } }} className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            {/* Soft decorative background */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
            <div className="absolute inset-0 bg-radial-to-br from-white via-[#FFF5F7] to-[#FCE2E6] opacity-50" />

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1 }} className="z-10 text-center space-y-12 p-6">
              <div className="space-y-4">
                <IconHeartFilled className="w-12 h-12 mx-auto text-[#FFB7C5] animate-pulse" />
                <p className="font-sans uppercase tracking-[0.6em] text-[10px] text-[#A68F8F]">The Wedding Of</p>
                <h1 className="text-5xl md:text-6xl font-light italic text-[#A67B7B]">
                  {groomName} &amp; {brideName}
                </h1>
              </div>

              <div className="space-y-3">
                <p className="text-sm italic opacity-60">Kepada Yth. Bapak/Ibu/Saudara/i</p>
                <div className="h-px w-20 bg-[#A67B7B]/30 mx-auto" />
                <h2 className="text-2xl font-bold text-[#A67B7B] uppercase tracking-wider">{data.guestName || "Tamu Kehormatan"}</h2>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="bg-[#A67B7B] text-white px-10 py-4 rounded-full font-sans font-bold text-xs tracking-widest shadow-xl shadow-[#A67B7B]/20 transition-all hover:bg-[#8F6666]"
              >
                BUKA UNDANGAN
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Content */}
      <main className={`relative ${!isOpen ? "h-screen overflow-hidden" : ""}`}>
        {/* Floating Petals Container */}
        <div ref={petalsContainerRef} className="fixed inset-0 pointer-events-none z-40" />

        {/* Constrained layout for mobile priority */}
        <div className="max-w-md md:max-w-lg mx-auto bg-white shadow-2xl relative">
          {/* Section: Hero */}
          <section className="relative h-[80vh] flex flex-col items-center justify-center p-8 text-center bg-[#FFF5F7]">
            <div className="absolute inset-0 opacity-20">
              <img src={data.gallery?.[0] || data.bride?.photo || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069"} className="w-full h-full object-cover" alt="Hero" />
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-[#FFF5F7]" />
            </div>

            <div className="z-10 space-y-6">
              <p className="font-sans uppercase tracking-widest text-xs text-[#A68F8F]">Kami Akan Menikah</p>
              <div className="space-y-2">
                <h1 className="text-6xl font-light italic text-[#A67B7B]">{groomName}</h1>
                <div className="flex items-center justify-center gap-3">
                  <div className="h-px w-12 bg-[#A67B7B]/30" />
                  <IconHeartFilled className="text-[#FFB7C5] w-4 h-4" />
                  <div className="h-px w-12 bg-[#A67B7B]/30" />
                </div>
                <h1 className="text-6xl font-light italic text-[#A67B7B]">{brideName}</h1>
              </div>
              <p className="text-lg font-sans tracking-widest text-[#A68F8F]">{format(mainDate, "EEEE, dd . MM . yyyy", { locale: idLocale })}</p>
            </div>

            <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-12 opacity-30">
              <IconChevronDown />
            </motion.div>
          </section>

          {/* Section: Verse */}
          <section className="py-20 px-10 text-center italic text-[#8B7E7E] space-y-4 romantic-reveal">
            <IconHeart className="w-8 h-8 mx-auto opacity-30 fill-[#FFB7C5]" />
            <p className="text-lg leading-relaxed">
              {data.story?.content ||
                '"Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang."'}
            </p>
            <p className="font-sans font-bold text-xs uppercase tracking-widest text-[#A67B7B]">{data.story?.title || "QS. Ar-Rum: 21"}</p>
          </section>

          {/* Section: Couple */}
          <section className="py-24 px-8 border-t border-[#FCE2E6]">
            <div className="space-y-24">
              {/* Groom */}
              <div className="text-center space-y-8 romantic-reveal">
                <div className="relative inline-block">
                  <div className="w-64 h-64 rounded-full border-8 border-[#FFF5F7] overflow-hidden shadow-xl mx-auto">
                    <img src={data.groom?.photo || "https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=2070"} className="w-full h-full object-cover" alt="Groom" />
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow-lg border border-[#FCE2E6] font-bold text-xs text-[#A67B7B]">GROOM</div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl italic text-[#A67B7B]">{data.groom?.fullName}</h2>
                  <p className="text-xs font-sans tracking-widest opacity-60">Putra Dari</p>
                  <p className="text-lg font-bold">
                    Bpk. {data.groom?.fatherName} &amp; Ibu {data.groom?.motherName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 opacity-20 romantic-reveal">
                <div className="h-px flex-1 bg-[#A67B7B]" />
                <IconHeartFilled className="w-6 h-6 text-[#A67B7B]" />
                <div className="h-px flex-1 bg-[#A67B7B]" />
              </div>

              {/* Bride */}
              <div className="text-center space-y-8 romantic-reveal">
                <div className="relative inline-block">
                  <div className="w-64 h-64 rounded-full border-8 border-[#FFF5F7] overflow-hidden shadow-xl mx-auto">
                    <img src={data.bride?.photo || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070"} className="w-full h-full object-cover" alt="Bride" />
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow-lg border border-[#FCE2E6] font-bold text-xs text-[#A67B7B]">BRIDE</div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl italic text-[#A67B7B]">{data.bride?.fullName}</h2>
                  <p className="text-xs font-sans tracking-widest opacity-60">Putri Dari</p>
                  <p className="text-lg font-bold">
                    Bpk. {data.bride?.fatherName} &amp; Ibu {data.bride?.motherName}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Schedule (Multiple Events) */}
          <section className="py-24 px-8 bg-[#FFF5F7] text-center space-y-16">
            <div className="space-y-4 romantic-reveal">
              <h2 className="text-4xl italic text-[#A67B7B]">Waktu &amp; Lokasi</h2>
              <div className="h-1 w-12 bg-[#FFB7C5] mx-auto rounded-full" />
            </div>

            <div className="space-y-8">
              {eventsToRender.map((evt: any, idx) => (
                <div key={idx} className="bg-white p-10 rounded-3xl shadow-xl space-y-6 romantic-reveal">
                  <div className="space-y-2">
                    <IconCalendar className="w-10 h-10 mx-auto text-[#FFB7C5]" />
                    <h3 className="text-2xl italic text-[#A67B7B]">{evt.title}</h3>
                  </div>
                  <div className="h-px w-8 bg-[#FFB7C5]/30 mx-auto" />
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="font-sans font-bold uppercase tracking-widest text-[#A67B7B] text-[10px]">Hari & Tanggal</p>
                      <p className="text-xl font-bold">{evt.date ? format(new Date(evt.date), "EEEE, d MMMM yyyy", { locale: idLocale }) : "-"}</p>
                      <p className="text-lg italic opacity-60">{evt.time || "-"} WIB</p>
                    </div>
                    <div className="space-y-1">
                      <IconMapPin className="w-4 h-4 mx-auto text-[#FFB7C5]" />
                      <p className="font-sans font-bold uppercase tracking-widest text-[#A67B7B] text-[10px]">Lokasi Gedung</p>
                      <p className="text-xl font-bold uppercase">{evt.venue || "-"}</p>
                      <p className="text-sm opacity-60 leading-relaxed font-sans px-4">{evt.address || "-"}</p>
                    </div>
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={evt.maps || evt.mapUrl}
                      target="_blank"
                      className="inline-block bg-[#A67B7B] text-white px-8 py-3 rounded-full font-sans font-bold text-xs tracking-widest shadow-lg shadow-[#A67B7B]/20"
                    >
                      BUKA PETA
                    </motion.a>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Streaming Optional */}
            {data.streaming?.enabled && (
              <div className="romantic-reveal bg-[#A67B7B]/5 p-8 rounded-3xl border border-[#A67B7B]/10 space-y-4">
                <p className="text-xs uppercase tracking-widest font-bold">Live Streaming</p>
                <p className="italic text-sm opacity-60">Saksikan momen bahagia kami secara virtual melalui:</p>
                <p className="text-lg font-bold">{data.streaming.platform}</p>
                <motion.a whileHover={{ scale: 1.05 }} href={data.streaming.url} target="_blank" className="inline-block border border-[#A67B7B] text-[#A67B7B] px-8 py-3 rounded-full font-sans font-bold text-xs tracking-widest">
                  GABUNG STREAMING
                </motion.a>
              </div>
            )}
          </section>

          {/* Section: Extended Family (Turut Mengundang) */}
          {data.extendedFamily?.members && data.extendedFamily.members.length > 0 && (
            <section className="py-24 px-10 text-center space-y-8 border-y border-[#FCE2E6]">
              <div className="space-y-2 romantic-reveal">
                <h2 className="text-3xl italic text-[#A67B7B]">{data.extendedFamily.title}</h2>
                <div className="h-px w-12 bg-[#FFB7C5] mx-auto opacity-30" />
              </div>
              <div className="grid grid-cols-1 gap-2 romantic-reveal">
                {data.extendedFamily.members.map((name, i) => (
                  <p key={i} className="text-lg font-medium opacity-80">
                    {name}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Section: Gallery */}
          {data.gallery && data.gallery.length > 0 && (
            <section className="py-24 px-6 space-y-12">
              <div className="text-center space-y-2 romantic-reveal">
                <h2 className="text-4xl italic text-[#A67B7B]">Galeri Cinta</h2>
                <IconHeart className="w-4 h-4 mx-auto text-[#FFB7C5]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {data.gallery.slice(0, 6).map((img, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.02 }} className={`overflow-hidden rounded-2xl shadow-lg border-2 border-white ${i % 3 === 0 ? "col-span-2 aspect-video" : "aspect-square"}`}>
                    <img src={img} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Protocols */}
          {data.protocol?.enabled && (
            <section className="py-24 px-8 bg-white text-center space-y-12">
              <div className="space-y-4 romantic-reveal">
                <h2 className="text-3xl italic text-[#A67B7B]">Protokol Kesehatan</h2>
                <p className="text-sm italic opacity-60">Demi kenyamanan bersama, para tamu undangan diharapkan mematuhi protokol kesehatan:</p>
              </div>
              <div className="grid grid-cols-3 gap-4 romantic-reveal">
                {(data.protocol.items || ["Masker", "Cuci Tangan", "Jaga Jarak"]).map((item, idx) => (
                  <div key={idx} className="space-y-2 opacity-60">
                    <div className="w-12 h-12 rounded-full bg-[#FFF5F7] mx-auto flex items-center justify-center text-[#FFB7C5]">
                      {item.includes("Masker") && <span className="text-sm">😷</span>}
                      {item.includes("Cuci") && <span className="text-sm">🧼</span>}
                      {item.includes("Jarak") && <span className="text-sm">↔️</span>}
                      {!["Masker", "Cuci", "Jarak"].some((k) => item.includes(k)) && <span className="text-sm">✅</span>}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Gift */}
          {data.gifts?.enabled && (
            <section className="py-24 px-8 bg-[#FFF5F7] text-center">
              <div className="space-y-12">
                <div className="space-y-4 romantic-reveal">
                  <IconGift className="w-10 h-10 mx-auto text-[#FFB7C5]" />
                  <h2 className="text-4xl italic text-[#A67B7B]">Kado Digital</h2>
                  <p className="text-sm italic text-[#8B7E7E]">Doa restu Anda sangat berarti bagi kami. Namun jika ingin berbagi kado, Anda bisa melalui:</p>
                </div>

                <div className="space-y-4">
                  {data.gifts.bankAccounts?.map((bank, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.02 }} className="bg-white p-8 rounded-3xl shadow-lg border border-[#FCE2E6] space-y-4 romantic-reveal">
                      <p className="font-sans font-bold text-[#A67B7B] uppercase tracking-widest text-[10px]">{bank.bankName}</p>
                      <p className="text-2xl font-black text-[#5A4B4B]">{bank.accountNumber}</p>
                      <p className="text-sm italic opacity-60">a.n {bank.accountHolder}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(bank.accountNumber);
                          toast.success("Nomor rekening berhasil disalin!");
                        }}
                        className="text-[10px] font-sans font-bold uppercase tracking-widest border-b border-[#A67B7B] pb-1 hover:text-[#A67B7B]"
                      >
                        SALIN NOMOR
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="py-32 px-10 text-center bg-white border-t border-[#FCE2E6]">
            <div className="space-y-4 romantic-reveal">
              <p className="text-lg italic text-[#8B7E7E]">Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh</p>
              <h3 className="text-4xl italic text-[#A67B7B]">
                {groomName} &amp; {brideName}
              </h3>
              <div className="pt-24 space-y-2 opacity-30">
                <p className="text-[8px] uppercase tracking-[0.4em] font-sans font-bold">Made with Heart</p>
                <p className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold">Official Invitation by Nika.id</p>
              </div>
            </div>
          </footer>
        </div>

        {/* Floating Controls */}
        <div className="max-w-md md:max-w-lg mx-auto relative h-0">
          {data.music?.enabled && isOpen && (
            <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={toggleMute} className="fixed bottom-6 right-6 z-50 bg-white/80 backdrop-blur-md p-4 rounded-full shadow-2xl border border-[#FCE2E6] text-[#A67B7B]">
              {isMuted ? <IconMusicOff size={20} /> : <IconMusic size={20} className="animate-pulse" />}
            </motion.button>
          )}
        </div>
      </main>
    </div>
  );
}
