/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { IconHeart } from "@tabler/icons-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        setError(result.error.message || "Login failed");
        setLoading(false);
        return;
      }

      // Determine user role from the result
      // better-auth structure can vary slightly depending on how it's called
      const user = result.data?.user;
      const role = (user as any)?.role || "USER";

      // If user was redirected from a protected page, go back there
      const from = searchParams.get("from");

      let target = "/dashboard";
      if (from) {
        target = from;
      } else if (role === "ADMIN") {
        target = "/admin";
      }

      router.push(target);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
      <div className="h-1.5 bg-linear-to-r from-pink-400 to-purple-500 w-full" />
      <CardHeader className="space-y-4 pt-8 pb-6">
        <div className="flex justify-center">
          <div className="p-3 rounded-2xl bg-pink-50 shadow-inner">
            <IconHeart className="w-10 h-10 text-pink-500" />
          </div>
        </div>
        <div className="space-y-2 text-center text-balance">
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">
            Selamat Datang <span className="text-pink-500">Kembali</span>
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground font-medium">Masuk ke nika.id untuk mengelola undangan Anda</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-5">
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
              className="h-12 rounded-xl border-gray-200 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Password
              </Label>
              <Link href="#" className="text-xs font-medium text-pink-500 hover:text-pink-600">
                Lupa password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="h-12 rounded-xl border-gray-200 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
            />
          </div>

          {error && <div className="text-xs font-medium text-red-500 bg-red-50 p-3.5 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-1">{error}</div>}

          <Button type="submit" className="w-full h-12 text-md font-semibold rounded-xl bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg shadow-pink-200 transition-all" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </div>
            ) : (
              "Masuk ke Akun"
            )}
          </Button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
            <span className="bg-white/50 px-4 text-gray-400">Atau</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Belum punya akun?{" "}
            <Link href="/register" className="font-bold text-pink-500 hover:text-pink-600 transition-colors">
              Daftar Gratis
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
