"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconBrandGoogle, IconLoader2, IconLock, IconShieldLock } from "@tabler/icons-react";
import { signIn, signOut, useSession } from "@/lib/auth-client";

const field = "h-12 w-full rounded-xl border border-[#3A352C] bg-[#1B1915] px-4 text-[15px] text-[#F3EBDD] outline-none transition placeholder:text-[#6F675B] focus:border-[#C9A45C] focus:ring-2 focus:ring-[#C9A45C]/25";

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState(params.get("ditolak") ? "Akun ini tidak punya akses admin." : params.get("error") ? "Masuk dengan Google gagal. Coba lagi." : "");

  const denied = Boolean(params.get("ditolak"));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("email");
    setError("");
    const { data, error: err } = await signIn.email({ email, password });
    if (err) {
      setLoading(null);
      return setError(err.message || "Email atau password salah.");
    }
    if ((data?.user as { role?: string } | undefined)?.role?.toLowerCase() !== "admin") {
      // Do not keep a non-admin signed in from the admin page
      await signOut();
      setLoading(null);
      return setError("Akun ini tidak punya akses admin.");
    }
    router.replace("/admin");
    router.refresh();
  };

  const google = async () => {
    setLoading("google");
    setError("");
    // The admin layout checks the role and sends non-admins back here with ?ditolak=1
    const res = await signIn.social({ provider: "google", callbackURL: "/admin", errorCallbackURL: "/admin/login?error=google" });
    if (res?.error) {
      setLoading(null);
      setError(res.error.message || "Masuk dengan Google gagal.");
    }
  };

  const switchAccount = async () => {
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
        <input className={field} type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading !== null} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#F3EBDD] text-[15px] font-medium text-[#15130F] transition-opacity hover:opacity-90 disabled:opacity-60">
          {loading === "email" ? <IconLoader2 size={18} className="animate-spin" /> : <IconLock size={17} />} Masuk
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#6F675B]">
        <span className="h-px flex-1 bg-[#2E2A23]" /> atau <span className="h-px flex-1 bg-[#2E2A23]" />
      </div>

      <button onClick={google} disabled={loading !== null} className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#3A352C] text-[15px] font-medium transition-colors hover:bg-[#1B1915] disabled:opacity-60">
        {loading === "google" ? <IconLoader2 size={18} className="animate-spin" /> : <IconBrandGoogle size={18} />} Masuk dengan Google
      </button>

      <p className="text-center text-sm text-[#8C8272]">
        Bukan admin?{" "}
        <Link href="/login" className="text-[#C9A45C] underline-offset-4 hover:underline">
          Masuk sebagai pengguna
        </Link>
      </p>
    </div>
  );
}
