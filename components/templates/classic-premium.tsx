/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { IconHeart, IconMapPin, IconCalendar, IconClock, IconGift, IconPhoto, IconMusic, IconMusicOff, IconPlayerPlay, IconChevronDown, IconHeartFilled, IconBook } from "@tabler/icons-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WeddingData } from "@/types/wedding";
import { toast } from "sonner";

gsap.registerPlugin(ScrollTrigger);

// ═══════════════════════════════════════════════════════════
// CLASSIC PREMIUM — Elegant serif with warm cream tones
// ═══════════════════════════════════════════════════════════
const FadeInWhenVisible = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay }}>
    {children}
  </motion.div>
);

export default function ClassicPremium({ data }: { data: WeddingData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const floralRef = useRef<HTMLDivElement>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Normalize events
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

  // Countdown
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

  // Music
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

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) audioRef.current.play();
      else audioRef.current.pause();
      setIsMuted(!isMuted);
    }
  };

  // GSAP Animations
  useEffect(() => {
    if (isOpen) {
      if (floralRef.current) {
        gsap.to(floralRef.current, { rotation: 360, duration: 200, repeat: -1, ease: "none" });
      }

      gsap.utils.toArray(".premium-section").forEach((section: any) => {
        gsap.from(section, {
          scrollTrigger: { trigger: section, start: "top 80%", toggleActions: "play none none reverse" },
          opacity: 0,
          y: 50,
          duration: 1,
          ease: "power2.out",
        });
      });
    }
  }, [isOpen]);

  const groomName = data.groom?.nickname || data.groom?.fullName?.split(" ")[0] || "";
  const brideName = data.bride?.nickname || data.bride?.fullName?.split(" ")[0] || "";

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FDF8F5] font-serif text-[#4A403A] overflow-x-hidden">
      {/* ═══ COVER PAGE ═══ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div exit={{ y: "-100%", transition: { duration: 1, ease: [0.76, 0, 0.24, 1] } }} className="fixed inset-0 z-50 flex items-center justify-center bg-white">
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/floral-paper.png')]" />
            <div className="absolute inset-0 bg-radial-to-br from-white via-[#FDF8F5] to-[#F0E6DD] opacity-40" />

            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2 }} className="z-10 text-center space-y-10 p-8">
              {/* Decorative circle with photo */}
              <div className="relative w-36 h-36 mx-auto border-2 border-[#C4A484]/30 rounded-full flex items-center justify-center overflow-hidden">
                <Image src={data.groom?.photo || data.bride?.photo || "https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=2070"} fill className="object-cover rounded-full" alt="Cover" />
              </div>

              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.6em] text-[#C4A484] font-sans">The Wedding Celebration Of</p>
                <h1 className="text-5xl md:text-7xl font-light italic">
                  {groomName} <span className="text-[#C4A484] font-sans text-3xl">&</span> {brideName}
                </h1>
                <div className="h-px w-20 bg-[#C4A484] mx-auto" />
              </div>

              <div className="space-y-3">
                <p className="text-sm italic opacity-60">Kepada Yth.</p>
                <h2 className="text-2xl font-bold text-[#C4A484] uppercase tracking-wider">{data.guestName || "Tamu Undangan"}</h2>
              </div>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#C4A484", color: "#fff" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="group flex items-center gap-3 mx-auto border-2 border-[#C4A484] px-10 py-4 rounded-full font-sans font-bold text-xs tracking-[0.2em] text-[#C4A484] transition-all"
              >
                <IconPlayerPlay className="w-4 h-4 fill-current" />
                BUKA UNDANGAN
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className={`${!isOpen ? "h-screen overflow-hidden" : ""}`}>
        {/* Hero Section */}
        <section className="relative h-screen flex flex-col items-center justify-center text-center p-6 bg-white overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/floral-paper.png')]" />

          {/* Animated Floral Element */}
          <div ref={floralRef} className="absolute -top-20 -right-20 w-80 h-80 opacity-10 pointer-events-none">
            <Image src="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=2000" fill className="object-contain rounded-full" alt="decoration" />
          </div>

          <motion.div className="z-10 space-y-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: "easeOut" }}>
            <p className="text-sm uppercase tracking-[0.4em] text-[#C4A484] font-sans">The Wedding Celebration Of</p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <h1 className="text-6xl md:text-8xl font-light italic">{groomName}</h1>
              <motion.span initial={{ opacity: 0, rotate: -20 }} animate={{ opacity: 1, rotate: 0 }} transition={{ delay: 0.8 }} className="text-4xl text-[#C4A484] font-sans">
                &
              </motion.span>
              <h1 className="text-6xl md:text-8xl font-light italic">{brideName}</h1>
            </div>
            <motion.div initial={{ width: 0 }} animate={{ width: 96 }} className="h-px bg-[#C4A484] mx-auto" transition={{ delay: 0.5, duration: 1 }} />
            <p className="text-xl tracking-widest font-sans">{format(eventDate, "dd . MM . yyyy")}</p>
          </motion.div>

          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-10 text-[#C4A484] opacity-40">
            <IconChevronDown className="w-8 h-8" />
          </motion.div>
        </section>

        {/* Countdown Section */}
        <section className="py-20 px-6 bg-[#4A403A] text-white text-center premium-section">
          <div className="max-w-4xl mx-auto space-y-10">
            <h2 className="text-2xl font-light tracking-[0.3em] uppercase text-[#C4A484]">Menuju Hari Bahagia</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Hari", value: timeLeft.days },
                { label: "Jam", value: timeLeft.hours },
                { label: "Menit", value: timeLeft.minutes },
                { label: "Detik", value: timeLeft.seconds },
              ].map((item, i) => (
                <motion.div key={i} whileHover={{ scale: 1.05 }} className="bg-white/5 p-8 rounded-3xl border border-[#C4A484]/20">
                  <p className="text-4xl font-black text-[#C4A484]">{item.value}</p>
                  <p className="text-xs uppercase tracking-widest opacity-50 mt-2">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Intro Section */}
        <section className="py-24 px-6 text-center max-w-2xl mx-auto space-y-6 premium-section">
          <IconHeart className="w-8 h-8 mx-auto text-[#C4A484] fill-current opacity-50" />
          <p className="text-lg leading-relaxed italic">
            &ldquo;{data.quote?.text || "Maka timbulah kasih sayang di antara mereka. Sungguh pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir."}&rdquo;
          </p>
          <p className="text-sm font-sans font-bold uppercase tracking-wider text-[#C4A484]">{data.quote?.source || "Ar-Rum: 21"}</p>
        </section>

        {/* Couple Detail Section */}
        <section className="py-24 px-6 bg-white overflow-hidden">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-20">
            <motion.div whileInView={{ x: 0, opacity: 1 }} initial={{ x: -100, opacity: 0 }} viewport={{ once: true }} transition={{ duration: 1 }} className="text-center space-y-6">
              <div className="relative inline-block">
                <div className="relative w-56 h-72 bg-[#FDF8F5] rounded-t-full border-8 border-white shadow-2xl overflow-hidden group">
                  {data.groom.photo ? (
                    <Image src={data.groom.photo} alt={data.groom.fullName} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[#C4A484]">Groom Photo</div>
                  )}
                </div>
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} className="absolute -bottom-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                  🤵
                </motion.div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl italic">{data.groom.fullName}</h2>
                <p className="text-sm text-gray-500 font-sans">Putra dari</p>
                <p className="text-lg font-bold">
                  Bpk. {data.groom.fatherName} & Ibu {data.groom.motherName}
                </p>
                {data.groom.instagram && <p className="text-xs text-[#C4A484] font-sans">@{data.groom.instagram}</p>}
              </div>
            </motion.div>

            <motion.div whileInView={{ x: 0, opacity: 1 }} initial={{ x: 100, opacity: 0 }} viewport={{ once: true }} transition={{ duration: 1 }} className="text-center space-y-6">
              <div className="relative inline-block">
                <div className="relative w-56 h-72 bg-[#FDF8F5] rounded-t-full border-8 border-white shadow-2xl overflow-hidden group">
                  {data.bride.photo ? (
                    <Image src={data.bride.photo} alt={data.bride.fullName} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[#C4A484]">Bride Photo</div>
                  )}
                </div>
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} className="absolute -bottom-4 -left-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                  👰
                </motion.div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl italic">{data.bride.fullName}</h2>
                <p className="text-sm text-gray-500 font-sans">Putri dari</p>
                <p className="text-lg font-bold">
                  Bpk. {data.bride.fatherName} & Ibu {data.bride.motherName}
                </p>
                {data.bride.instagram && <p className="text-xs text-[#C4A484] font-sans">@{data.bride.instagram}</p>}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Event Info — Multiple Events */}
        <section className="py-24 px-6 bg-[#F9F3EE] relative overflow-hidden">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-12 text-center">
            <FadeInWhenVisible>
              <div className="space-y-2">
                <h2 className="text-4xl italic">Akad & Resepsi</h2>
                <div className="h-px w-16 bg-[#C4A484] mx-auto" />
              </div>
            </FadeInWhenVisible>

            <div className="grid md:grid-cols-2 gap-8 w-full">
              {eventsToRender.map((evt: any, idx: number) => (
                <motion.div key={idx} whileHover={{ y: -10 }} className="bg-white p-10 rounded-3xl shadow-xl space-y-6 transition-all">
                  <h3 className="text-2xl italic text-[#C4A484]">{evt.title}</h3>
                  <div className="h-px w-8 bg-[#C4A484]/30 mx-auto" />
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <IconCalendar className="w-10 h-10 mx-auto text-[#C4A484]" />
                      <p className="font-sans font-bold uppercase tracking-widest text-[#C4A484]">Hari & Tanggal</p>
                      <p className="text-xl font-bold">{evt.date ? format(new Date(evt.date), "EEEE, d MMMM yyyy", { locale: idLocale }) : "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <IconClock className="w-10 h-10 mx-auto text-[#C4A484]" />
                      <p className="font-sans font-bold uppercase tracking-widest text-[#C4A484]">Waktu Acara</p>
                      <p className="text-xl font-bold">{evt.time || "-"} WIB - Selesai</p>
                    </div>
                    <div className="space-y-1">
                      <IconMapPin className="w-10 h-10 mx-auto text-[#C4A484]" />
                      <p className="font-sans font-bold uppercase tracking-widest text-[#C4A484]">Lokasi Acara</p>
                      <p className="text-xl font-bold">{evt.venue || "-"}</p>
                      <p className="text-gray-500 leading-relaxed">{evt.address || "-"}</p>
                    </div>
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={evt.maps || evt.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-[#4A403A] text-white px-8 py-3 rounded-full font-sans font-bold hover:bg-[#C4A484] transition-colors"
                    >
                      Buka Google Maps
                    </motion.a>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Streaming */}
            {data.streaming?.enabled && (
              <FadeInWhenVisible delay={0.2}>
                <div className="bg-[#4A403A] text-white p-10 rounded-3xl shadow-xl space-y-4 max-w-2xl w-full">
                  <h4 className="text-xl font-light italic text-[#C4A484]">Saksikan melalui {data.streaming.platform}</h4>
                  <p className="text-sm opacity-60">Bagi kerabat yang berhalangan hadir secara fisik.</p>
                  <motion.a whileHover={{ scale: 1.05 }} href={data.streaming.url} target="_blank" className="inline-block border border-[#C4A484] text-[#C4A484] px-10 py-3 rounded-full text-xs font-bold uppercase tracking-widest">
                    Gabung Streaming
                  </motion.a>
                </div>
              </FadeInWhenVisible>
            )}
          </div>
        </section>

        {/* Love Story Section */}
        {data.loveStory?.enabled && data.loveStory.chapters?.length > 0 && (
          <section className="py-24 px-6 bg-white premium-section">
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="text-center space-y-2">
                <IconBook className="w-8 h-8 mx-auto text-[#C4A484] opacity-50" />
                <h2 className="text-4xl italic">Kisah Cinta Kami</h2>
                <div className="h-px w-16 bg-[#C4A484] mx-auto" />
              </div>

              <div className="relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#C4A484]/20 -translate-x-1/2" />
                {data.loveStory.chapters.map((chapter, i) => (
                  <div key={i} className={`relative flex items-center gap-8 mb-12 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                    <div className="flex-1 text-center md:text-right">
                      {i % 2 === 0 && (
                        <FadeInWhenVisible delay={i * 0.1}>
                          <div className="bg-[#FDF8F5] p-8 rounded-3xl shadow-lg">
                            <h3 className="text-xl italic text-[#C4A484] mb-3">{chapter.title}</h3>
                            <p className="text-sm leading-relaxed opacity-80">{chapter.content}</p>
                          </div>
                        </FadeInWhenVisible>
                      )}
                    </div>
                    <div className="relative z-10 w-10 h-10 bg-white rounded-full border-2 border-[#C4A484] flex items-center justify-center shrink-0 shadow-lg">
                      <IconHeartFilled className="w-4 h-4 text-[#C4A484]" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      {i % 2 !== 0 && (
                        <FadeInWhenVisible delay={i * 0.1}>
                          <div className="bg-[#FDF8F5] p-8 rounded-3xl shadow-lg">
                            <h3 className="text-xl italic text-[#C4A484] mb-3">{chapter.title}</h3>
                            <p className="text-sm leading-relaxed opacity-80">{chapter.content}</p>
                          </div>
                        </FadeInWhenVisible>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery Section */}
        {data.gallery && data.gallery.length > 0 && (
          <section className="py-24 px-6 bg-[#FDF8F5] overflow-hidden">
            <div className="max-w-6xl mx-auto space-y-12">
              <FadeInWhenVisible>
                <div className="text-center space-y-2">
                  <IconPhoto className="w-8 h-8 mx-auto text-[#C4A484]" />
                  <h2 className="text-4xl italic">Momen Bahagia</h2>
                  <div className="h-px w-16 bg-[#C4A484] mx-auto" />
                </div>
              </FadeInWhenVisible>

              <div className="columns-1 md:columns-3 gap-4 space-y-4">
                {data.gallery.map((photo, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:opacity-90 transition-opacity"
                  >
                    <Image src={photo} alt={`Gallery ${i}`} fill className="object-cover" />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gift / Digital Envelope */}
        {data.gifts?.enabled && (
          <section className="py-24 px-6 bg-white text-center premium-section">
            <div className="max-w-xl mx-auto space-y-10">
              <div className="space-y-2">
                <IconGift className="w-8 h-8 mx-auto text-[#C4A484] fill-current" />
                <h2 className="text-4xl italic">Kado Pernikahan</h2>
                <div className="h-px w-16 bg-[#C4A484] mx-auto" />
                <p className="text-gray-500 font-sans mt-4">Doa restu Anda adalah karunia yang sangat berarti. Namun jika ingin berbagi kasih, Anda bisa melalui:</p>
              </div>

              <div className="space-y-4">
                {data.gifts.bankAccounts?.map((bank, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.02 }} className="bg-[#FDF8F5] p-8 rounded-3xl shadow-lg space-y-4">
                    <p className="font-bold text-[#C4A484]">{bank.bankName}</p>
                    <p className="text-2xl font-black">{bank.accountNumber}</p>
                    <p className="text-sm font-sans text-gray-400">a.n {bank.accountHolder}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(bank.accountNumber);
                        toast.success("Nomor rekening disalin!");
                      }}
                      className="text-xs font-sans font-bold uppercase tracking-widest border border-[#C4A484] px-6 py-2 rounded-full hover:bg-[#C4A484] hover:text-white transition-all"
                    >
                      Salin Rekening
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Extended Family */}
        {data.extendedFamily?.members && data.extendedFamily.members.length > 0 && (
          <section className="py-24 px-6 bg-[#F9F3EE] premium-section">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl italic">{data.extendedFamily.title}</h2>
                <div className="h-px w-16 bg-[#C4A484] mx-auto opacity-30" />
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

        {/* Music Toggle */}
        {data.music?.enabled && isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={toggleMute}
            className="fixed bottom-8 right-8 z-40 bg-white/80 backdrop-blur-md p-4 rounded-full shadow-2xl border border-[#C4A484]/20 text-[#C4A484]"
          >
            {isMuted ? <IconMusicOff size={24} /> : <IconMusic size={24} className="animate-pulse" />}
          </motion.button>
        )}

        {/* Footer */}
        <footer className="py-24 px-6 text-center bg-[#4A403A] text-white">
          <div className="space-y-4">
            <FadeInWhenVisible>
              <p className="italic text-xl">Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh</p>
              <h3 className="text-4xl font-light mt-4 text-[#C4A484]">
                {groomName} & {brideName}
              </h3>
            </FadeInWhenVisible>
            <div className="pt-16 text-[10px] tracking-[0.3em] uppercase opacity-50">Official Invitation by Nika.id</div>
          </div>
        </footer>
      </main>
    </div>
  );
}
