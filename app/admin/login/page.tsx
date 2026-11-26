import { BrandLogo } from "@/components/common/brand-logo";
import type { Metadata } from "next";
import { Suspense } from "react";
import { studioClass } from "@/lib/studio";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Masuk Panel Admin · SatuMoment",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className={`${studioClass} flex min-h-screen flex-col bg-[#FCF8F1] px-6 py-8 text-[#1F1A14]`}>
      <header className="flex items-center gap-3">
        <BrandLogo className="h-8" />
        <span className="rounded-full border border-[#E3D3B4] bg-[#F4EDDF] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A6424]">
          Panel Admin
        </span>
      </header>
      <main className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-[440px] rounded-3xl border border-[#E9DDC6] bg-[#FFFDF9] px-6 py-8 shadow-[0_24px_60px_-32px_rgba(90,64,24,.35)] sm:px-10 sm:py-10">
          <Suspense>
            <AdminLoginForm />
          </Suspense>
        </div>
      </main>
      <p className="text-center text-xs text-[#7A6E5C]">Halaman ini khusus pengelola SatuMoment.</p>
    </div>
  );
}
