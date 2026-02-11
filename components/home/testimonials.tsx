"use client";

import { motion } from "framer-motion";
import { IconStarFilled, IconQuote } from "@tabler/icons-react";
import Image from "next/image";

const reviews = [
  {
    name: "Aditya & Sarah",
    text: "Puaass banget sama nika.id! Editornya gampang banget dipake, template-nya cantik-cantik dan keliatan premium. Tamu banyak yang muji undangannya.",
    role: "Pengantin",
    avatar: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=200&auto=format&fit=crop",
  },
  {
    name: "Budi & Maya",
    text: "Fitur RSVP-nya ngebantu banget buat mantau kehadiran tamu. Harganya juga sangat terjangkau dibanding cetak undangan fisik. Recomended!",
    role: "Pengantin",
    avatar: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=200&auto=format&fit=crop",
  },
  {
    name: "Reza & Indah",
    text: "Awalnya bingung mau pake yang mana, tapi support team nika.id responsif banget. Hasilnya memuaskan dan prosesnya cepet banget.",
    role: "Pengantin",
    avatar: "https://images.unsplash.com/photo-1522673607200-164883eecd0c?q=80&w=200&auto=format&fit=crop",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-slate-50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Apa Kata Mereka?</h2>
          <p className="text-slate-600 text-lg">Bergabunglah dengan ribuan pasangan yang telah menciptakan momen spesial tak terlupakan bersama kami.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-sm relative group hover:shadow-xl transition-shadow duration-500"
            >
              <div className="absolute top-8 right-8 text-pink-100 group-hover:text-pink-200 transition-colors">
                <IconQuote size={48} fill="currentColor" />
              </div>

              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <IconStarFilled key={i} className="text-yellow-400" size={18} />
                ))}
              </div>

              <p className="text-slate-600 italic mb-8 relative z-10 leading-relaxed">"{review.text}"</p>

              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-pink-50">
                  <Image src={review.avatar} alt={review.name} fill className="object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{review.name}</h4>
                  <p className="text-sm text-slate-500">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
