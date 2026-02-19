"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, signIn } from "@/lib/auth-client";
import { IconBrandGoogle, IconEye, IconEyeOff, IconLoader2, IconCheck, IconX, IconMail, IconLock, IconUser } from "@tabler/icons-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
  if (password.length < 8) return { strength: 1, label: "Lemah", color: "bg-red-500 text-red-500" };
  if (password.length < 12 && !/[A-Z]/.test(password)) return { strength: 2, label: "Sedang", color: "bg-yellow-500 text-yellow-500" };
  if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { strength: 3, label: "Baik", color: "bg-blue-500 text-blue-500" };
  return { strength: 4, label: "Kuat", color: "bg-green-500 text-green-500" };
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Password tidak cocok");
      return;
    }

    if (password.length < 8) {
      toast.error("Password minimal 8 karakter");
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
        toast.error(result.error.message || "Registrasi gagal");
        setLoading(false);
        return;
      }

      router.push("/verification-sent?email=" + encodeURIComponent(email));
    } catch {
      toast.error("Terjadi kesalahan yang tidak terduga");
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);

    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch {
      toast.error("Gagal mendaftar dengan Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">Buat Akun Baru</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Mulai perjalanan pernikahan digital Anda di sini.</p>
      </div>

      <div className="space-y-6">
        {process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true" && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignUp}
              disabled={loading || googleLoading}
              className="w-full h-12 text-zinc-700 dark:text-zinc-300 font-medium border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg"
            >
              {googleLoading ? <IconLoader2 className="w-5 h-5 animate-spin mr-2" /> : <IconBrandGoogle className="w-5 h-5 mr-2" />}
              Daftar dengan Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-400 font-medium">Atau dengan email</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nama Lengkap
            </Label>
            <div className="relative">
              <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading || googleLoading}
                className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-primary focus:border-primary rounded-lg"
              />
            </div>
          </div>

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
                className="pl-10 h-11 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-primary focus:border-primary rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Password
            </Label>
            <div className="relative">
              <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || googleLoading}
                className="pl-10 pr-10 h-11 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-primary focus:border-primary rounded-lg"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors" tabIndex={-1}>
                {showPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5 pt-1">
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div key={level} className={`flex-1 rounded-full transition-all duration-300 ${level <= passwordStrength.strength ? passwordStrength.color.split(" ")[0] : "bg-zinc-100 dark:bg-zinc-800"}`} />
                  ))}
                </div>
                <p className={`text-xs font-medium text-right ${passwordStrength.color.split(" ")[1]}`}>{passwordStrength.label}</p>
              </motion.div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Konfirmasi Password
            </Label>
            <div className="relative">
              <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || googleLoading}
                className="pl-10 pr-10 h-11 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-primary focus:border-primary rounded-lg"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors" tabIndex={-1}>
                {showConfirmPassword ? <IconEyeOff className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-xs font-medium pt-1">
                {passwordsMatch ? (
                  <>
                    <IconCheck className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-600">Password cocok</span>
                  </>
                ) : (
                  <>
                    <IconX className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-red-600">Password tidak cocok</span>
                  </>
                )}
              </motion.div>
            )}
          </div>

          <Button type="submit" className="w-full h-11 rounded-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all mt-6" disabled={loading || googleLoading}>
            {loading ? (
              <>
                <IconLoader2 className="w-5 h-5 animate-spin mr-2" />
                Memproses...
              </>
            ) : (
              "Buat Akun"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/90 transition-colors">
            Masuk Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
