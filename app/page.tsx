import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { AiDemo, Collection, Faq, Features, FinalCta, LandingFooter, Pricing, Steps, StickyCta } from "@/components/landing/sections";
import { LandingChatWidget } from "@/components/landing/landing-chat-widget";
import { L } from "@/components/landing/primitives";
import { getCatalog } from "@/lib/catalog";
import { getLandingContent } from "@/lib/landing-content";
import { getManualPaymentInfo } from "@/lib/payment";
import { studioDisplay } from "@/lib/studio";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "UNDANGIN YUK · Undangan pernikahan digital dengan Desain AI",
  description: "Rancang undangan pernikahan digital sesuai konsep kalian dengan AI. RSVP, amplop digital, musik, galeri, dan kirim ke tamu lewat WhatsApp.",
};

export default async function Home() {
  const [catalog, { whatsapp }, cms] = await Promise.all([
    getCatalog(),
    getManualPaymentInfo(),
    getLandingContent(),
  ]);
  return (
    <div className={`${studioDisplay.variable} min-h-screen antialiased`} style={{ background: L.bg, color: L.ink }}>
      <LandingNavbar />
      <main>
        <Hero content={cms.hero} />
        <AiDemo />
        <Collection items={catalog} />
        <Steps content={cms.steps} />
        <Features content={cms.features} />
        <Pricing />
        <Faq content={cms.faq} />
        <FinalCta content={cms.finalCta} />
      </main>
      <LandingFooter content={cms.footer} />
      <StickyCta />
      <LandingChatWidget whatsapp={whatsapp} />
    </div>
  );
}
