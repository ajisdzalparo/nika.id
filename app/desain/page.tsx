import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/sections";
import { DesignCatalog } from "@/components/landing/design-catalog";
import { L } from "@/components/landing/primitives";
import { getCatalog } from "@/lib/catalog";
import { landingFontClass } from "@/lib/studio";

export const metadata: Metadata = {
  title: "Template undangan pernikahan · SatuMoment",
  description: "Semua template undangan pernikahan digital: adat, minimalis, floral, luxury, dan lainnya. Coba langsung di HP sebelum memilih.",
  alternates: { canonical: "/desain" },
};

export const dynamic = "force-dynamic";

export default async function DesignCatalogPage() {
  const items = await getCatalog();
  return (
    <div className={`${landingFontClass} min-h-screen antialiased`} style={{ background: L.bg, color: L.ink }}>
      <LandingNavbar />
      <main>
        <DesignCatalog items={items} />
      </main>
      <LandingFooter />
    </div>
  );
}
