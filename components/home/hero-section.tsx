"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconHeart, IconSparkles, IconArrowRight } from "@tabler/icons-react";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/30 blur-[120px] rounded-full"
        />
      </div>

      <div className="container mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium mb-8 inline-flex items-center gap-2">
            <IconSparkles size={16} />
            <span>Platform Undangan Digital No. 1 di Indonesia</span>
          </Badge>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-5xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.1] text-foreground">
          Rayakan Cinta <br />
          <span className="text-primary relative">
            Dengan Elegan
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 358 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9C118.5 3 239.5 3 355 9" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Buat undangan pernikahan digital yang modern, interaktif, dan tak terlupakan hanya dalam hitungan menit.
        </motion.p>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="text-lg px-8 h-14 rounded-2xl shadow-xl group">
            <Link href="/register">
              Mulai Buat Gratis
              <IconArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8 h-14 rounded-2xl">
            <Link href="#templates">Lihat Template</Link>
          </Button>
        </motion.div>

        {/* Hero Decorative Floating Icons */}
        <div className="absolute top-1/2 left-10 hidden lg:block">
          <motion.div animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="p-4 bg-card rounded-2xl shadow-2xl text-primary">
            <IconHeart size={32} fill="currentColor" />
          </motion.div>
        </div>
        <div className="absolute top-1/3 right-20 hidden lg:block">
          <motion.div animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="p-4 bg-card rounded-2xl shadow-2xl text-accent-foreground">
            <IconSparkles size={32} fill="currentColor" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
