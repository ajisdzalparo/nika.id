/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { IconHeart, IconMapPin, IconCalendar, IconClock, IconGift, IconPhoto, IconPlayerPlay, IconChevronDown, IconHeartFilled, IconBook } from "@tabler/icons-react";
import { MusicToggle } from "@/components/common/music-toggle";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WeddingData } from "@/types/wedding";
import { toast } from "sonner";
import { RSVPSection } from "@/components/templates/estetik/rsvp-section";
import { VideoSection } from "@/components/common/video-section";

gsap.registerPlugin(ScrollTrigger);

// ═══════════════════════════════════════════════════════════
// ESTETIK — Soft pastel aesthetic with delicate typography
// ═══════════════════════════════════════════════════════════
export default function Estetik({ data }: { data: WeddingData }) {
  const [isOpen, setIsOpen] = useState(false);
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

  // GSAP Scroll Animations
  useEffect(() => {
    if (isOpen) {
      gsap.utils.toArray(".estetik-reveal").forEach((el: any) => {
        gsap.from(el, {
          opacity: 0,
          y: 40,
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

  const groomName = data.groom?.nickname || data.groom?.fullName?.split(" ")[0] || "";
  const brideName = data.bride?.nickname || data.bride?.fullName?.split(" ")[0] || "";

  return (
    <div className="min-h-screen bg-[#FDF8F5] font-serif text-[#4A403A] overflow-x-hidden">
      {/* ═══ COVER PAGE ═══ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div exit={{ opacity: 0, y: "-100%", transition: { duration: 1, ease: [0.76, 0, 0.24, 1] } }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDF8F5]">
            <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
            <div className="absolute inset-0 bg-radial-to-br from-white via-[#FDF8F5] to-[#F0E6DD] opacity-60" />

            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.2 }} className="z-10 text-center space-y-10 p-8">
              <div className="space-y-6">
                <IconHeart className="w-10 h-10 mx-auto text-[#C4A484] opacity-40 animate-pulse" />
                <p className="text-[10px] uppercase tracking-[0.6em] text-[#C4A484] font-sans">The Wedding Celebration Of</p>
                <h1 className="text-4xl md:text-7xl font-light italic">
                  {groomName} <span className="text-[#C4A484] font-sans text-2xl md:text-3xl">&</span> {brideName}
                </h1>
              </div>

              <div className="space-y-3">
                <p className="text-sm italic opacity-60">Kepada Yth. Bapak/Ibu/Saudara/i</p>
                <div className="h-px w-20 bg-[#C4A484]/30 mx-auto" />
                <h2 className="text-2xl font-bold text-[#C4A484] uppercase tracking-wider">{data.guestName || "Tamu Undangan"}</h2>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="group flex items-center gap-3 mx-auto border-2 border-[#C4A484] px-10 py-4 rounded-full font-sans font-bold text-xs tracking-[0.2em] text-[#C4A484] hover:bg-[#C4A484] hover:text-white transition-all"
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
          <div className="absolute inset-0 opacity-15">
            <Image src={data.gallery?.[0] || data.bride?.photo || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069"} fill className="object-cover" alt="Hero" />
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#2c2420]/50 to-[#2c2420]" />
          </div>

          <div className="z-10 space-y-4 md:space-y-8">
            <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-[#C4A484] font-sans estetik-reveal">The Wedding Celebration Of</p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-8 estetik-reveal">
              <h1 className="text-5xl md:text-8xl font-light italic">{groomName}</h1>
              <span className="text-2xl md:text-4xl text-[#C4A484] font-sans">&</span>
              <h1 className="text-5xl md:text-8xl font-light italic">{brideName}</h1>
            </div>
            <div className="h-px w-24 bg-[#C4A484] mx-auto estetik-reveal" />
            <p className="text-xl tracking-widest font-sans estetik-reveal">{format(eventDate, "dd . MM . yyyy")}</p>
          </div>

          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-10 text-[#C4A484] opacity-40">
            <IconChevronDown className="w-8 h-8" />
          </motion.div>
        </section>

        {/* Countdown Section */}
        <section className="py-20 px-6 bg-[#4A403A] text-white text-center estetik-reveal">
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

        {/* Quote / Intro Section */}
        <section className="py-24 px-6 text-center max-w-2xl mx-auto space-y-6 estetik-reveal">
          <IconHeart className="w-8 h-8 mx-auto text-[#C4A484] fill-current opacity-50" />
          <p className="text-lg leading-relaxed italic">
            &ldquo;{data.quote?.text || "Maka timbulah kasih sayang di antara mereka. Sungguh pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir."}&rdquo;
          </p>
          <p className="text-sm font-sans font-bold uppercase tracking-wider text-[#C4A484]">{data.quote?.source || "Ar-Rum: 21"}</p>
        </section>

        {/* Couple Detail Section */}
        <section className="py-24 px-6 bg-white overflow-hidden">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20">
            {/* Groom */}
            <div className="text-center space-y-6 estetik-reveal">
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
            </div>

            {/* Bride */}
            <div className="text-center space-y-6 estetik-reveal">
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
            </div>
          </div>
        </section>

        {/* Event Info — Multiple Events */}
        <section className="py-24 px-6 bg-[#F9F3EE] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C4A484]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C4A484]/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="max-w-4xl mx-auto flex flex-col items-center gap-12 text-center relative">
            <div className="space-y-2 estetik-reveal">
              <h2 className="text-4xl italic">Waktu & Tempat</h2>
              <div className="h-px w-16 bg-[#C4A484] mx-auto" />
            </div>

            <div className="grid md:grid-cols-2 gap-8 w-full">
              {eventsToRender.map((evt: any, idx: number) => (
                <div key={idx} className="bg-white p-10 rounded-3xl shadow-xl space-y-6 hover:translate-y-[-5px] transition-transform estetik-reveal">
                  <h3 className="text-2xl italic text-[#C4A484]">{evt.title}</h3>
                  <div className="h-px w-8 bg-[#C4A484]/30 mx-auto" />
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <IconCalendar className="w-8 h-8 mx-auto text-[#C4A484]" />
                      <p className="font-sans font-bold uppercase tracking-widest text-[#C4A484] text-xs">Hari & Tanggal</p>
                      <p className="text-xl font-bold">{evt.date ? format(new Date(evt.date), "EEEE, d MMMM yyyy", { locale: idLocale }) : "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <IconClock className="w-8 h-8 mx-auto text-[#C4A484]" />
                      <p className="font-sans font-bold uppercase tracking-widest text-[#C4A484] text-xs">Waktu</p>
                      <p className="text-xl font-bold">{evt.time || "-"} WIB</p>
                    </div>
                    <div className="space-y-1">
                      <IconMapPin className="w-8 h-8 mx-auto text-[#C4A484]" />
                      <p className="font-sans font-bold uppercase tracking-widest text-[#C4A484] text-xs">Lokasi</p>
                      <p className="text-xl font-bold">{evt.venue || "-"}</p>
                      <p className="text-gray-500 leading-relaxed text-sm">{evt.address || "-"}</p>
                    </div>
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={evt.maps || evt.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-[#4A403A] text-white px-8 py-3 rounded-full font-sans font-bold text-xs tracking-widest hover:bg-[#C4A484] transition-colors"
                    >
                      Buka Google Maps
                    </motion.a>
                  </div>
                </div>
              ))}
            </div>

            {/* Streaming */}
            {data.streaming?.enabled && (
              <div className="bg-[#4A403A] text-white p-10 rounded-3xl shadow-xl space-y-4 max-w-2xl w-full estetik-reveal">
                <h4 className="text-xl font-light italic text-[#C4A484]">Saksikan melalui {data.streaming.platform}</h4>
                <p className="text-sm opacity-60">Bagi kerabat yang berhalangan hadir secara fisik.</p>
                <motion.a whileHover={{ scale: 1.05 }} href={data.streaming.url} target="_blank" className="inline-block border border-[#C4A484] text-[#C4A484] px-10 py-3 rounded-full text-xs font-bold uppercase tracking-widest">
                  Gabung Streaming
                </motion.a>
              </div>
            )}
          </div>
        </section>

        {/* Love Story Section */}
        {data.loveStory?.enabled && data.loveStory.chapters?.length > 0 && (
          <section className="py-24 px-6 bg-white">
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="text-center space-y-2 estetik-reveal">
                <IconBook className="w-8 h-8 mx-auto text-[#C4A484] opacity-50" />
                <h2 className="text-4xl italic">Kisah Cinta Kami</h2>
                <div className="h-px w-16 bg-[#C4A484] mx-auto" />
              </div>

              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#C4A484]/20 -translate-x-1/2" />

                {data.loveStory.chapters.map((chapter, i) => (
                  <div key={i} className={`relative flex items-center gap-8 mb-12 estetik-reveal ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                    <div className="flex-1 text-center md:text-right">
                      {i % 2 === 0 && (
                        <div className="bg-[#FDF8F5] p-8 rounded-3xl shadow-lg">
                          <h3 className="text-xl italic text-[#C4A484] mb-3">{chapter.title}</h3>
                          <p className="text-sm leading-relaxed opacity-80">{chapter.content}</p>
                        </div>
                      )}
                    </div>
                    <div className="relative z-10 w-10 h-10 bg-white rounded-full border-2 border-[#C4A484] flex items-center justify-center shrink-0 shadow-lg">
                      <IconHeartFilled className="w-4 h-4 text-[#C4A484]" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      {i % 2 !== 0 && (
                        <div className="bg-[#FDF8F5] p-8 rounded-3xl shadow-lg">
                          <h3 className="text-xl italic text-[#C4A484] mb-3">{chapter.title}</h3>
                          <p className="text-sm leading-relaxed opacity-80">{chapter.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Video Section */}
        <VideoSection data={data} />

        {/* Video Section */}

        {/* Gallery Section */}
        {data.gallery && data.gallery.length > 0 && (
          <section className="py-24 px-6 bg-[#FDF8F5]">
            <div className="max-w-6xl mx-auto space-y-12">
              <div className="text-center space-y-2 estetik-reveal">
                <IconPhoto className="w-8 h-8 mx-auto text-[#C4A484]" />
                <h2 className="text-4xl italic">Momen Bahagia</h2>
                <div className="h-px w-16 bg-[#C4A484] mx-auto" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {data.gallery.map((photo, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className={`relative overflow-hidden rounded-2xl shadow-lg hover:opacity-90 transition-opacity ${i % 5 === 0 ? "md:col-span-2 md:row-span-2 aspect-square" : "aspect-square"}`}
                  >
                    <Image src={photo} alt={`Gallery ${i}`} fill className="object-cover transition-transform duration-700 hover:scale-110" />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Gift / Digital Envelope */}
        {data.gifts?.enabled && (
          <section className="py-24 px-6 bg-white text-center estetik-reveal">
            <div className="max-w-xl mx-auto space-y-10">
              <div className="space-y-2">
                <IconGift className="w-8 h-8 mx-auto text-[#C4A484] fill-current" />
                <h2 className="text-4xl italic">Kado Pernikahan</h2>
                <div className="h-px w-16 bg-[#C4A484] mx-auto" />
                <p className="text-gray-500 font-sans mt-4">Doa restu Anda adalah karunia yang sangat berarti. Namun jika ingin berbagi kasih, Anda bisa melalui:</p>
              </div>

              <div className="space-y-4">
                {data.gifts.bankAccounts?.map((bank, i) => (
                  <motion.div key={i} whileHover={{ y: -5 }} className="bg-[#FDF8F5] p-8 rounded-3xl shadow-lg space-y-4">
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

        {/* RSVP Section */}
        <RSVPSection />

        {/* Extended Family */}
        {data.extendedFamily?.members && data.extendedFamily.members.length > 0 && (
          <section className="py-24 px-6 bg-[#FDF8F5] estetik-reveal">
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
        {data.music?.enabled && data.music.url && isOpen && <MusicToggle url={data.music.url} type={data.music.type} autoPlay={true} />}

        {/* Footer */}
        <footer className="py-16 px-6 text-center bg-[#4A403A] text-white">
          <div className="space-y-4 estetik-reveal">
            <p className="italic text-xl">Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh</p>
            <h3 className="text-3xl font-light italic text-[#C4A484]">
              {groomName} & {brideName}
            </h3>
            <div className="pt-12 text-[10px] tracking-[0.3em] uppercase opacity-50">Official Invitation by Nika.id</div>
          </div>
        </footer>
      </main>
    </div>
  );
}
