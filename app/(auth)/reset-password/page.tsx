"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconLock,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (errorParam || !token) {
    return (
      <div className="space-y-6">
        <IconAlertCircle size={32} stroke={1.6} className="text-red-700" />
        <div className="space-y-2.5">
          <h1 className="font-serif text-[2.4rem] font-medium leading-tight tracking-tight text-zinc-900">
            Tautan tidak valid
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600">
            Tautan reset password ini tidak ditemukan, sudah digunakan, atau telah kedaluwarsa. Silakan ajukan permintaan reset password baru.
          </p>
        </div>
        <div className="grid gap-3">
          <Link
            href="/forgot-password"
            className="flex h-11 items-center justify-center rounded-full bg-[#1F1A14] text-sm font-medium text-[#FCF8F1] hover:opacity-90"
          >
            Minta Tautan Baru
          </Link>
          <Link
            href="/login"
            className="flex h-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Kembali ke halaman masuk
          </Link>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="space-y-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D8CBB8] bg-[#FFFDF9] text-emerald-700">
          <IconCheck size={22} stroke={1.8} />
        </div>
        <div className="space-y-2.5">
          <h1 className="font-serif text-[2.4rem] font-medium leading-tight tracking-tight text-zinc-900">
            Password diperbarui
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600">
            Password baru Anda sudah aktif. Silakan masuk menggunakan password terbaru Anda.
          </p>
        </div>
        <Link
          href="/login"
          className="flex h-11 items-center justify-center rounded-full bg-[#1F1A14] text-sm font-medium text-[#FCF8F1] hover:opacity-90"
        >
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.resetPassword({
        newPassword,
        token,
      });

      if (error) {
        toast.error(error.message || "Gagal memperbarui password");
        return;
      }

      setCompleted(true);
      toast.success("Password berhasil diperbarui");
      setTimeout(() => router.push("/login"), 2200);
    } catch {
      toast.error("Terjadi kesalahan yang tidak terduga");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6424]">
          Keamanan Akun
        </p>
        <h1 className="font-serif text-[2.5rem] font-medium leading-tight tracking-tight text-zinc-900">
          Buat Password Baru
        </h1>
        <p className="text-sm leading-relaxed text-zinc-500">
          Masukkan password baru minimal 8 karakter untuk akun Anda.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-sm font-medium text-zinc-700">
            Password Baru
          </Label>
          <div className="relative">
            <IconLock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <Input
              id="new-password"
              type={showNew ? "text" : "password"}
              required
              minLength={8}
              placeholder="Minimal 8 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              className="h-11 rounded-xl border-zinc-200 bg-white pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              tabIndex={-1}
            >
              {showNew ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-sm font-medium text-zinc-700">
            Konfirmasi Password Baru
          </Label>
          <div className="relative">
            <IconLock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <Input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              required
              minLength={8}
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="h-11 rounded-xl border-zinc-200 bg-white pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              tabIndex={-1}
            >
              {showConfirm ? (
                <IconEyeOff className="h-5 w-5" />
              ) : (
                <IconEye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="mt-2 h-11 w-full rounded-full bg-[#1F1A14] text-sm font-medium text-[#FCF8F1] hover:bg-[#2E2A24]"
        >
          {loading ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan password...
            </>
          ) : (
            "Simpan Password Baru"
          )}
        </Button>
      </form>

      <div className="text-center">
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <IconLoader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
