import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Image & Branding (Desktop Only) */}
      <div className="hidden lg:block relative bg-zinc-900 h-full overflow-hidden">
        <Image src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1920&auto=format&fit=crop" alt="Wedding ambience" fill className="object-cover opacity-80" priority />
        <div className="absolute inset-0 bg-linear-to-t from-zinc-900/90 via-zinc-900/40 to-transparent" />

        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
          <Link href="/" className="text-2xl font-serif font-black tracking-tighter">
            Nika.id
          </Link>

          <div className="space-y-6 max-w-lg">
            <blockquote className="text-2xl font-serif leading-relaxed">&quot;Pernikahan bukan hanya tentang menyatukan dua hati, tapi juga tentang berbagi momen bahagia dengan cara yang paling indah.&quot;</blockquote>
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-white/50" />
              <p className="text-sm text-zinc-300 font-medium">Platform Undangan Digital Premium</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-md space-y-8">{children}</div>
      </div>
    </div>
  );
}
