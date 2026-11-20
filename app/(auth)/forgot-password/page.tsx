"use client";

import { useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconCheck, IconLoader2, IconMail } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email: trimmed,
        redirectTo: "/reset-password",
      });

      if (error) {
        toast.error(error.message || "Gagal mengirim link reset password");
        return;
      }

      setSent(true);
      toast.success("Link reset password telah dikirim");
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba sesaat lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D8CBB8] bg-[#FFFDF9] text-[#8A6A2F]">
          <IconCheck size={22} stroke={1.8} />
        </div>

        <div className="space-y-2.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">
            Email Terkirim
          </p>
          <h1 className="font-serif text-[2.4rem] font-medium leading-tight tracking-tight text-zinc-900">
            Cek kotak masuk Anda
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600">
            Jika email <span className="font-medium text-zinc-900">{email}</span> terdaftar, kami telah mengirimkan tautan untuk mengatur ulang password Anda. Periksa juga folder spam jika belum masuk.
          </p>
        </div>

        <div className="grid gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSent(false)}
            className="h-11 rounded-full border-zinc-300 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Kirim ulang ke email lain
          </Button>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1E1B17] px-6 text-sm font-medium text-[#F7F3EC] transition-opacity hover:opacity-90"
          >
            <IconArrowLeft size={16} />
            Kembali ke halaman masuk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">
          Pemulihan Akun
        </p>
        <h1 className="font-serif text-[2.5rem] font-medium leading-tight tracking-tight text-zinc-900">
          Lupa Password?
        </h1>
        <p className="text-sm leading-relaxed text-zinc-500">
          Masukkan email yang terdaftar pada akun UNDANGIN YUK. Kami akan mengirimkan tautan untuk membuat password baru.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="forgot-email" className="text-sm font-medium text-zinc-700">
            Email Terdaftar
          </Label>
          <div className="relative">
            <IconMail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <Input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="h-11 rounded-xl border-zinc-200 bg-white pl-10 focus:border-primary focus:ring-primary"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-full bg-[#1E1B17] text-sm font-medium text-[#F7F3EC] shadow-sm transition-opacity hover:bg-[#2E2A24] hover:opacity-95"
        >
          {loading ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengirim tautan...
            </>
          ) : (
            "Kirim Tautan Reset Password"
          )}
        </Button>
      </form>

      <div className="pt-1 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
        >
          <IconArrowLeft size={15} />
          Kembali ke halaman masuk
        </Link>
      </div>
    </div>
  );
}
