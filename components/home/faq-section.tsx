"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconChevronDown } from "@tabler/icons-react";

const faqs = [
  {
    question: "Apakah saya bisa mencoba secara gratis?",
    answer: "Tentu saja! Anda bisa mendaftar dan mencoba membuat undangan dengan template gratis kami tanpa biaya apapun.",
  },
  {
    question: "Berapa lama masa aktif undangan digital saya?",
    answer: "Masa aktif undangan tergantung pada paket yang Anda pilih, mulai dari 3 bulan hingga selamanya (unlimited).",
  },
  {
    question: "Apakah bisa menambahkan lagu sendiri?",
    answer: "Ya, Anda bisa mengunggah musik favorit Anda sendiri atau memilih dari koleksi playlist eksklusif yang kami sediakan.",
  },
  {
    question: "Bisa edit setelah undangan disebarkan?",
    answer: "Bisa sekali! Anda dapat melakukan perubahan kapan saja melalui dashboard, dan perubahan akan langsung terupdate di link undangan Anda.",
  },
  {
    question: "Bagaimana cara membagikan undangan?",
    answer: "Anda akan mendapatkan link unik (contoh: nika.id/nama-anda) yang bisa langsung di-copy dan dibagikan melalui WhatsApp, Telegram, atau Media Sosial lainnya.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Pertanyaan Umum</h2>
            <p className="text-slate-600 text-lg">Punya pertanyaan lain? Kami siap membantu mewujudkan momen spesial Anda.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="overflow-hidden border border-slate-100 rounded-3xl transition-all duration-300">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className={`w-full flex items-center justify-between p-6 text-left transition-colors ${openIndex === index ? "bg-slate-50" : "bg-white hover:bg-slate-50/50"}`}
                >
                  <span className="text-lg font-bold text-slate-900">{faq.question}</span>
                  <motion.div animate={{ rotate: openIndex === index ? 180 : 0 }} transition={{ duration: 0.3 }} className={`text-slate-400 ${openIndex === index ? "text-pink-500" : ""}`}>
                    <IconChevronDown size={24} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
                      <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-50 bg-slate-50">{faq.answer}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
