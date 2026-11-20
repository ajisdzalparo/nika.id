"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconAlertCircle, IconCircleCheck, IconLoader2 } from "@tabler/icons-react";
import { authClient } from "@/lib/auth-client";

function VerifyEmailContent() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">(token ? "verifying" : "error");
  const [message, setMessage] = useState(token ? "" : "Token verifikasi tidak ditemukan.");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authClient.verifyEmail({ query: { token } }).then(({ error }) => {
      if (cancelled) return;
      if (error) {
        setStatus("error");
        setMessage(error.message || "Link verifikasi tidak valid atau sudah kedaluwarsa.");
        return;
      }
      setStatus("success");
      setTimeout(() => router.push("/dashboard"), 2500);
    });
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (status === "verifying") {
    return (
      <div className="space-y-4">
        <IconLoader2 size={28} className="animate-spin text-[#8A6A2F]" />
        <h1 className="font-serif text-[2.6rem] font-medium leading-tight">Memverifikasi email…</h1>
        <p className="text-zinc-600">Mohon tunggu sebentar.</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-6">
        <IconCircleCheck size={32} stroke={1.5} className="text-emerald-700" />
        <div className="space-y-3">
          <h1 className="font-serif text-[2.6rem] font-medium leading-tight">Email terverifikasi</h1>
          <p className="text-zinc-600">Terima kasih. Kalian akan diarahkan ke dashboard sebentar lagi.</p>
        </div>
        <Link href="/dashboard" className="flex h-12 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-zinc-50 hover:opacity-90">
          Lanjut ke dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <IconAlertCircle size={32} stroke={1.5} className="text-red-700" />
      <div className="space-y-3">
        <h1 className="font-serif text-[2.6rem] font-medium leading-tight">Verifikasi gagal</h1>
        <p className="text-zinc-600">{message} Silakan masuk untuk meminta link baru.</p>
      </div>
      <div className="grid gap-2">
        <Link href="/login" className="flex h-12 items-center justify-center rounded-full bg-zinc-900 text-sm font-medium text-zinc-50 hover:opacity-90">
          Ke halaman masuk
        </Link>
        <Link href="/register" className="flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-100">
          Daftar ulang
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<IconLoader2 className="mx-auto h-6 w-6 animate-spin text-zinc-400" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
