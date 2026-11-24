import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { AiDemo, Collection, Faq, Features, FinalCta, LandingFooter, PartnerVendors, Pricing, Steps, StickyCta, type PartnerVendor } from "@/components/landing/sections";
import { LandingChatWidget } from "@/components/landing/landing-chat-widget";
import { L } from "@/components/landing/primitives";
import { getCatalog } from "@/lib/catalog";
import { getLandingContent } from "@/lib/landing-content";
import { getManualPaymentInfo } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { studioDisplay } from "@/lib/studio";

export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "UNDANGIN YUK · Undangan pernikahan digital dengan Desain AI",
  description: "Rancang undangan pernikahan digital sesuai konsep kalian dengan AI. RSVP, amplop digital, musik, galeri, dan kirim ke tamu lewat WhatsApp.",
};

export default async function Home() {
  const [catalog, { whatsapp }, cms, partnerRows] = await Promise.all([
    getCatalog(),
    getManualPaymentInfo(),
    getLandingContent(),
    prisma.user.findMany({
      where: { accountType: "AGENCY", agencyName: { not: null } },
      orderBy: [{ agencyVerified: "desc" }, { agencyQuota: "desc" }, { createdAt: "desc" }],
      take: 18,
      select: { id: true, agencyName: true, agencyLogo: true, agencyInstagram: true, agencyVerified: true },
    }),
  ]);
  const partners: PartnerVendor[] = partnerRows
    .filter((p): p is typeof p & { agencyName: string } => Boolean(p.agencyName))
    .map((p) => ({
      id: p.id,
      agencyName: p.agencyName,
      agencyLogo: p.agencyLogo,
      agencyInstagram: p.agencyInstagram,
      agencyVerified: p.agencyVerified,
    }));
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
        <PartnerVendors partners={partners} />
        <Faq content={cms.faq} />
        <FinalCta content={cms.finalCta} />
      </main>
      <LandingFooter content={cms.footer} />
      <StickyCta />
      <LandingChatWidget whatsapp={whatsapp} />
    </div>
  );
}
