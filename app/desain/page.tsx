import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/sections";
import { DesignCatalog } from "@/components/landing/design-catalog";
import { L } from "@/components/landing/primitives";
import { getCatalog } from "@/lib/catalog";
import { studioDisplay } from "@/lib/studio";

export const metadata: Metadata = {
  title: "Koleksi desain undangan · UNDANGIN YUK",
  description: "Jelajahi desain undangan pernikahan digital: adat, minimalis, floral, luxury, dan lainnya. Coba langsung di HP sebelum memilih.",
};

export const dynamic = "force-dynamic";

export default async function DesignCatalogPage() {
  const items = await getCatalog();
  return (
    <div className={`${studioDisplay.variable} min-h-screen antialiased`} style={{ background: L.bg, color: L.ink }}>
      <LandingNavbar />
      <main>
        <DesignCatalog items={items} />
      </main>
      <LandingFooter />
    </div>
  );
}
