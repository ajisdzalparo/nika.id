"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";
import { IconHeart } from "@tabler/icons-react";

// Helper function to generate slug
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
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
      // Generate unique invitation slug from name
      const slug = generateSlug(name) + "-" + Date.now().toString().slice(-4);

      const result = await signUp.email({
        email,
        password,
        name,
        // @ts-expect-error - better-auth will handle additional fields
        invitationSlug: slug,
        role: "USER",
      });

      if (result.error) {
        setError(result.error.message || "Registration failed");
        setLoading(false);
        return;
      }

      // Redirect to dashboard on success
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="h-1.5 bg-linear-to-r from-purple-400 to-pink-500 w-full" />
      <CardHeader className="space-y-4 pt-8 pb-6">
        <div className="flex justify-center">
          <div className="p-3 rounded-2xl bg-purple-50 shadow-inner">
            <IconHeart className="w-10 h-10 text-purple-500" />
          </div>
        </div>
        <div className="space-y-2 text-center text-balance">
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">
            Daftar Akun <span className="text-purple-500">Baru</span>
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground font-medium">Mulai buat undangan pernikahan digital Anda secara gratis</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
              Nama Lengkap
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="h-11 rounded-xl border-gray-200 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium placeholder:font-normal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="h-11 rounded-xl border-gray-200 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium placeholder:font-normal"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11 rounded-xl border-gray-200 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
                Konfirmasi
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Ulangi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11 rounded-xl border-gray-200 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          {error && <div className="text-xs font-medium text-red-500 bg-red-50 p-3.5 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-1">{error}</div>}

          <Button type="submit" className="w-full h-12 text-md font-semibold rounded-xl bg-linear-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-200 transition-all mt-2" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </div>
            ) : (
              "Buat Akun Sekarang"
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
            <span className="bg-white/50 px-4 text-gray-400">Atau</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 font-medium">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-bold text-purple-500 hover:text-purple-600 transition-colors">
              Masuk di sini
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
