"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconEye, IconEyeOff, IconLoader2, IconLock, IconMail, IconShieldLock } from "@tabler/icons-react";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const field =
  "h-12 rounded-xl border-[#E3D3B4] bg-white pl-11 text-[15px] text-[#1F1A14] placeholder:text-[#A89B85] focus-visible:border-[#8A6424] focus-visible:ring-[#8A6424]/20";

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(params.get("ditolak") ? "Akun ini tidak punya akses admin." : "");

  const denied = Boolean(params.get("ditolak"));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: err } = await signIn.email({ email, password });
    if (err) {
      setLoading(false);
      return setError(err.message || "Email atau password salah.");
    }
    if ((data?.user as { role?: string } | undefined)?.role?.toLowerCase() !== "admin") {
      // Do not keep a non-admin signed in from the admin page
      await signOut();
      setLoading(false);
      return setError("Akun ini tidak punya akses admin.");
    }
    const gateRes = await fetch("/api/portal/enter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portal: "admin" }),
    });
    if (!gateRes.ok) {
      setLoading(false);
      return setError("Gagal memverifikasi sesi admin.");
    }
    router.replace("/admin");
    router.refresh();
  };

  const switchAccount = async () => {
    await fetch("/api/portal/enter?portal=admin", { method: "DELETE" }).catch(() => {});
    await signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#E3D3B4] bg-[#F4EDDF]">
          <IconShieldLock size={22} className="text-[#8A6424]" />
        </span>
        <h1 className="whitespace-nowrap font-(family-name:--font-landing-display) text-3xl font-medium leading-tight text-[#1F1A14] sm:text-4xl">
          Masuk panel admin
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6B5F4D]">Kelola template, pengguna, transaksi, dan moderasi.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-[#EBC4BA] bg-[#FBEDE8] px-4 py-3 text-sm text-[#9A3B2A]">
          {error}
          {denied && session && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-medium">
              <Link href="/dashboard" className="underline underline-offset-4">
                Ke dashboard user
              </Link>
              <button onClick={switchAccount} className="underline underline-offset-4">
                Ganti akun
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-email" className="text-sm font-medium text-[#3D342A]">
            Email
          </Label>
          <div className="relative">
            <IconMail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A89B85]" />
            <Input
              id="admin-email"
              className={field}
              type="email"
              autoComplete="username"
              placeholder="admin@satumoment.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-password" className="text-sm font-medium text-[#3D342A]">
            Password
          </Label>
          <div className="relative">
            <IconLock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A89B85]" />
            <Input
              id="admin-password"
              className={`${field} pr-12`}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#A89B85] transition-colors hover:text-[#8A6424]"
            >
              {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>
        </div>
        <Button type="submit" variant="gold" disabled={loading} className="mt-2 h-12 w-full text-[15px]">
          {loading ? <IconLoader2 size={18} className="animate-spin" /> : <IconShieldLock size={18} />} Masuk ke panel
        </Button>
      </form>

      <p className="border-t border-[#EFE5D3] pt-5 text-center text-sm text-[#6B5F4D]">
        Bukan admin?{" "}
        <Link href="/login" className="font-medium text-[#8A6424] underline-offset-4 hover:underline">
          Masuk sebagai pengguna
        </Link>
      </p>
    </div>
  );
}
