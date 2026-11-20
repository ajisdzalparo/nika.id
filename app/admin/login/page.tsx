import type { Metadata } from "next";
import { Suspense } from "react";
import { studioDisplay } from "@/lib/studio";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Masuk Panel Admin · nika.id",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className={`${studioDisplay.variable} flex min-h-screen flex-col bg-[#15130F] px-6 py-8 text-[#F3EBDD]`}>
      <header className="flex items-center gap-3">
        <span className="font-(family-name:--font-landing-display) text-[26px] font-semibold leading-none tracking-tight">
          nika<span className="text-[#C9A45C]">.id</span>
        </span>
        <span className="rounded-full border border-[#3A352C] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[#B8AD9A]">Panel Admin</span>
      </header>
      <main className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm">
          <Suspense>
            <AdminLoginForm />
          </Suspense>
        </div>
      </main>
      <p className="text-center text-xs text-[#8C8272]">Halaman ini khusus pengelola nika.id.</p>
    </div>
  );
}
