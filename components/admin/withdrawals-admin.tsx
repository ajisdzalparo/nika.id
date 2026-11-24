"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconCheck, IconCopy, IconLoader2, IconX } from "@tabler/icons-react";
import { ImageUploadField } from "@/components/admin/image-upload-field";

export interface AdminWithdrawal {
  id: string;
  amount: number;
  method: string;
  provider: string;
  accountNumber: string;
  accountName: string;
  createdAt: string;
  user: { name: string | null; email: string };
}

const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

function Row({ w, onDone }: { w: AdminWithdrawal; onDone: () => void }) {
  const [mode, setMode] = useState<"idle" | "pay" | "reject">("idle");
  const [proof, setProof] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const act = async (action: "PAID" | "REJECTED") => {
    if (action === "REJECTED" && !note.trim()) return toast.error("Tulis alasan penolakan");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${w.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, proofUrl: proof || null, note: note || null }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j.message || "Gagal memproses");
      toast.success(action === "PAID" ? "Ditandai sudah ditransfer" : "Penarikan ditolak, saldo dikembalikan");
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="space-y-3 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-2xl lining-nums">{rupiah(w.amount)}</p>
          <p className="text-sm text-zinc-600">
            {w.user.name ?? w.user.email} · {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(w.createdAt))}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm">
            <span className="font-medium">{w.provider}</span> {w.accountNumber} · a.n. {w.accountName}
            <button type="button" onClick={() => navigator.clipboard?.writeText(w.accountNumber)} aria-label="Salin nomor" className="text-zinc-500 hover:text-zinc-900">
              <IconCopy size={14} />
            </button>
          </p>
        </div>
        {mode === "idle" && (
          <div className="flex gap-2">
            <button onClick={() => setMode("pay")} className="flex h-9 items-center gap-1.5 rounded-full bg-zinc-900 px-4 text-sm font-medium text-zinc-50">
              <IconCheck size={15} /> Sudah ditransfer
            </button>
            <button onClick={() => setMode("reject")} className="flex h-9 items-center gap-1.5 rounded-full border border-zinc-300 px-4 text-sm">
              <IconX size={15} /> Tolak
            </button>
          </div>
        )}
      </div>

      {mode !== "idle" && (
        <div className="space-y-3 rounded-xl bg-zinc-50 p-4">
          {mode === "pay" && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Bukti transfer (opsional)</p>
              <ImageUploadField value={proof} onChange={setProof} aspect="aspect-[3/4]" />
            </div>
          )}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={mode === "reject" ? "Alasan penolakan (dikirim ke user)" : "Catatan (opsional)"}
            className="h-20 w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-zinc-400"
          />
          <div className="flex gap-2">
            <button onClick={() => act(mode === "pay" ? "PAID" : "REJECTED")} disabled={busy} className="flex h-9 items-center gap-1.5 rounded-full bg-zinc-900 px-4 text-sm font-medium text-zinc-50 disabled:opacity-50">
              {busy && <IconLoader2 size={15} className="animate-spin" />} {mode === "pay" ? "Konfirmasi transfer" : "Tolak penarikan"}
            </button>
            <button onClick={() => setMode("idle")} className="h-9 rounded-full px-4 text-sm text-zinc-600">
              Batal
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export function WithdrawalsAdmin({ items }: { items: AdminWithdrawal[] }) {
  const router = useRouter();
  if (!items.length) return <p className="text-sm text-zinc-500">Tidak ada penarikan yang menunggu.</p>;
  return (
    <ul className="divide-y divide-zinc-100">
      {items.map((w) => (
        <Row key={w.id} w={w} onDone={() => router.refresh()} />
      ))}
    </ul>
  );
}
