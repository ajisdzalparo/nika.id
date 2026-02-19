"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { IconSearch, IconAdjustmentsHorizontal, IconEye, IconEdit, IconHeart } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

// Mock data integration with actual registry slugs where possible
const allTemplates = [
  {
    id: "romantic-elegance",
    name: "Romantic Elegance",
    category: "Modern",
    type: "Premium",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "classic-premium",
    name: "Classic Premium",
    category: "Vintage",
    type: "Premium",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "modern-dark",
    name: "Modern Dark",
    category: "Minimalist",
    type: "Pro",
    image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "royal-gold",
    name: "Royal Gold",
    category: "Luxury",
    type: "Premium",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "estetik",
    name: "Estetik Bloom",
    category: "Floral",
    type: "Free",
    image: "https://images.unsplash.com/photo-1522673607200-164883eecd0c?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "example",
    name: "Basic Example",
    category: "Minimalist",
    type: "Free",
    image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop",
  },
];

const categories = ["Semua", "Modern", "Vintage", "Minimalist", "Luxury", "Floral"];

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "Semua" || t.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="pt-32 pb-24">
        {/* Header Section */}
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-black text-slate-900 mb-6">
              Koleksi <span className="text-primary">Template</span> Kami
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-slate-600 text-lg md:text-xl leading-relaxed">
              Temukan desain yang sempurna untuk menceritakan kisah cinta unik Anda. Semua template dapat dikustomisasi sepenuhnya sesuai keinginan.
            </motion.p>
          </div>
        </section>

        {/* Filters & Search */}
        <section className="container mx-auto px-4 mb-12">
          <div className="bg-white p-4 md:p-6 rounded-md shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-center sticky top-24 z-40">
            <div className="relative grow w-full">
              <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Cari desain impian..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-md border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-2 md:pb-0">
              <IconAdjustmentsHorizontal className="text-slate-400 mr-2 shrink-0 hidden md:block" size={20} />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap ${activeCategory === cat ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Template Grid */}
        <section className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((template, index) => (
                <motion.div
                  layout
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group relative bg-white rounded-md overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100"
                >
                  <div className="aspect-4/5 relative overflow-hidden">
                    <Image src={template.image} alt={template.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />

                    {/* Badge Type */}
                    <div className="absolute top-6 left-6 z-10">
                      <div
                        className={`px-4 py-1.5 rounded-md text-xs font-bold tracking-wider uppercase backdrop-blur-md border ${
                          template.type === "Free" ? "bg-emerald-500/80 text-white border-emerald-400/50" : "bg-primary/90 text-primary-foreground border-primary/50"
                        }`}
                      >
                        {template.type}
                      </div>
                    </div>

                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4">
                      <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-white/90 rounded-md w-48 shadow-xl">
                        <Link href={`/preview/${template.id}`}>
                          <IconEye size={20} className="mr-2" />
                          Preview
                        </Link>
                      </Button>
                      <Button asChild size="lg" className="bg-primary hover:bg-primary/90 rounded-md w-48 shadow-xl text-primary-foreground">
                        <Link href="/register">
                          <IconEdit size={20} className="mr-2" />
                          Gunakan
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-primary mb-1">{template.category}</div>
                        <h3 className="text-2xl font-black text-slate-900 leading-tight">{template.name}</h3>
                      </div>
                      <button className="text-slate-300 hover:text-primary transition-colors">
                        <IconHeart size={24} />
                      </button>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">Template pernikahan digital yang modern dan interaktif dengan fitur musik latar, galeri, dan RSVP otomatis.</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                <IconSearch size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Tidak ada hasil</h3>
              <p className="text-slate-500">Coba kata kunci lain atau filter kategori yang berbeda.</p>
            </div>
          )}
        </section>

        {/* CTA Bottom */}
        <section className="container mx-auto px-4 mt-24">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-8">Punya desain sendiri?</h2>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed">Kami juga menyediakan layanan custom design eksklusif untuk Anda yang menginginkan sesuatu yang benar-benar unik.</p>
              <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-white/90 rounded-2xl h-14 px-10 text-lg font-bold">
                <Link href="/kontak">Hubungi Kami</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
