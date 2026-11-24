import Link from "next/link";
import { IconArrowLeft, IconCompass } from "@tabler/icons-react";
import { BrandLogo } from "@/components/common/brand-logo";

export default function NotFoundPage() {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#F7F3EC] px-5 py-14 text-[#1E1B17]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 50% 0%, rgba(200, 176, 138, 0.2) 0%, transparent 60%)",
      }}
    >
      <div className="relative w-full max-w-lg border border-[#DDD1BF] bg-[#FFFDF9] p-8 text-center shadow-[0_24px_70px_-28px_rgba(30,27,23,0.22)] sm:p-12">
        <div
          className="pointer-events-none absolute inset-2.5 border border-[#C8B08A]/45"
          aria-hidden="true"
        />

        <div className="relative space-y-6">
          <Link href="/" className="mx-auto inline-flex items-center">
            <BrandLogo className="h-9" />
          </Link>

          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#9A7B4F]">
              Error 404
            </p>
            <h1 className="font-serif text-6xl font-normal tracking-tight text-[#1E1B17] sm:text-7xl">
              404
            </h1>
            <h2 className="font-serif text-2xl font-normal text-[#1E1B17] sm:text-3xl">
              Halaman Tidak Ditemukan
            </h2>
          </div>

          <div className="mx-auto h-px w-16 bg-[#C8B08A]/70" />

          <p className="mx-auto max-w-sm text-sm leading-relaxed text-[#6B6358]">
            Maaf, halaman atau tautan undangan yang Anda tuju tidak tersedia, telah dipindahkan, atau salah penulisan alamat.
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1E1B17] px-6 text-sm font-medium text-[#F7F3EC] transition-colors hover:bg-[#332E27]"
            >
              <IconArrowLeft size={16} />
              Kembali ke Beranda
            </Link>
            <Link
              href="/desain"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#D4C6B3] bg-[#FAF6F0] px-6 text-sm font-medium text-[#1E1B17] transition-colors hover:border-[#9A7B4F] hover:bg-[#EFE7DA]"
            >
              <IconCompass size={16} />
              Lihat Template
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
