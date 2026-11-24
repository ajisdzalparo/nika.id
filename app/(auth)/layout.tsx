import { BrandLogo } from "@/components/common/brand-logo";
import Link from "next/link";
import { studioClass } from "@/lib/studio";
import { Phone } from "@/components/landing/primitives";
import { AI_THEME_PRESETS } from "@/lib/ai-design/presets";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${studioClass} grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]`}>
      {/* Left: brand panel with a real invitation from the theme engine (desktop only) */}
      <aside className="relative hidden overflow-hidden bg-[#1A1510] text-[#F6EEDD] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link href="/" className="inline-flex w-fit items-center">
          <BrandLogo tone="light" className="h-9" />
        </Link>

        <div className="flex justify-center py-10">
          <Phone theme={AI_THEME_PRESETS["malam-keemasan"].theme} zoom={0.62} />
        </div>

        <div className="max-w-sm space-y-3">
          <p className="font-(family-name:--font-landing-display) text-3xl leading-tight">
            Undangan yang terasa dibuat <em className="text-[#D9B56A]">khusus</em> untuk kalian.
          </p>
          <p className="text-sm text-[#B8AD9A]">Rancang dengan AI atau pilih dari koleksi, lalu bagikan ke tamu lewat WhatsApp.</p>
        </div>
      </aside>

      {/* Right: form */}
      <main className="flex flex-col bg-[#FCF8F1] px-6 py-8 sm:px-12">
        <Link href="/" className="inline-flex w-fit items-center lg:hidden">
          <BrandLogo className="h-8" />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md space-y-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
