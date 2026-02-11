"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { IconCheck, IconX } from "@tabler/icons-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Sempurna untuk mencoba dan membuat undangan sederhana.",
    features: [
      { text: "Template Pilihan", included: true },
      { text: "RSVP Dasar", included: true },
      { text: "Masa Aktif 7 Hari", included: true },
      { text: "Hapus Watermark", included: false },
      { text: "Custom Domain", included: false },
      { text: "Kirim WhatsApp", included: false },
    ],
    cta: "Mulai Gratis",
    popular: false,
    color: "slate",
  },
  {
    name: "Pro",
    price: "149rb",
    description: "Fitur lengkap untuk pernikahan yang lebih berkesan.",
    features: [
      { text: "Semua Template", included: true },
      { text: "RSVP & Buku Tamu", included: true },
      { text: "Masa Aktif 1 Tahun", included: true },
      { text: "Hapus Watermark", included: true },
      { text: "Kirim WhatsApp", included: true },
      { text: "Custom Domain", included: false },
    ],
    cta: "Pilih Paket Pro",
    popular: true,
    color: "pink",
  },
  {
    name: "Premium",
    price: "249rb",
    description: "Layanan eksklusif untuk momen sekali seumur hidup.",
    features: [
      { text: "Semua Template", included: true },
      { text: "RSVP & Buku Tamu", included: true },
      { text: "Masa Aktif Selamanya", included: true },
      { text: "Hapus Watermark", included: true },
      { text: "Custom Domain", included: true },
      { text: "Prioritas Support", included: true },
    ],
    cta: "Pilih Paket Premium",
    popular: false,
    color: "purple",
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Pilih Paket Kebahagiaan Anda</h2>
          <p className="text-slate-600 text-lg">Harga transparan tanpa biaya tersembunyi. Pilih paket yang paling sesuai dengan kebutuhan pernikahan Anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-[2.5rem] p-8 shadow-sm border ${plan.popular ? "border-pink-200 shadow-xl shadow-pink-50 ring-2 ring-pink-100" : "border-slate-100"}`}
            >
              {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">PALING POPULER</div>}

              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-sm font-semibold text-slate-500">Rp</span>
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  {plan.price !== "0" && <span className="text-sm text-slate-500">/paket</span>}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-10">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                        <IconCheck size={14} strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                        <IconX size={14} strokeWidth={3} />
                      </div>
                    )}
                    <span className={`text-sm ${feature.included ? "text-slate-700" : "text-slate-400 line-through"}`}>{feature.text}</span>
                  </div>
                ))}
              </div>

              <Button
                asChild
                className={`w-full h-14 rounded-2xl text-lg font-bold shadow-lg transition-transform hover:scale-[1.02] ${plan.popular ? "bg-pink-500 hover:bg-pink-600 shadow-pink-100" : "bg-slate-900 hover:bg-slate-800 shadow-slate-100"}`}
              >
                <Link href="/register">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
