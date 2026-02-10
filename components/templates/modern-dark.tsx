/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef } from "react";
import { format } from "date-fns";
import { IconMapPin, IconCalendar, IconClock, IconGift } from "@tabler/icons-react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface BankAccount {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
}

interface WeddingEvent {
  id: string;
  title: string;
  date: string | Date;
  time: string;
  venue: string;
  address: string;
  mapUrl: string;
}

interface WeddingData {
  guestName?: string;
  groom: {
    nickname: string;
    fullName: string;
    fatherName: string;
    motherName: string;
    instagram?: string;
    photo?: string;
  };
  bride: {
    nickname: string;
    fullName: string;
    fatherName: string;
    motherName: string;
    instagram?: string;
    photo?: string;
  };
  events: WeddingEvent[];
  event?: {
    date: string | Date;
    time: string;
    venue: string;
    address: string;
    mapUrl: string;
  };
  gallery: string[];
  video?: string;
  story: {
    title: string;
    content: string;
  };
  gifts: {
    enabled: boolean;
    bankAccounts: BankAccount[];
  };
  extra?: Record<string, string | number | boolean>;
}

export default function ModernDark({ data }: { data: WeddingData }) {
  const primaryEvent = data.events?.[0] || data.event || { date: new Date(), time: "", venue: "", address: "", mapUrl: "" };
  const eventDate = new Date(primaryEvent.date);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleGroomRef = useRef<HTMLHeadingElement>(null);
  const titleBrideRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // GSAP Hero Animation
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.from(titleGroomRef.current, { y: 100, opacity: 0, duration: 1.5 }).from(titleBrideRef.current, { y: 100, opacity: 0, duration: 1.5 }, "-=1").from(".hero-text", { opacity: 0, y: 20, duration: 1, stagger: 0.2 }, "-=1");

    // GSAP Scroll Reveal for cards
    gsap.utils.toArray(".reveal-card").forEach((card: any) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: "top 85%",
        },
        opacity: 0,
        scale: 0.9,
        y: 30,
        duration: 1,
        ease: "expo.out",
      });
    });

    // Masonry items stagger
    gsap.from(".gallery-item", {
      scrollTrigger: {
        trigger: ".gallery-grid",
        start: "top 70%",
      },
      opacity: 0,
      y: 50,
      stagger: 0.1,
      duration: 0.8,
      ease: "power2.out",
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
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
              {data.groom.nickname}
            </h1>
            <div className="hero-text flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-white/20" />
              <span className="text-2xl font-light italic text-white/40">and</span>
              <div className="h-px w-12 bg-white/20" />
            </div>
            <h1 ref={titleBrideRef} className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-none">
              {data.bride.nickname}
            </h1>
          </div>
          <p className="hero-text text-lg font-light tracking-[0.4em] uppercase pt-4">{format(eventDate, "MMMM d . yyyy")}</p>
        </div>

        {/* Floating Scroll Indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 2 }} className="absolute bottom-10 animate-bounce">
          <div className="w-px h-12 bg-white" />
        </motion.div>
      </section>

      {/* Guest Greeting */}
      <section className="relative z-10 py-24 px-6 text-center border-y border-white/10 bg-black/40 backdrop-blur-md reveal-card">
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
              <img src={data.groom.photo || "https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=2070"} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Groom" />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-8 left-8">
                <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Groom</p>
                <h3 className="text-3xl font-black uppercase tracking-tight">{data.groom.fullName}</h3>
              </div>
            </motion.div>
            <p className="text-left text-white/50 max-w-xs leading-relaxed">
              Putra dari <strong>Bpk. {data.groom.fatherName}</strong> &amp; <strong>Ibu {data.groom.motherName}</strong>
            </p>
          </div>

          <div className="space-y-8 flex flex-col items-center md:items-end md:text-right reveal-card">
            <motion.div whileHover={{ scale: 1.02 }} className="w-72 h-[450px] bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group">
              <img src={data.bride.photo || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070"} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Bride" />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-8 right-8">
                <p className="text-xs uppercase tracking-widest opacity-50 mb-1">Bride</p>
                <h3 className="text-3xl font-black uppercase tracking-tight">{data.bride.fullName}</h3>
              </div>
            </motion.div>
            <p className="text-white/50 max-w-xs leading-relaxed">
              Putri dari <strong>Bpk. {data.bride.fatherName}</strong> &amp; <strong>Ibu {data.bride.motherName}</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Date & Location */}
      <section className="relative z-10 py-32 px-6 bg-white text-black rounded-t-[50px] md:rounded-t-[100px]">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-2 reveal-card">
            <h2 className="text-5xl font-black uppercase tracking-tighter italic">Schedule</h2>
            <div className="h-2 w-20 bg-black mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6 reveal-card">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-black text-white rounded-2xl">
                  <IconCalendar />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase opacity-50">Date</p>
                  <p className="text-2xl font-black">{format(eventDate, "EEEE, MMMM d, yyyy")}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-4 bg-black text-white rounded-2xl">
                  <IconClock />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase opacity-50">Time</p>
                  <p className="text-2xl font-black">{primaryEvent.time} &mdash; End</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 reveal-card">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-black text-white rounded-2xl">
                  <IconMapPin />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold uppercase opacity-50">Venue</p>
                  <p className="text-2xl font-black uppercase">{primaryEvent.venue}</p>
                  <p className="text-sm opacity-60 leading-relaxed">{primaryEvent.address}</p>
                </div>
              </div>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={primaryEvent.mapUrl}
                className="block w-full text-center bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
              >
                View On Maps
              </motion.a>
            </div>
          </div>
        </div>
      </section>

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
                <motion.div key={i} whileHover={{ scale: 1.05, zIndex: 10 }} className={`gallery-item overflow-hidden rounded-3xl bg-gray-100 ${i % 3 === 0 ? "col-span-2 row-span-2" : ""}`}>
                  <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* Registry */}
      <section className="relative z-10 py-32 px-6 bg-black text-white text-center">
        <div className="max-w-xl mx-auto space-y-10">
          <IconGift className="w-12 h-12 mx-auto text-white reveal-card" />
          <h2 className="text-5xl font-black uppercase italic reveal-card">Registry</h2>
          <p className="opacity-50 font-light leading-relaxed reveal-card">Your presence is already a gift. But if you wish to contribute to our new journey, you may send your gifts here.</p>

          <div className="space-y-4">
            {data.gifts?.enabled &&
              data.gifts.bankAccounts?.map((bank, i) => (
                <motion.div key={i} whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.15)" }} className="reveal-card p-10 border border-white/10 rounded-[40px] bg-white/5 space-y-4 transition-colors group">
                  <p className="text-sm uppercase tracking-widest opacity-40">{bank.bankName}</p>
                  <p className="text-4xl font-black leading-none">{bank.accountNumber}</p>
                  <p className="text-sm opacity-60">a.n {bank.accountHolder}</p>
                  <button onClick={() => navigator.clipboard.writeText(bank.accountNumber)} className="mt-4 text-xs font-black uppercase tracking-widest border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black">
                    Copy Account
                  </button>
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-24 px-6 text-center bg-white text-black rounded-b-[40px] md:rounded-b-[80px]">
        <div className="space-y-4 reveal-card">
          <p className="text-xs uppercase tracking-widest opacity-40 italic">Until forever ends</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase italic">
            {data.groom.nickname} &amp; {data.bride.nickname}
          </h1>
          <div className="pt-20 opacity-20 text-[8px] uppercase tracking-[1em] font-bold">Powered by Nika.id</div>
        </div>
      </footer>
    </div>
  );
}
