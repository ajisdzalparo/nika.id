"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { IconHeart, IconBrandGoogle, IconEye, IconEyeOff, IconLoader2, IconMail, IconLock } from "@tabler/icons-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Login gagal");
        setLoading(false);
        return;
      }

      const user = result.data?.user;
      const role = (user as { role?: string })?.role || "user";
      const from = searchParams.get("from");

      let target = "/dashboard";
      if (from) {
        target = from;
      } else if (role === "admin") {
        target = "/admin";
      }

      router.push(target);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan yang tidak terduga");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      await signIn.social({
        provider: "google",
        callbackURL: searchParams.get("from") || "/dashboard",
      });
    } catch {
      setError("Gagal masuk dengan Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-pink-200/40 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[35%] h-[35%] bg-purple-200/40 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-xl overflow-hidden relative">
          <div className="h-1.5 bg-linear-to-r from-pink-400 to-purple-500 w-full" />

          <CardHeader className="space-y-4 sm:space-y-6 pt-8 sm:pt-10 pb-4 sm:pb-6 relative">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="flex justify-center">
              <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-linear-to-br from-pink-50 to-purple-50 shadow-lg shadow-pink-100/50 relative group">
                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                  <IconHeart className="w-10 h-10 sm:w-12 sm:h-12 text-pink-500 drop-shadow-lg" strokeWidth={1.5} />
                </motion.div>
                <div className="absolute inset-0 bg-linear-to-br from-pink-400/20 to-purple-400/20 rounded-2xl sm:rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
              </div>
            </motion.div>

            <div className="space-y-2 sm:space-y-3 text-center">
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-900">
                Selamat Datang <span className="text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-purple-500">Kembali</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 font-medium">Masuk ke nika.id untuk mengelola undangan Anda</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-6 sm:px-10 pb-8 sm:pb-10">
            {/* Google Sign-In Button - Show first for easier access */}
            {process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true" && (
              <>
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  className="w-full h-12 sm:h-14 text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-300 text-gray-700 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-blue-50 to-red-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                    {googleLoading ? (
                      <>
                        <IconLoader2 size={18} className="animate-spin" />
                        <span>Menghubungkan...</span>
                      </>
                    ) : (
                      <>
                        <IconBrandGoogle size={18} />
                        <span>Masuk dengan Google</span>
                      </>
                    )}
                  </span>
                </Button>

                {/* Divider */}
                <div className="relative my-6 sm:my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t-2 border-gray-100" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
                    <span className="bg-white/80 px-6 text-gray-400">Atau masuk dengan email</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-600 ml-1">
                  Email
                </Label>
                <div className="relative">
                  <IconMail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className="h-12 sm:h-14 pl-11 rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all text-sm sm:text-base font-medium bg-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Password
                  </Label>
                  <Link href="#" className="text-xs font-bold text-pink-500 hover:text-pink-600 transition-colors">
                    Lupa password?
                  </Link>
                </div>
                <div className="relative">
                  <IconLock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className="h-12 sm:h-14 pl-11 pr-12 rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all text-sm sm:text-base bg-white/50 backdrop-blur-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" disabled={loading || googleLoading}>
                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs sm:text-sm font-semibold text-red-600 bg-red-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-red-100 flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 sm:h-14 text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-xl shadow-pink-200 hover:shadow-2xl hover:shadow-pink-300 transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group"
                disabled={loading || googleLoading}
              >
                <div className="absolute inset-0 bg-linear-to-r from-pink-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <IconLoader2 size={18} className="animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Masuk ke Akun"
                  )}
                </span>
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center mt-6 sm:mt-8">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                Belum punya akun?{" "}
                <Link href="/register" className="font-black text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition-all">
                  Daftar Gratis
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
