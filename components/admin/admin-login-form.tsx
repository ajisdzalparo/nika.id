"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconEye, IconEyeOff, IconLoader2, IconLock, IconShieldLock } from "@tabler/icons-react";
import { signIn, signOut, useSession } from "@/lib/auth-client";

const field = "h-12 w-full rounded-xl border border-[#3A352C] bg-[#1B1915] px-4 text-[15px] text-[#F3EBDD] outline-none transition placeholder:text-[#6F675B] focus:border-[#C9A45C] focus:ring-2 focus:ring-[#C9A45C]/25";

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
    <div className="space-y-8">
      <div className="space-y-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#3A352C]">
          <IconShieldLock size={22} className="text-[#C9A45C]" />
        </span>
        <h1 className="font-(family-name:--font-landing-display) text-[2.6rem] font-medium leading-tight">Masuk panel admin</h1>
        <p className="text-[15px] text-[#B8AD9A]">Kelola template, pengguna, transaksi, dan moderasi.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-[#5A2A22] bg-[#2A1714] px-4 py-3 text-sm text-[#F2B8AC]">
          {error}
          {denied && session && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
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

      <form onSubmit={submit} className="space-y-3">
        <input className={field} type="email" autoComplete="username" placeholder="Email admin" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div className="relative">
          <input
            className={`${field} pr-12`}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#8C8272] transition-colors hover:text-[#F3EBDD]"
          >
            {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
          </button>
        </div>
        <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#F3EBDD] text-[15px] font-medium text-[#15130F] transition-opacity hover:opacity-90 disabled:opacity-60">
          {loading ? <IconLoader2 size={18} className="animate-spin" /> : <IconLock size={17} />} Masuk
        </button>
      </form>

      <p className="text-center text-sm text-[#8C8272]">
        Bukan admin?{" "}
        <Link href="/login" className="text-[#C9A45C] underline-offset-4 hover:underline">
          Masuk sebagai pengguna
        </Link>
      </p>
    </div>
  );
}
