"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, signIn } from "@/lib/auth-client";
import { IconHeart, IconBrandGoogle, IconEye, IconEyeOff, IconLoader2, IconCheck, IconX, IconMail, IconLock, IconUser } from "@tabler/icons-react";

// Helper function to generate slug
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Password strength checker
const getPasswordStrength = (password: string) => {
  if (password.length === 0) return { strength: 0, label: "", color: "" };
  if (password.length < 8) return { strength: 1, label: "Lemah", color: "bg-red-500" };
  if (password.length < 12 && !/[A-Z]/.test(password)) return { strength: 2, label: "Sedang", color: "bg-yellow-500" };
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { strength: 3, label: "Baik", color: "bg-blue-500" };
  return { strength: 4, label: "Kuat", color: "bg-green-500" };
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter");
      return;
    }

    setLoading(true);

    try {
      const slug = generateSlug(name) + "-" + Date.now().toString().slice(-4);

      const result = await signUp.email({
        email,
        password,
        name,
        // @ts-expect-error - better-auth will handle additional fields
        invitationSlug: slug,
      });

      if (result.error) {
        setError(result.error.message || "Registrasi gagal");
        setLoading(false);
        return;
      }

      router.push("/verification-sent?email=" + encodeURIComponent(email));
    } catch {
      setError("Terjadi kesalahan yang tidak terduga");
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch {
      setError("Gagal mendaftar dengan Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-purple-200/40 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[35%] h-[35%] bg-pink-200/40 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="border-none shadow-2xl bg-white/90 backdrop-blur-xl overflow-hidden relative">
          <div className="h-1.5 bg-linear-to-r from-purple-400 to-pink-500 w-full" />

          <CardHeader className="space-y-4 sm:space-y-6 pt-8 sm:pt-10 pb-4 sm:pb-6 relative">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="flex justify-center">
              <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-linear-to-br from-purple-50 to-pink-50 shadow-lg shadow-purple-100/50 relative group">
                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                  <IconHeart className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500 drop-shadow-lg" strokeWidth={1.5} />
                </motion.div>
                <div className="absolute inset-0 bg-linear-to-br from-purple-400/20 to-pink-400/20 rounded-2xl sm:rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
              </div>
            </motion.div>

            <div className="space-y-2 sm:space-y-3 text-center">
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-900">
                Daftar Akun <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-500 to-pink-500">Baru</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 font-medium">Mulai buat undangan pernikahan digital Anda secara gratis</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-6 sm:px-10 pb-8 sm:pb-10">
            {/* Google Sign-Up Button - Show first */}
            {process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true" && (
              <>
                <Button
                  type="button"
                  onClick={handleGoogleSignUp}
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
                        <span>Daftar dengan Google</span>
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
                    <span className="bg-white/80 px-6 text-gray-400">Atau daftar dengan email</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-gray-600 ml-1">
                  Nama Lengkap
                </Label>
                <div className="relative">
                  <IconUser size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className="h-12 sm:h-14 pl-11 rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all text-sm sm:text-base font-medium bg-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>

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
                    className="h-12 sm:h-14 pl-11 rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all text-sm sm:text-base font-medium bg-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-600 ml-1">
                  Password
                </Label>
                <div className="relative">
                  <IconLock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className="h-12 sm:h-14 pl-11 pr-12 rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all text-sm sm:text-base bg-white/50 backdrop-blur-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" disabled={loading || googleLoading}>
                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5 pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div key={level} className={`h-1.5 flex-1 rounded-full transition-all ${level <= passwordStrength.strength ? passwordStrength.color : "bg-gray-200"}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-semibold ${passwordStrength.color.replace("bg-", "text-")}`}>{passwordStrength.label}</p>
                  </motion.div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-wider text-gray-600 ml-1">
                  Konfirmasi Password
                </Label>
                <div className="relative">
                  <IconLock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading || googleLoading}
                    className="h-12 sm:h-14 pl-11 pr-12 rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all text-sm sm:text-base bg-white/50 backdrop-blur-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={loading || googleLoading}
                  >
                    {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {confirmPassword.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-xs font-semibold pt-1">
                    {passwordsMatch ? (
                      <>
                        <IconCheck size={14} className="text-green-500" />
                        <span className="text-green-600">Password cocok</span>
                      </>
                    ) : (
                      <>
                        <IconX size={14} className="text-red-500" />
                        <span className="text-red-600">Password tidak cocok</span>
                      </>
                    )}
                  </motion.div>
                )}
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
                className="w-full h-12 sm:h-14 text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-xl shadow-purple-200 hover:shadow-2xl hover:shadow-purple-300 transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group"
                disabled={loading || googleLoading}
              >
                <div className="absolute inset-0 bg-linear-to-r from-purple-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <IconLoader2 size={18} className="animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Buat Akun Sekarang"
                  )}
                </span>
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="text-center mt-6 sm:mt-8">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                Sudah punya akun?{" "}
                <Link href="/login" className="font-black text-transparent bg-clip-text bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
