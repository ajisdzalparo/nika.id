import { BrandLogo } from "@/components/common/brand-logo";
import React from "react";

export function TemplateLoadingScreen({
  label = "Menyiapkan tampilan undangan",
}: {
  label?: string;
}) {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FCF8F1] px-6 text-[#1F1A14]"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 40%, rgba(200, 176, 138, 0.2), transparent 58%)",
        }}
      />

      <div className="relative w-full max-w-xs border border-[#DFD4C4] bg-[#FFFDF9]/95 px-8 py-10 text-center shadow-[0_24px_60px_-28px_rgba(30,27,23,0.2)]">
        <div
          className="pointer-events-none absolute inset-2 border border-[#C8B08A]/45"
          aria-hidden="true"
        />

        <div className="relative flex flex-col items-center space-y-5">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <span className="absolute inset-0 animate-spin rounded-full border border-[#D9CEBE] border-t-[#9A7B4F]" />
            <BrandLogo variant="symbol" className="h-7 w-7 opacity-90" />
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#9A7B4F]">
              SatuMoment
            </p>
            <p className="font-serif text-lg text-[#1F1A14]">{label}&hellip;</p>
          </div>

          <div className="h-0.5 w-32 overflow-hidden rounded-full bg-[#EAE2D6]">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[#9A7B4F]" />
          </div>
        </div>
      </div>
    </div>
  );
}
