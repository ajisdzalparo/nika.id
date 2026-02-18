/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { IconMapPin, IconCalendar, IconClock, IconGift, IconMusic, IconMusicOff, IconPlayerPlay, IconChevronDown, IconBook } from "@tabler/icons-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WeddingData } from "@/types/wedding";
import { toast } from "sonner";

gsap.registerPlugin(ScrollTrigger);

// ═══════════════════════════════════════════════════════════
// MODERN DARK — Bold, high-contrast, editorial
// ═══════════════════════════════════════════════════════════
export default function ModernDark({ data }: { data: WeddingData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleGroomRef = useRef<HTMLHeadingElement>(null);
  const titleBrideRef = useRef<HTMLHeadingElement>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Normalize events
  const eventsToRender: any[] =
    data.events && data.events.length > 0
      ? data.events
      : data.event
        ? [
            {
              id: "primary",
              title: "The Ceremony",
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
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from(titleGroomRef.current, { y: 100, opacity: 0, duration: 1.5 }).from(titleBrideRef.current, { y: 100, opacity: 0, duration: 1.5 }, "-=1").from(".hero-text", { opacity: 0, y: 20, duration: 1, stagger: 0.2 }, "-=1");

      gsap.utils.toArray(".reveal-card").forEach((card: any) => {
        gsap.from(card, {
          scrollTrigger: { trigger: card, start: "top 85%" },
          opacity: 0,
          scale: 0.9,
          y: 30,
          duration: 1,
          ease: "expo.out",
        });
      });

      gsap.from(".gallery-item", {
        scrollTrigger: { trigger: ".gallery-grid", start: "top 70%" },
        opacity: 0,
        y: 50,
        stagger: 0.1,
        duration: 0.8,
        ease: "power2.out",
      });
    }
  }, [isOpen]);

  const groomName = data.groom?.nickname || data.groom?.fullName?.split(" ")[0] || "";
  const brideName = data.bride?.nickname || data.bride?.fullName?.split(" ")[0] || "";

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      {/* ═══ COVER PAGE ═══ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div exit={{ opacity: 0, scale: 1.1, transition: { duration: 1.2, ease: "easeInOut" } }} className="fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />

            {/* Background image with dark overlay */}
            <div className="absolute inset-0 opacity-30">
              <Image src={data.gallery?.[0] || data.bride?.photo || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070"} fill className="object-cover" alt="bg" />
              <div className="absolute inset-0 bg-black/60" />
            </div>

            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.5 }} className="z-10 text-center space-y-10 p-8">
              <div className="space-y-6">
                <p className="text-[10px] uppercase tracking-[1em] text-white/40 font-light">Wedding Invitation</p>
                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">{groomName}</h1>
                <div className="flex items-center justify-center gap-4">
                  <div className="h-px w-12 bg-white/20" />
                  <span className="text-2xl font-light italic text-white/40">and</span>
                  <div className="h-px w-12 bg-white/20" />
                </div>
                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">{brideName}</h1>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-widest opacity-40">Dear,</p>
                <h2 className="text-2xl font-bold uppercase tracking-wider">{data.guestName || "Special Guest"}</h2>
              </div>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#fff", color: "#000" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="group flex items-center gap-3 mx-auto border border-white/30 px-10 py-4 rounded-full font-bold text-xs tracking-[0.3em] transition-all"
              >
                <IconPlayerPlay className="w-4 h-4 fill-current" />
                OPEN INVITATION
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className={`${!isOpen ? "h-screen overflow-hidden" : ""}`}>
        {/* Background Video/Image Overlay */}
        <div className="fixed inset-0 z-0 opacity-40">
          {data.video ? (
            <video autoPlay muted loop className="w-full h-full object-cover">
              <source src={data.video} type="video/mp4" />
            </video>
          ) : (
            <div className="w-full h-full bg-[#1A1A1A] bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
          )}
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black" />
        </div>

        {/* Hero Section */}
        <section ref={heroRef} className="relative h-screen flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="space-y-6">
            <p className="hero-text text-xs uppercase tracking-[0.8em] font-light opacity-60">The Wedding Of</p>
            <div className="space-y-0">
              <h1 ref={titleGroomRef} className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-none">
                {groomName}
              </h1>
              <div className="hero-text flex items-center justify-center gap-4">
                <div className="h-px w-12 bg-white/20" />
                <span className="text-2xl font-light italic text-white/40">and</span>
                <div className="h-px w-12 bg-white/20" />
              </div>
              <h1 ref={titleBrideRef} className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-none">
                {brideName}
              </h1>
            </div>
            <p className="hero-text text-lg font-light tracking-[0.4em] uppercase pt-4">{format(eventDate, "MMMM d . yyyy")}</p>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 2 }} className="absolute bottom-10 animate-bounce">
            <div className="w-px h-12 bg-white" />
          </motion.div>
        </section>

        {/* Countdown Section */}
        <section className="relative z-10 py-24 px-6 text-center bg-black/60 backdrop-blur-md border-y border-white/10">
          <div className="max-w-4xl mx-auto space-y-10 reveal-card">
            <h2 className="text-2xl font-black uppercase tracking-[0.5em]">Countdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Days", value: timeLeft.days },
                { label: "Hours", value: timeLeft.hours },
                { label: "Minutes", value: timeLeft.minutes },
                { label: "Seconds", value: timeLeft.seconds },
              ].map((item, i) => (
                <motion.div key={i} whileHover={{ scale: 1.05 }} className="p-8 border border-white/10 rounded-3xl bg-white/5">
                  <p className="text-5xl font-black">{item.value}</p>
                  <p className="text-xs uppercase tracking-widest opacity-40 mt-2">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Guest Greeting */}
        <section className="relative z-10 py-24 px-6 text-center border-b border-white/10 bg-black/40 backdrop-blur-md reveal-card">
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-xs uppercase tracking-widest opacity-50">Dear,</p>
            <h2 className="text-4xl font-bold">{data.guestName}</h2>
            <p className="text-lg font-light text-white/70 italic">Kami menunggu kehadiran Anda untuk merayakan cinta kami.</p>
          </div>
        </section>

        {/* Couple Section */}
        <section className="relative z-10 py-32 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-32">
            <div className="space-y-8 flex flex-col items-center md:items-start reveal-card">
              <motion.div whileHover={{ scale: 1.02 }} className="w-72 h-[450px] bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group">
                <Image src={data.groom.photo || "https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=2070"} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Groom" />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Groom</p>
                  <h3 className="text-3xl font-black uppercase tracking-tight">{data.groom.fullName}</h3>
                </div>
              </motion.div>
              <p className="text-left text-white/50 max-w-xs leading-relaxed">
                Putra dari <strong>Bpk. {data.groom.fatherName}</strong> & <strong>Ibu {data.groom.motherName}</strong>
              </p>
            </div>

            <div className="space-y-8 flex flex-col items-center md:items-end md:text-right reveal-card">
              <motion.div whileHover={{ scale: 1.02 }} className="w-72 h-[450px] bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group">
                <Image src={data.bride.photo || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070"} fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Bride" />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-8 right-8">
                  <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Bride</p>
                  <h3 className="text-3xl font-black uppercase tracking-tight">{data.bride.fullName}</h3>
                </div>
              </motion.div>
              <p className="text-white/50 max-w-xs leading-relaxed">
                Putri dari <strong>Bpk. {data.bride.fatherName}</strong> & <strong>Ibu {data.bride.motherName}</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Date & Location — Multiple Events */}
        <section className="relative z-10 py-32 px-6 bg-white text-black rounded-t-[50px] md:rounded-t-[100px]">
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-2 reveal-card">
              <h2 className="text-5xl font-black uppercase tracking-tighter italic">Schedule</h2>
              <div className="h-2 w-20 bg-black mx-auto" />
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {eventsToRender.map((evt: any, idx: number) => (
                <div key={idx} className="space-y-6 reveal-card bg-gray-50 p-10 rounded-3xl">
                  <h3 className="text-2xl font-black uppercase tracking-tight">{evt.title}</h3>
                  <div className="h-1 w-10 bg-black" />
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-4 bg-black text-white rounded-2xl">
                        <IconCalendar />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold uppercase opacity-50">Date</p>
                        <p className="text-xl font-black">{evt.date ? format(new Date(evt.date), "EEEE, MMMM d, yyyy") : "-"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-4 bg-black text-white rounded-2xl">
                        <IconClock />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold uppercase opacity-50">Time</p>
                        <p className="text-xl font-black">{evt.time || "-"} &mdash; End</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="p-4 bg-black text-white rounded-2xl">
                        <IconMapPin />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold uppercase opacity-50">Venue</p>
                        <p className="text-xl font-black uppercase">{evt.venue || "-"}</p>
                        <p className="text-sm opacity-60 leading-relaxed">{evt.address || "-"}</p>
                      </div>
                    </div>
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={evt.maps || evt.mapUrl}
                      target="_blank"
                      className="block w-full text-center bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
                    >
                      View On Maps
                    </motion.a>
                  </div>
                </div>
              ))}
            </div>

            {/* Streaming */}
            {data.streaming?.enabled && (
              <div className="bg-black text-white p-12 rounded-3xl text-center space-y-4 reveal-card">
                <h4 className="text-2xl font-black uppercase">Live Streaming via {data.streaming.platform}</h4>
                <p className="text-sm opacity-50">For those who can&apos;t attend in person.</p>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  href={data.streaming.url}
                  target="_blank"
                  className="inline-block border border-white/30 px-10 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                  Join Stream
                </motion.a>
              </div>
            )}
          </div>
        </section>

        {/* Love Story Section */}
        {data.loveStory?.enabled && data.loveStory.chapters?.length > 0 && (
          <section className="relative z-10 py-32 px-6 bg-white text-black">
            <div className="max-w-4xl mx-auto space-y-16">
              <div className="text-center space-y-2 reveal-card">
                <IconBook className="w-10 h-10 mx-auto opacity-30" />
                <h2 className="text-5xl font-black uppercase tracking-tighter italic">Our Story</h2>
                <div className="h-2 w-20 bg-black mx-auto" />
              </div>

              <div className="space-y-0">
                {data.loveStory.chapters.map((chapter, i) => (
                  <div key={i} className={`flex items-stretch gap-8 reveal-card ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}>
                    <div className="flex-1 py-8">
                      <div className="bg-gray-50 p-8 rounded-3xl h-full">
                        <p className="text-xs uppercase tracking-widest font-bold opacity-40 mb-3">Chapter {i + 1}</p>
                        <h3 className="text-2xl font-black uppercase mb-3">{chapter.title}</h3>
                        <p className="text-sm leading-relaxed opacity-70">{chapter.content}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-px flex-1 bg-black/10" />
                      <div className="w-4 h-4 bg-black rounded-full shrink-0 my-2" />
                      <div className="w-px flex-1 bg-black/10" />
                    </div>
                    <div className="flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gallery */}
        <section className="relative z-10 py-32 px-6 bg-white text-black">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="flex justify-between items-end border-b-2 border-black pb-8 reveal-card">
              <h2 className="text-6xl font-black uppercase tracking-tighter italic">Gallery</h2>
              <p className="text-sm uppercase font-bold opacity-40">The Story of Us</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 gallery-grid">
              {data.gallery &&
                data.gallery.slice(0, 8).map((img, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.05, zIndex: 10 }} className={`gallery-item relative overflow-hidden rounded-3xl bg-gray-100 ${i % 3 === 0 ? "col-span-2 row-span-2" : ""}`}>
                    <Image src={img} alt={`Gallery ${i}`} fill className="object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                  </motion.div>
                ))}
            </div>
          </div>
        </section>

        {/* Registry */}
        {data.gifts?.enabled && (
          <section className="relative z-10 py-32 px-6 bg-black text-white text-center">
            <div className="max-w-xl mx-auto space-y-10">
              <IconGift className="w-12 h-12 mx-auto text-white reveal-card" />
              <h2 className="text-5xl font-black uppercase italic reveal-card">Registry</h2>
              <p className="opacity-50 font-light leading-relaxed reveal-card">Your presence is already a gift. But if you wish to contribute to our new journey, you may send your gifts here.</p>

              <div className="space-y-4">
                {data.gifts.bankAccounts?.map((bank, i) => (
                  <motion.div key={i} whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.15)" }} className="reveal-card p-10 border border-white/10 rounded-[40px] bg-white/5 space-y-4 transition-colors group">
                    <p className="text-sm uppercase tracking-widest opacity-40">{bank.bankName}</p>
                    <p className="text-4xl font-black leading-none">{bank.accountNumber}</p>
                    <p className="text-sm opacity-60">a.n {bank.accountHolder}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(bank.accountNumber);
                        toast.success("Account number copied!");
                      }}
                      className="mt-4 text-xs font-black uppercase tracking-widest border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all"
                    >
                      Copy Account
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Extended Family */}
        {data.extendedFamily?.members && data.extendedFamily.members.length > 0 && (
          <section className="relative z-10 py-24 px-6 bg-white text-black text-center reveal-card">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl font-black uppercase tracking-tight">{data.extendedFamily.title}</h2>
              <div className="h-1 w-12 bg-black mx-auto" />
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
            className="fixed bottom-8 right-8 z-40 bg-white/10 backdrop-blur-md p-4 rounded-full shadow-2xl border border-white/10 text-white"
          >
            {isMuted ? <IconMusicOff size={24} /> : <IconMusic size={24} className="animate-pulse" />}
          </motion.button>
        )}

        {/* Footer */}
        <footer className="relative z-10 py-24 px-6 text-center bg-white text-black rounded-b-[40px] md:rounded-b-[80px]">
          <div className="space-y-4 reveal-card">
            <p className="text-xs uppercase tracking-widest opacity-40 italic">Until forever ends</p>
            <h1 className="text-5xl md:text-7xl font-black uppercase italic">
              {groomName} & {brideName}
            </h1>
            <div className="pt-20 opacity-20 text-[8px] uppercase tracking-[1em] font-bold">Powered by Nika.id</div>
          </div>
        </footer>
      </main>
    </div>
  );
}
