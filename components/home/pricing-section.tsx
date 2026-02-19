"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-muted relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[35%] h-[35%] bg-primary/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-accent/20 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium mb-6 inline-flex items-center gap-2">
              <IconRosette size={16} />
              <span>Harga Transparan, Tanpa Biaya Tersembunyi</span>
            </Badge>
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
            Investasi Terbaik untuk <span className="text-primary">Hari Bahagia</span> Anda
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-muted-foreground text-lg leading-relaxed">
            Mulai gratis, upgrade kapan saja. Pilih paket yang paling sesuai dengan kebutuhan pernikahan Anda.
          </motion.p>
        </div>

        {/* Comparison note */}
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="text-center text-sm text-muted-foreground mb-16">
          <IconSparkles size={14} className="inline mr-1 -mt-0.5" />
          Hemat hingga 90% dibanding undangan cetak tradisional
        </motion.p>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          {plans.map((plan, index) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.15, duration: 0.5 }} className="relative flex flex-col">
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-primary text-primary-foreground shadow-lg shadow-primary/20 px-5 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 whitespace-nowrap">
                  <IconSparkles size={14} />
                  PALING POPULER
                </div>
              )}

              {/* Card Container */}
              <Card className={`flex-1 flex flex-col rounded-xl p-8 transition-all duration-300 group ${plan.popular ? "border-primary/50 shadow-xl shadow-primary/10 ring-1 ring-primary/20" : "hover:shadow-xl"}`}>
                <CardContent className="p-0 flex flex-col flex-1">
                  {/* Tier icon & name */}
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6 ${plan.popular ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}
                    >
                      <plan.icon size={24} />
                    </div>
                    <h3 className="text-xl font-black text-foreground">{plan.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-semibold text-muted-foreground">Rp</span>
                      {plan.originalPrice && <span className="text-lg text-muted-foreground/50 line-through font-semibold mr-1">{plan.originalPrice}</span>}
                      <span className={`text-4xl font-black ${plan.popular ? "text-primary" : "text-foreground"}`}>{plan.price}</span>
                      <span className="text-sm text-muted-foreground ml-0.5">{plan.period}</span>
                    </div>
                    {plan.popular && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 text-green-600 text-xs font-bold">
                        <span>HEMAT Rp 100rb</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed mb-8">{plan.description}</p>

                  {/* Features List */}
                  <div className="space-y-3.5 mb-10">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {feature.included ? (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? "bg-primary/10 text-primary" : "bg-accent/50 text-accent-foreground"}`}>
                            <IconCheck size={13} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground/40 shrink-0">
                            <IconX size={13} strokeWidth={3} />
                          </div>
                        )}
                        <span className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground line-through"}`}>{feature.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    asChild
                    className={`w-full h-14 rounded-xl text-base font-bold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl mt-auto ${
                      plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20" : "shadow-muted"
                    }`}
                    variant={plan.popular ? "default" : "default"}
                  >
                    <Link href="/register">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="flex flex-wrap items-center justify-center gap-6 mt-16 text-sm text-muted-foreground">
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
