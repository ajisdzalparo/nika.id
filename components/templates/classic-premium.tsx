/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { IconHeart, IconMapPin, IconCalendar, IconClock, IconGift, IconPhoto } from "@tabler/icons-react";
import Image from "next/image";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface BankAccount {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
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
  event: {
    date: Date;
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

const FadeInWhenVisible = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay }}>
      {children}
    </motion.div>
  );
};

export default function ClassicPremium({ data }: { data: WeddingData }) {
  const eventDate = new Date(data.event.date);
  const containerRef = useRef<HTMLDivElement>(null);
  const floralRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // GSAP Floral Animation
    if (floralRef.current) {
      gsap.to(floralRef.current, {
        rotation: 360,
        duration: 200,
        repeat: -1,
        ease: "none",
      });
    }

    // GSAP Parallax or specialized reveals can be added here
    const sections = gsap.utils.toArray(".premium-section");
    sections.forEach((section: any) => {
      gsap.from(section, {
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
        opacity: 0,
        y: 50,
        duration: 1,
        ease: "power2.out",
      });
    });
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FDF8F5] font-serif text-[#4A403A] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center p-6 bg-white overflow-hidden">
        {/* Subtle Floral Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/floral-paper.png')]" />

        {/* Animated Floral Elements with GSAP */}
        <div ref={floralRef} className="absolute -top-20 -right-20 w-80 h-80 opacity-10 pointer-events-none">
          <Image src="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=2000" fill className="object-contain rounded-full" alt="decoration" />
        </div>

        <motion.div className="z-10 space-y-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: "easeOut" }}>
          <p className="text-sm uppercase tracking-[0.4em] text-[#C4A484] font-sans">The Wedding Celebration Of</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <h1 className="text-6xl md:text-8xl font-light italic">{data.groom.nickname}</h1>
            <motion.span initial={{ opacity: 0, rotate: -20 }} animate={{ opacity: 1, rotate: 0 }} transition={{ delay: 0.8 }} className="text-4xl text-[#C4A484] font-sans">
              &amp;
            </motion.span>
            <h1 className="text-6xl md:text-8xl font-light italic">{data.bride.nickname}</h1>
          </div>
          <motion.div initial={{ width: 0 }} animate={{ width: 96 }} className="h-px bg-[#C4A484] mx-auto" transition={{ delay: 0.5, duration: 1 }} />
          <p className="text-xl tracking-widest font-sans">{format(eventDate, "dd . MM . yyyy")}</p>
        </motion.div>
      </section>

      {/* Intro Section */}
      <section className="py-24 px-6 text-center max-w-2xl mx-auto space-y-6 premium-section">
        <IconHeart className="w-8 h-8 mx-auto text-[#C4A484] fill-current opacity-50" />
        <p className="text-lg leading-relaxed italic">&ldquo;Maka timbulah kasih sayang di antara mereka. Sungguh pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.&rdquo;</p>
        <p className="text-sm font-sans font-bold uppercase tracking-wider text-[#C4A484]">Ar-Rum: 21</p>
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
                Bpk. {data.groom.fatherName} &amp; Ibu {data.groom.motherName}
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
                  <div className="w-full h-full f flex items-center justify-center bg-gray-100 text-[#C4A484]">Bride Photo</div>
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
                Bpk. {data.bride.fatherName} &amp; Ibu {data.bride.motherName}
              </p>
              {data.bride.instagram && <p className="text-xs text-[#C4A484] font-sans">@{data.bride.instagram}</p>}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Event Info */}
      <section className="py-24 px-6 bg-[#F9F3EE] relative overflow-hidden">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-12 text-center">
          <FadeInWhenVisible>
            <div className="space-y-2">
              <h2 className="text-4xl italic">Akad &amp; Resepsi</h2>
              <div className="h-px w-16 bg-[#C4A484] mx-auto" />
            </div>
          </FadeInWhenVisible>

          <div className="grid md:grid-cols-2 gap-8 w-full">
            <motion.div whileHover={{ y: -10 }} className="bg-white p-10 rounded-3xl shadow-xl space-y-6 transition-all">
              <IconCalendar className="w-10 h-10 mx-auto text-[#C4A484]" />
              <div className="space-y-1">
                <p className="font-sans font-bold uppercase tracking-widest text-[#C4A484]">Hari &amp; Tanggal</p>
                <p className="text-xl font-bold">{format(eventDate, "EEEE, d MMMM yyyy", { locale: idLocale })}</p>
              </div>
            </motion.div>
            <motion.div whileHover={{ y: -10 }} className="bg-white p-10 rounded-3xl shadow-xl space-y-6 transition-all">
              <IconClock className="w-10 h-10 mx-auto text-[#C4A484]" />
              <div className="space-y-1">
                <p className="font-sans font-bold uppercase tracking-widest text-[#C4A484]">Waktu Acara</p>
                <p className="text-xl font-bold">{data.event.time} WIB - Selesai</p>
              </div>
            </motion.div>
          </div>

          <FadeInWhenVisible delay={0.2}>
            <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-2xl space-y-6">
              <IconMapPin className="w-10 h-10 mx-auto text-[#C4A484]" />
              <div className="space-y-4">
                <div>
                  <p className="font-sans font-bold uppercase tracking-widest text-[#C4A484]">Lokasi Acara</p>
                  <p className="text-xl font-bold">{data.event.venue}</p>
                </div>
                <p className="text-gray-500 leading-relaxed">{data.event.address}</p>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={data.event.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#4A403A] text-white px-8 py-3 rounded-full font-sans font-bold hover:bg-[#C4A484] transition-colors"
                >
                  Buka Google Maps
                </motion.a>
              </div>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* Gallery Section */}
      {data.gallery && data.gallery.length > 0 && (
        <section className="py-24 px-6 bg-white overflow-hidden">
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
      <section className="py-24 px-6 bg-[#FDF8F5] text-center premium-section">
        <div className="max-w-xl mx-auto space-y-10">
          <div className="space-y-2">
            <IconGift className="w-8 h-8 mx-auto text-[#C4A484] fill-current" />
            <h2 className="text-4xl italic">Kado Pernikahan</h2>
            <div className="h-px w-16 bg-[#C4A484] mx-auto" />
            <p className="text-gray-500 font-sans mt-4">Doa restu Anda adalah karunia yang sangat berarti. Namun jika ingin berbagi kasih, Anda bisa melalui:</p>
          </div>

          <div className="space-y-4">
            {data.gifts?.enabled &&
              data.gifts.bankAccounts?.map((bank, i) => (
                <motion.div key={i} whileHover={{ scale: 1.02 }} className="bg-white p-8 rounded-3xl shadow-lg space-y-4">
                  <p className="font-bold text-[#C4A484]">{bank.bankName}</p>
                  <p className="text-2xl font-black">{bank.accountNumber}</p>
                  <p className="text-sm font-sans text-gray-400">a.n {bank.accountHolder}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bank.accountNumber);
                    }}
                    className="text-xs font-sans font-bold underline hover:text-[#C4A484]"
                  >
                    Salin Nomor Rekening
                  </button>
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 text-center bg-[#4A403A] text-white">
        <div className="space-y-4">
          <FadeInWhenVisible>
            <p className="italic text-xl">Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh</p>
            <h3 className="text-4xl font-light mt-4">
              {data.groom.nickname} &amp; {data.bride.nickname}
            </h3>
          </FadeInWhenVisible>
          <div className="pt-16 text-[10px] tracking-[0.3em] uppercase opacity-50">Official Invitation by Nika.id</div>
        </div>
      </footer>
    </div>
  );
}
