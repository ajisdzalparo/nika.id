"use client";

import { motion } from "framer-motion";
import { IconUserPlus, IconEdit, IconShare, IconArrowRight } from "@tabler/icons-react";

const steps = [
  {
    title: "Buat Akun",
    description: "Daftar gratis dan pilih paket yang sesuai dengan kebutuhan pernikahan Anda.",
    icon: IconUserPlus,
  },
  {
    title: "Pilih & Edit",
    description: "Gunakan editor kami yang mudah untuk menyesuaikan teks, foto, dan musik.",
    icon: IconEdit,
  },
  {
    title: "Sebarkan Undangan",
    description: "Bagikan link undangan Anda ke teman dan keluarga via WhatsApp atau media sosial.",
    icon: IconShare,
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Connector Line (Desktop) */}
      <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-full max-w-4xl h-0.5 bg-border hidden lg:block z-0" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">Cara Membuat Undangan</h2>
          <p className="text-muted-foreground text-lg">Hanya butuh 3 langkah mudah untuk mewujudkan undangan pernikahan impian Anda bersama nika.id.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
          {steps.map((step, index) => (
            <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.2 }} className="flex flex-col items-center text-center group">
              <div className="relative mb-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-primary/20 bg-primary`}>
                  <step.icon size={32} />
                </div>
                {/* Step Number Badge */}
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-card rounded-full flex items-center justify-center font-bold text-foreground border-4 border-background shadow-lg">{index + 1}</div>
              </div>

              <h3 className="text-xl font-bold mb-4 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>

              {index < steps.length - 1 && (
                <div className="mt-8 text-border lg:hidden">
                  <IconArrowRight size={32} className="rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
