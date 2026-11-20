"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { AI_THEME_PRESETS } from "@/lib/ai-design/presets";
import { Display, Eyebrow, L, Phone } from "./primitives";

const HERO_PHONES: { key: keyof typeof AI_THEME_PRESETS; label: string }[] = [
  { key: "kawung-sogan", label: "Kawung Sogan" },
  { key: "malam-keemasan", label: "Malam Keemasan" },
  { key: "taman-pastel", label: "Taman Pastel" },
];

export function Hero() {
  const [mobileIdx, setMobileIdx] = useState(1);

  useEffect(() => {
    const id = setInterval(() => setMobileIdx((x) => (x + 1) % HERO_PHONES.length), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden pb-16 pt-28 sm:pb-20 md:pb-24 md:pt-36">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 md:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-6">
        <div className="space-y-8">
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
            <Eyebrow>Undangan pernikahan digital</Eyebrow>
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:80ms] [animation-fill-mode:backwards]">
            <Display as="h1" className="text-[3.1rem] sm:text-6xl lg:text-[4.3rem] xl:text-[4.7rem]">
              Undangan yang terasa dibuat <em className="italic" style={{ color: L.accent }}>khusus</em> untuk kalian berdua.
            </Display>
          </div>
          <p className="max-w-lg text-[17px] leading-relaxed animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:150ms] [animation-fill-mode:backwards]" style={{ color: L.muted }}>
            Ceritakan suasana yang kalian impikan. AI kami merancang palet, tipografi, dan ornamennya, lengkap dengan RSVP, amplop digital, dan pengiriman ke tamu lewat WhatsApp.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:220ms] [animation-fill-mode:backwards]">
            <Link href="/register" className="flex h-13 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95" style={{ background: L.ink, color: L.bg }}>
              Buat undangan <IconArrowRight size={18} />
            </Link>
            <a href="#desain-ai" className="flex h-13 items-center justify-center rounded-full border px-7 text-[15px] font-medium transition-all duration-300 hover:-translate-y-0.5 hover:bg-white" style={{ borderColor: L.line, color: L.ink }}>
              Coba desain AI
            </a>
          </div>
          <dl className="grid max-w-md grid-cols-3 gap-4 border-t pt-6 animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:300ms] [animation-fill-mode:backwards]" style={{ borderColor: L.line }}>
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
        <div className="relative flex flex-col items-center justify-center">
          {/* Desktop 3-phone editorial fan */}
          <div className="relative hidden items-start justify-center sm:flex">
            <div className="relative z-0 -mr-20 mt-20 animate-in fade-in slide-in-from-left-6 duration-700 [animation-delay:200ms] [animation-fill-mode:backwards]">
              <div className="animate-uy-float-delayed">
                <Phone
                  theme={AI_THEME_PRESETS["kawung-sogan"].theme}
                  zoom={0.5}
                  className="rotate-[-6deg] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-20 hover:-translate-y-3 hover:rotate-[-2deg]"
                />
              </div>
            </div>
            <div className="relative z-10 animate-in fade-in zoom-in-95 duration-700 [animation-delay:100ms] [animation-fill-mode:backwards]">
              <div className="animate-uy-float">
                <Phone
                  theme={AI_THEME_PRESETS["malam-keemasan"].theme}
                  zoom={0.68}
                  className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2"
                />
              </div>
            </div>
            <div className="relative z-0 -ml-20 mt-20 animate-in fade-in slide-in-from-right-6 duration-700 [animation-delay:260ms] [animation-fill-mode:backwards]">
              <div className="animate-uy-float-delayed">
                <Phone
                  theme={AI_THEME_PRESETS["taman-pastel"].theme}
                  zoom={0.5}
                  className="rotate-[6deg] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-20 hover:-translate-y-3 hover:rotate-[2deg]"
                />
              </div>
            </div>
          </div>

          {/* Mobile mini design carousel */}
          <div className="flex flex-col items-center gap-4 sm:hidden">
            <div key={HERO_PHONES[mobileIdx].key} className="animate-in fade-in zoom-in-95 duration-500">
              <Phone theme={AI_THEME_PRESETS[HERO_PHONES[mobileIdx].key].theme} zoom={0.68} />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {HERO_PHONES.map((p, idx) => (
                <button
                  key={p.key}
                  onClick={() => setMobileIdx(idx)}
                  className="h-9 rounded-full border px-3 text-xs font-medium transition-all duration-300"
                  style={idx === mobileIdx ? { background: L.ink, color: L.bg, borderColor: L.ink } : { borderColor: L.line, color: L.muted, background: L.surface }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
