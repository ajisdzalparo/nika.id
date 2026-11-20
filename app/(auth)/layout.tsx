import Link from "next/link";
import { studioClass } from "@/lib/studio";
import { Phone } from "@/components/landing/primitives";
import { AI_THEME_PRESETS } from "@/lib/ai-design/presets";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${studioClass} grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]`}>
      {/* Left: brand panel with a real invitation from the theme engine (desktop only) */}
      <aside className="relative hidden overflow-hidden bg-[#15130F] text-[#F3EBDD] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Link href="/" className="font-(family-name:--font-landing-display) text-[28px] font-semibold leading-none tracking-tight">
          nika<span className="text-[#C9A45C]">.id</span>
        </Link>

        <div className="flex justify-center py-10">
          <Phone theme={AI_THEME_PRESETS["malam-keemasan"].theme} zoom={0.62} />
        </div>

        <div className="max-w-sm space-y-3">
          <p className="font-(family-name:--font-landing-display) text-3xl leading-tight">
            Undangan yang terasa dibuat <em className="text-[#C9A45C]">khusus</em> untuk kalian.
          </p>
          <p className="text-sm text-[#B8AD9A]">Rancang dengan AI atau pilih dari koleksi, lalu bagikan ke tamu lewat WhatsApp.</p>
        </div>
      </aside>

      {/* Right: form */}
      <main className="flex flex-col bg-[#F7F3EC] px-6 py-8 sm:px-12">
        <Link href="/" className="font-(family-name:--font-landing-display) text-[26px] font-semibold leading-none tracking-tight lg:hidden">
          nika<span className="text-[#8A6A2F]">.id</span>
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md space-y-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
