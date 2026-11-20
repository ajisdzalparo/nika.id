"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { IconBrandGoogle, IconEye, IconEyeOff, IconLoader2, IconMail, IconLock } from "@tabler/icons-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // better-auth redirects back here with ?error=... when the Google flow fails
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) toast.error(`Gagal masuk dengan Google (${error})`);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        toast.error(result.error.message || "Login gagal");
        setLoading(false);
        return;
      }

      // The user login always lands in the user area; admins use /admin/login.
      await fetch("/api/portal/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portal: "user" }),
      });

      const from = searchParams.get("from");
      const target = from && from.startsWith("/") && !from.startsWith("/admin") ? from : "/dashboard";

      router.push(target);
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan yang tidak terduga");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      const from = searchParams.get("from");
      const next = from && from.startsWith("/") && !from.startsWith("/admin") ? from : "/dashboard";
      const result = await signIn.social({
        provider: "google",
        callbackURL: `/api/portal/enter?portal=user&next=${encodeURIComponent(next)}`,
        errorCallbackURL: "/login",
      });
      if (result?.error) {
        toast.error(result.error.message || "Gagal masuk dengan Google");
        setGoogleLoading(false);
      }
    } catch {
      toast.error("Gagal masuk dengan Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="font-serif text-[2.6rem] leading-tight font-medium text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">Selamat Datang Kembali</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Masuk untuk mengelola undangan pernikahan Anda.</p>
      </div>

      <div className="space-y-6">
        {process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true" && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full h-12 rounded-full border-zinc-300 bg-white font-medium text-zinc-800 hover:bg-zinc-100"
            >
              {googleLoading ? <IconLoader2 className="w-5 h-5 animate-spin mr-2" /> : <IconBrandGoogle className="w-5 h-5 mr-2" />}
              Masuk dengan Google 
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#F7F3EC] px-2 text-zinc-400 font-medium">Atau dengan email</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </Label>
            <div className="relative">
              <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || googleLoading}
                className="pl-10 h-11 bg-white border-zinc-200 dark:border-zinc-800 focus:ring-primary focus:border-primary rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </Label>
              <Link href="/forgot-password" className="text-xs font-medium text-primary hover:text-primary/90 transition-colors" tabIndex={-1}>
                Lupa password?
              </Link>
            </div>
            <div className="relative">
              <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || googleLoading}
                className="pl-10 pr-10 h-11 bg-white border-zinc-200 dark:border-zinc-800 focus:ring-primary focus:border-primary rounded-xl"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors" tabIndex={-1}>
                {showPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 rounded-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all" disabled={loading || googleLoading}>
            {loading ? (
              <>
                <IconLoader2 className="w-5 h-5 animate-spin mr-2" />
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-primary hover:text-primary/90 transition-colors">
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <IconLoader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
