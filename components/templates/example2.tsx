"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { IconHeartFilled, IconCalendar, IconMapPin, IconGift, IconChevronDown } from "@tabler/icons-react";
import { MusicToggle } from "@/components/common/music-toggle";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { WeddingData } from "@/types/wedding";

/* =======================
   ANIMATION
======================= */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 1 } },
};

export default function LuxuryModernInvitation({ data }: { data: WeddingData }) {
  const [open, setOpen] = useState(false);

  /* =======================
     NORMALIZE EVENT DATA
  ======================= */
  const events =
    data.events && data.events.length > 0
      ? data.events
      : data.event
        ? [
            {
              title: "Acara Pernikahan",
              date: data.event.date,
              time: data.event.time,
              venue: data.event.venue,
              address: data.event.address,
              mapUrl: data.event.mapUrl,
            },
          ]
        : [];

  const mainDate = events[0]?.date ? new Date(events[0].date) : new Date();

  const groomName = data.groom?.nickname || data.groom?.fullName?.split(" ")[0] || "";
  const brideName = data.bride?.nickname || data.bride?.fullName?.split(" ")[0] || "";

  return (
    <div className="bg-neutral-950 text-neutral-100 font-serif overflow-x-hidden">
      {/* =======================
          COVER
      ======================= */}
      <AnimatePresence>
        {!open && (
          <motion.div exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950">
            <div className="absolute inset-0 opacity-40">
              <Image src={data.gallery?.[0] || data.bride?.photo || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc"} alt="cover" fill className="object-cover" />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center space-y-10 px-6">
              <IconHeartFilled className="mx-auto text-rose-400 w-12 h-12 animate-pulse" />

              <div>
                <p className="uppercase tracking-[0.4em] text-xs opacity-60">The Wedding Of</p>
                <h1 className="text-5xl italic mt-4">
                  {groomName} & {brideName}
                </h1>
              </div>

              <div className="text-sm opacity-70">
                Kepada Yth <br />
                <span className="font-bold tracking-wide">{data.guestName || "Tamu Undangan"}</span>
              </div>

              <button onClick={() => setOpen(true)} className="px-10 py-4 rounded-full bg-rose-500 text-white text-xs tracking-widest font-bold hover:bg-rose-600 transition">
                OPEN INVITATION
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =======================
          MAIN
      ======================= */}
      <main className="max-w-md mx-auto bg-neutral-900 relative">
        {/* HERO */}
        <section className="relative h-[85vh] flex items-center justify-center text-center">
          <div className="absolute inset-0">
            <Image src={data.gallery?.[0] || data.bride?.photo || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc"} alt="hero" fill className="object-cover opacity-40" />
          </div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" className="relative z-10 space-y-6 px-6">
            <p className="uppercase tracking-widest text-xs opacity-60">Save The Date</p>
            <h1 className="text-6xl italic">
              {groomName} & {brideName}
            </h1>
            <p className="tracking-widest text-sm opacity-80">{format(mainDate, "EEEE, dd MMMM yyyy", { locale: id })}</p>
          </motion.div>

          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-10 opacity-40">
            <IconChevronDown />
          </motion.div>
        </section>

        {/* COUPLE */}
        <section className="py-24 px-8 space-y-24">
          {[data.groom, data.bride].map((p: any, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center space-y-6">
              <div className="relative w-60 h-60 mx-auto rounded-full overflow-hidden border-8 border-neutral-800">
                <Image src={p?.photo || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"} alt={p?.fullName} fill className="object-cover" />
              </div>

              <h2 className="text-3xl italic">{p?.fullName}</h2>
              <p className="text-sm opacity-60">
                Putra / Putri dari <br />
                Bpk. {p?.fatherName} & Ibu {p?.motherName}
              </p>
            </motion.div>
          ))}
        </section>

        {/* EVENTS */}
        <section className="py-24 px-8 bg-neutral-800 text-center space-y-14">
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" className="text-4xl italic">
            Waktu & Lokasi
          </motion.h2>

          {events.map((evt: any, i) => (
            <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="show" className="bg-neutral-900 p-10 rounded-3xl space-y-6">
              <IconCalendar className="mx-auto text-rose-400" />
              <h3 className="text-2xl italic">{evt.title}</h3>

              <p className="font-bold">
                {evt.date
                  ? format(new Date(evt.date), "EEEE, dd MMMM yyyy", {
                      locale: id,
                    })
                  : "-"}
              </p>
              <p className="italic opacity-60">{evt.time || ""}</p>

              <IconMapPin className="mx-auto text-rose-400" />
              <p className="font-bold">{evt.venue}</p>
              <p className="text-sm opacity-60">{evt.address}</p>

              {evt.mapUrl && (
                <a href={evt.mapUrl} target="_blank" className="inline-block mt-4 px-8 py-3 rounded-full bg-rose-500 text-xs tracking-widest font-bold">
                  OPEN MAP
                </a>
              )}
            </motion.div>
          ))}
        </section>

        {/* GALLERY */}
        {data.gallery && data.gallery.length > 0 && (
          <section className="py-24 px-6 space-y-10">
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" className="text-center text-4xl italic">
              Our Moments
            </motion.h2>

            <div className="grid grid-cols-2 gap-4">
              {data.gallery.slice(0, 6).map((img, i) => (
                <motion.div key={i} whileHover={{ scale: 1.05 }} className={`relative rounded-2xl overflow-hidden ${i === 0 ? "col-span-2 aspect-video" : "aspect-square"}`}>
                  <Image src={img} alt="gallery" fill className="object-cover" />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* GIFT */}
        {data.gifts?.enabled && (
          <section className="py-24 px-8 bg-neutral-800 text-center space-y-6">
            <IconGift className="mx-auto text-rose-400 w-10 h-10" />
            <h2 className="text-3xl italic">Wedding Gift</h2>

            {data.gifts.bankAccounts?.map((bank, i) => (
              <div key={i} className="bg-neutral-900 p-6 rounded-2xl space-y-2">
                <p className="text-xs tracking-widest opacity-60">{bank.bankName}</p>
                <p className="text-xl font-bold">{bank.accountNumber}</p>
                <p className="text-sm opacity-60">a.n {bank.accountHolder}</p>
              </div>
            ))}
          </section>
        )}

        {/* FOOTER */}
        <footer className="py-24 text-center text-sm opacity-40">Made with ❤️ — Premium Wedding Invitation</footer>
      </main>

      {/* MUSIC BUTTON */}
      {open && data.music?.enabled && data.music.url && <MusicToggle url={data.music.url} type={data.music.type} autoPlay={true} />}
    </div>
  );
}
