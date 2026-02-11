"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { IconExternalLink, IconEye } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

const templates = [
  {
    id: 1,
    name: "Romantic Elegance",
    slug: "romantic-elegance",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
    category: "Modern",
  },
  {
    id: 2,
    name: "Floral Blossom",
    slug: "classic-premium",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop",
    category: "Vintage",
  },
  {
    id: 3,
    name: "Minimalist White",
    slug: "modern-dark",
    image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop",
    category: "Minimalist",
  },
  {
    id: 4,
    name: "Golden Royale",
    slug: "royal-gold",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop",
    category: "Luxury",
  },
];

export function TemplateShowcase() {
  return (
    <section id="templates" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Template Desain Terpopuler</h2>
            <p className="text-slate-600 text-lg">Pilih dari berbagai desain eksklusif yang dirancang oleh desainer profesional untuk menceritakan kisah cinta unik Anda.</p>
          </div>
          <Button variant="outline" size="lg" className="rounded-2xl border-slate-200" asChild>
            <Link href="/templates">Lihat Semua Template</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              group-hover="true"
              className="group relative bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
            >
              <div className="aspect-4/5 relative overflow-hidden">
                <Image src={template.image} alt={template.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                  <Button size="icon" variant="secondary" className="rounded-full w-12 h-12 shadow-xl hover:scale-110 active:scale-95 transition-transform" asChild>
                    <Link href={`/preview/${template.slug}`}>
                      <IconEye size={20} />
                    </Link>
                  </Button>
                  <Button size="icon" variant="secondary" className="rounded-full w-12 h-12 shadow-xl hover:scale-110 active:scale-95 transition-transform" asChild>
                    <Link href="/register">
                      <IconExternalLink size={20} />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="text-xs font-semibold uppercase tracking-wider text-pink-500 mb-2">{template.category}</div>
                <h3 className="text-xl font-bold text-slate-900">{template.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
