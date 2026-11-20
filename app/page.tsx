import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { AiDemo, Collection, Faq, Features, FinalCta, LandingFooter, Pricing, Steps, StickyCta } from "@/components/landing/sections";
import { L } from "@/components/landing/primitives";
import { getCatalog } from "@/lib/catalog";
import { studioDisplay } from "@/lib/studio";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "nika.id · Undangan pernikahan digital dengan Desain AI",
  description: "Rancang undangan pernikahan digital sesuai konsep kalian dengan AI. RSVP, amplop digital, musik, galeri, dan kirim ke tamu lewat WhatsApp.",
};

export default async function Home() {
  const catalog = await getCatalog();
  return (
    <div className={`${studioDisplay.variable} min-h-screen antialiased`} style={{ background: L.bg, color: L.ink }}>
      <LandingNavbar />
      <main>
        <Hero />
        <AiDemo />
        <Collection items={catalog} />
        <Steps />
        <Features />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
      <StickyCta />
    </div>
  );
}
