"use client";

import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { AI_THEME_PRESETS } from "@/lib/ai-design/presets";
import { Display, Eyebrow, L, Phone } from "./primitives";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 md:pt-36">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 md:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-6">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <Eyebrow>Undangan pernikahan digital</Eyebrow>
          <Display as="h1" className="text-[3.1rem] sm:text-6xl lg:text-[4.3rem] xl:text-[4.7rem]">
            Undangan yang terasa dibuat <em className="italic" style={{ color: L.accent }}>khusus</em> untuk kalian berdua.
          </Display>
          <p className="max-w-lg text-[17px] leading-relaxed" style={{ color: L.muted }}>
            Ceritakan suasana yang kalian impikan. AI kami merancang palet, tipografi, dan ornamennya, lengkap dengan RSVP, amplop digital, dan pengiriman ke tamu lewat WhatsApp.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="flex h-13 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium transition-opacity hover:opacity-90" style={{ background: L.ink, color: L.bg }}>
              Buat undangan <IconArrowRight size={18} />
            </Link>
            <a href="#desain-ai" className="flex h-13 items-center justify-center rounded-full border px-7 text-[15px] font-medium transition-colors hover:bg-white" style={{ borderColor: L.line, color: L.ink }}>
              Coba desain AI
            </a>
          </div>
          <dl className="grid max-w-md grid-cols-3 gap-4 border-t pt-6" style={{ borderColor: L.line }}>
            {[
              ["Menit", "dari daftar sampai siap dibagikan"],
              ["Nama tamu", "tampil di sampul undangan"],
              ["Kapan saja", "isi bisa diubah setelah dibagikan"],
            ].map(([t, d]) => (
              <div key={t} className="space-y-1">
                <dt className="font-(family-name:--font-landing-display) text-xl" style={{ color: L.ink }}>
                  {t}
                </dt>
                <dd className="text-xs leading-snug" style={{ color: L.muted }}>
                  {d}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Real invitations rendered by the theme engine */}
        <div className="relative flex items-start justify-center">
          <Phone theme={AI_THEME_PRESETS["kawung-sogan"].theme} zoom={0.5} className="relative z-0 -mr-20 mt-20 rotate-[-6deg] max-sm:hidden" />
          <Phone theme={AI_THEME_PRESETS["malam-keemasan"].theme} zoom={0.68} className="relative z-10" />
          <Phone theme={AI_THEME_PRESETS["taman-pastel"].theme} zoom={0.5} className="relative z-0 -ml-20 mt-20 rotate-[6deg] max-sm:hidden" />
        </div>
      </div>
    </section>
  );
}
