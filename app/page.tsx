"use client";

import { useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/navbar";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesGrid } from "@/components/home/features-grid";
import { TemplateShowcase } from "@/components/home/template-showcase";
import { HowItWorks } from "@/components/home/how-it-works";
import { PricingSection } from "@/components/home/pricing-section";
import { Testimonials } from "@/components/home/testimonials";
import { FAQSection } from "@/components/home/faq-section";
import { Footer } from "@/components/layout/footer";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Page level animations can be added here if needed
  }, []);

  return (
    <div ref={mainRef} className="min-h-screen bg-white">
      <Navbar />

      <main>
        <HeroSection />

        <FeaturesGrid />

        <TemplateShowcase />

        <HowItWorks />

        <PricingSection />

        <Testimonials />

        <FAQSection />

        {/* Call to Action Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-[3rem] p-12 md:p-20 text-center text-white shadow-2xl shadow-pink-200 relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-bold mb-8 capitalize">
                  Siap untuk merayakan <br /> momen spesial Anda?
                </h2>
                <p className="text-pink-50 text-xl mb-12 leading-relaxed">Gabung bersama ribuan pasangan lainnya yang telah menggunakan nika.id untuk hari bahagia mereka.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="secondary" className="text-lg px-8 h-14 rounded-2xl">
                    <Link href="/register">Buat Undangan Sekarang</Link>
                  </Button>
                  <Button asChild size="lg" className="text-lg px-8 h-14 bg-white/10 hover:bg-white/20 border-white/20 backdrop-blur-sm rounded-2xl">
                    <Link href="/login">Masuk ke Dashboard</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
