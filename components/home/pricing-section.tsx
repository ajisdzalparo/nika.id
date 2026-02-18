"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { IconCheck, IconX, IconCrown, IconMedal, IconSparkles, IconRosette } from "@tabler/icons-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    icon: IconSparkles,
    price: "0",
    originalPrice: null,
    period: "",
    description: "Coba buat undangan pertama Anda secara gratis. Cocok untuk melihat-lihat.",
    features: [
      { text: "1 Template Dasar", included: true },
      { text: "Link Aktif 7 Hari", included: true },
      { text: "Share Maks. 25 Tamu", included: true },
      { text: "Countdown Timer", included: true },
      { text: "Ada Watermark nika.id", included: true },
      { text: "RSVP & Buku Tamu", included: false },
      { text: "Galeri Foto", included: false },
      { text: "Musik Latar", included: false },
      { text: "Hapus Watermark", included: false },
    ],
    cta: "Mulai Gratis",
    popular: false,
    gradient: "from-slate-400 to-slate-500",
    accentColor: "slate",
    iconBg: "bg-slate-50",
    iconColor: "text-slate-400",
    borderHover: "hover:border-slate-200",
    badgeBg: "",
  },
  {
    name: "Silver",
    icon: IconMedal,
    price: "99rb",
    originalPrice: null,
    period: "/event",
    description: "Paket hemat untuk pasangan yang ingin undangan digital cantik dan fungsional.",
    features: [
      { text: "5 Template Pilihan", included: true },
      { text: "Link Aktif 3 Bulan", included: true },
      { text: "Share Maks. 100 Tamu", included: true },
      { text: "RSVP & Buku Tamu Dasar", included: true },
      { text: "Galeri Foto (max 10)", included: true },
      { text: "Countdown Timer", included: true },
      { text: "Musik Latar", included: true },
      { text: "Hapus Watermark", included: false },
      { text: "Video Prewedding", included: false },
    ],
    cta: "Pilih Silver",
    popular: false,
    gradient: "from-slate-500 to-slate-600",
    accentColor: "slate",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    borderHover: "hover:border-slate-300",
    badgeBg: "",
  },
  {
    name: "Gold",
    icon: IconCrown,
    price: "199rb",
    originalPrice: "299rb",
    period: "/event",
    description: "Fitur terlengkap & favorit pasangan Indonesia untuk momen tak terlupakan.",
    features: [
      { text: "Semua Template Premium", included: true },
      { text: "Link Aktif Selamanya", included: true },
      { text: "Share Unlimited Tamu", included: true },
      { text: "RSVP & Buku Tamu Lengkap", included: true },
      { text: "Galeri Foto Unlimited", included: true },
      { text: "Video Prewedding Embed", included: true },
      { text: "Love Story Timeline", included: true },
      { text: "Hapus Watermark", included: true },
      { text: "Kirim via WhatsApp", included: true },
      { text: "Amplop Digital / Gift", included: true },
    ],
    cta: "Pilih Gold",
    popular: true,
    gradient: "from-amber-500 to-orange-500",
    accentColor: "amber",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    borderHover: "hover:border-amber-300",
    badgeBg: "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200",
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[35%] h-[35%] bg-pink-100/40 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-purple-100/40 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 border border-pink-100 text-pink-600 text-sm font-medium mb-6"
          >
            <IconRosette size={16} />
            <span>Harga Transparan, Tanpa Biaya Tersembunyi</span>
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-3xl md:text-5xl font-bold mb-6">
            Investasi Terbaik untuk <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Hari Bahagia</span> Anda
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-slate-600 text-lg leading-relaxed">
            Mulai gratis, upgrade kapan saja. Pilih paket yang paling sesuai dengan kebutuhan pernikahan Anda.
          </motion.p>
        </div>

        {/* Comparison note */}
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="text-center text-sm text-slate-400 mb-16">
          <IconSparkles size={14} className="inline mr-1 -mt-0.5" />
          Hemat hingga 90% dibanding undangan cetak tradisional
        </motion.p>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          {plans.map((plan, index) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.15, duration: 0.5 }} className="relative flex flex-col">
              {/* Popular Badge */}
              {plan.popular && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 ${plan.badgeBg} px-5 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 whitespace-nowrap`}>
                  <IconSparkles size={14} />
                  PALING POPULER
                </div>
              )}

              {/* Card Container */}
              <div
                className={`flex-1 flex flex-col bg-white rounded-[2rem] p-8 shadow-sm border transition-all duration-300 group ${plan.borderHover} ${
                  plan.popular ? "border-amber-200 shadow-xl shadow-amber-100/50 ring-2 ring-amber-100" : "border-slate-100 hover:shadow-xl hover:shadow-slate-100"
                }`}
              >
                {/* Tier icon & name */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 ${plan.iconBg} rounded-2xl flex items-center justify-center ${plan.iconColor} transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                    <plan.icon size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold text-slate-400">Rp</span>
                    {plan.originalPrice && <span className="text-lg text-slate-300 line-through font-semibold mr-1">{plan.originalPrice}</span>}
                    <span className={`text-4xl font-black ${plan.popular ? "text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500" : "text-slate-900"}`}>{plan.price}</span>
                    <span className="text-sm text-slate-400 ml-0.5">{plan.period}</span>
                  </div>
                  {plan.popular && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-600 text-xs font-bold">
                      <span>HEMAT Rp 100rb</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-slate-500 text-sm leading-relaxed mb-8">{plan.description}</p>

                {/* Features List */}
                <div className="space-y-3.5 mb-10">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {feature.included ? (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? "bg-amber-50 text-amber-500" : "bg-green-50 text-green-500"}`}>
                          <IconCheck size={13} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 flex-shrink-0">
                          <IconX size={13} strokeWidth={3} />
                        </div>
                      )}
                      <span className={`text-sm ${feature.included ? "text-slate-700" : "text-slate-400 line-through"}`}>{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  asChild
                  className={`w-full h-14 rounded-2xl text-base font-bold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                    plan.popular
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-200 text-white"
                      : plan.name === "Diamond"
                        ? "bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-purple-100 text-white"
                        : "bg-slate-900 hover:bg-slate-800 shadow-slate-200 text-white"
                  }`}
                >
                  <Link href="/register">{plan.cta}</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="flex flex-wrap items-center justify-center gap-6 mt-16 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <IconCheck size={16} className="text-green-500" />
            <span>Pembayaran Aman</span>
          </div>
          <div className="flex items-center gap-2">
            <IconCheck size={16} className="text-green-500" />
            <span>Garansi Uang Kembali 7 Hari</span>
          </div>
          <div className="flex items-center gap-2">
            <IconCheck size={16} className="text-green-500" />
            <span>Support via WhatsApp</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
