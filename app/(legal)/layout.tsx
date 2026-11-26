import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/sections";
import { L } from "@/components/landing/primitives";
import { getLandingContent } from "@/lib/landing-content";
import { landingFontClass } from "@/lib/studio";

/** Public policy pages share the landing navbar, palette and footer. */
export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const cms = await getLandingContent();
  return (
    <div className={`${landingFontClass} min-h-screen antialiased`} style={{ background: L.bg, color: L.ink }}>
      <LandingNavbar />
      {children}
      <LandingFooter content={cms.footer} />
    </div>
  );
}
