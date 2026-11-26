"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IconArrowLeft, IconLoader2, IconMail } from "@tabler/icons-react";
import { authClient } from "@/lib/auth-client";

function VerificationSentContent() {
  const email = useSearchParams().get("email") || "";
  const [cooldown, setCooldown] = useState(0);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    if (!email) return;
    setState("sending");
    const { error } = await authClient.sendVerificationEmail({ email });
    setState(error ? "error" : "sent");
    if (!error) setCooldown(60);
  };

  return (
    <div className="space-y-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#E9DDC6] bg-white">
        <IconMail size={26} stroke={1.5} className="text-[#8A6424]" />
      </div>

      <div className="space-y-3">
        <h1 className="font-serif text-[2.6rem] font-medium leading-tight">Cek email kalian</h1>
        <p className="leading-relaxed text-zinc-600">
          Kami mengirim link verifikasi ke {email ? <strong className="font-medium text-zinc-900">{email}</strong> : "email kalian"}. Buka email tersebut dan klik <em>Verifikasi Email Saya</em> untuk melanjutkan.
        </p>
      </div>

      <ol className="space-y-3 border-y border-zinc-200 py-5 text-[15px] text-zinc-700">
        {["Buka kotak masuk email", "Cari email dari SatuMoment (cek juga folder spam)", "Klik tombol verifikasi"].map((s, i) => (
          <li key={s} className="flex gap-4">
            <span className="font-serif text-xl italic leading-none text-[#8A6424]">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-100">
            Buka Gmail
          </a>
          <a href="https://outlook.live.com" target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center rounded-full border border-zinc-300 bg-white text-sm font-medium text-zinc-800 hover:bg-zinc-100">
            Buka Outlook
          </a>
        </div>
        <button
          onClick={resend}
          disabled={!email || state === "sending" || cooldown > 0}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-900 text-sm font-medium text-zinc-50 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {state === "sending" && <IconLoader2 size={18} className="animate-spin" />}
          {cooldown > 0 ? `Kirim ulang dalam ${cooldown} detik` : "Kirim ulang email"}
        </button>
        {state === "sent" && <p className="text-center text-sm text-emerald-700">Email verifikasi sudah dikirim ulang.</p>}
        {state === "error" && <p className="text-center text-sm text-red-700">Gagal mengirim ulang. Coba beberapa saat lagi.</p>}
      </div>

      <Link href="/login" className="inline-flex min-h-11 items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
        <IconArrowLeft size={16} /> Kembali ke halaman masuk
      </Link>
    </div>
  );
}

export default function VerificationSentPage() {
  return (
    <Suspense fallback={<IconLoader2 className="mx-auto h-6 w-6 animate-spin text-zinc-400" />}>
      <VerificationSentContent />
    </Suspense>
  );
}
