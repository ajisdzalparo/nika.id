"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconFileSpreadsheet, IconPlus, IconTrash, IconUpload } from "@tabler/icons-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const EXPENSE_CATEGORIES = ["Server & hosting", "API AI", "Payment gateway", "Iklan & marketing", "Gaji & freelancer", "Domain & software", "Pajak", "Lainnya"];
const INCOME_CATEGORIES = ["Penjualan offline", "Agency / B2B", "Sponsor", "Lainnya"];

// File download, not a page: a plain <a> is correct here
const TEMPLATE_URL = "/api/admin/finance/template";
const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const field = "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-900";
const btn = "flex h-9 items-center gap-1.5 rounded-full border border-zinc-300 px-4 text-sm hover:bg-zinc-100";

type ImportResponse = { saved: boolean; rows: number; inserted: number; duplicates: number; income: number; expense: number; errors: { row: number; message: string }[]; errorCount: number; message?: string };

export function FinanceImportDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const send = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch(`/api/admin/finance/import${dryRun ? "?dryRun=1" : ""}`, { method: "POST", body });
      const j = (await res.json()) as ImportResponse;
      if (!res.ok) return toast.error(j.message || "Gagal membaca file");
      setResult(j);
      if (j.saved) {
        toast.success(`${j.inserted} baris tersimpan${j.duplicates ? `, ${j.duplicates} sudah ada sebelumnya` : ""}`);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    if (input.current) input.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (setOpen(o), o || reset())}>
      <DialogTrigger asChild>
        <button className={btn}>
          <IconUpload size={15} /> Impor Excel
        </button>
      </DialogTrigger>
      <DialogContent className="studio sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-(family-name:--font-landing-display) text-2xl font-medium">Impor pemasukan & pengeluaran</DialogTitle>
          <DialogDescription>Kolom: Tanggal, Jenis, Kategori, Jumlah, Keterangan. Baris yang sama tidak tercatat dua kali.</DialogDescription>
        </DialogHeader>

        <a href={TEMPLATE_URL} download className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 text-sm hover:bg-zinc-50">
          <IconFileSpreadsheet size={22} className="text-[#8A6A2F]" />
          <span>
            <span className="font-medium">Unduh template Excel</span>
            <span className="block text-xs text-zinc-500">Berisi contoh dan petunjuk pengisian</span>
          </span>
        </a>

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm hover:bg-zinc-50">
          <IconUpload size={20} className="text-zinc-500" />
          <span className="font-medium">{file ? file.name : "Pilih file .xlsx atau .csv"}</span>
          <span className="text-xs text-zinc-500">Maks. 5 MB, 2.000 baris</span>
          <input
            ref={input}
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="sr-only"
            onChange={(e) => (setFile(e.target.files?.[0] ?? null), setResult(null))}
          />
        </label>

        {result && (
          <div className="space-y-2 rounded-xl bg-zinc-50 p-3 text-sm">
            <p>
              {result.rows} baris valid · pemasukan <span className="font-medium tabular-nums">{rupiah(result.income)}</span> · pengeluaran{" "}
              <span className="font-medium tabular-nums">{rupiah(result.expense)}</span>
            </p>
            {result.saved && (
              <p className="font-medium">
                {result.inserted} baris tersimpan{result.duplicates ? `, ${result.duplicates} dilewati karena sudah ada` : ""}.
              </p>
            )}
            {result.errorCount > 0 && (
              <div>
                <p className="font-medium text-[#9C2F1F]">{result.errorCount} baris bermasalah, belum ada yang disimpan. Perbaiki lalu unggah lagi:</p>
                <ul className="mt-1 max-h-40 space-y-0.5 overflow-auto text-xs text-zinc-600">
                  {result.errors.map((e) => (
                    <li key={e.row}>
                      Baris {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button disabled={!file || busy} onClick={() => send(true)} className={`${btn} disabled:opacity-50`}>
            Cek dulu
          </button>
          <button disabled={!file || busy || result?.saved} onClick={() => send(false)} className="flex h-9 items-center rounded-full bg-zinc-900 px-5 text-sm text-zinc-50 disabled:opacity-50">
            {busy ? "Memproses…" : "Impor"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ManualEntryDialog() {
  const router = useRouter();
  const today = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const cats = kind === "EXPENSE" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount.replace(/\D/g, ""));
    if (!value) return toast.error("Isi jumlah");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/finance/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, date, category, amount: value, note: note || null }),
      });
      const j = await res.json();
      if (!res.ok) return toast.error(j.message || "Gagal menyimpan");
      toast.success(kind === "EXPENSE" ? "Pengeluaran dicatat" : "Pemasukan dicatat");
      setAmount("");
      setNote("");
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex h-9 items-center gap-1.5 rounded-full bg-zinc-900 px-4 text-sm text-zinc-50 hover:bg-zinc-800">
          <IconPlus size={15} /> Catat
        </button>
      </DialogTrigger>
      <DialogContent className="studio sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-(family-name:--font-landing-display) text-2xl font-medium">Catat pemasukan / pengeluaran</DialogTitle>
          <DialogDescription>Untuk biaya operasional atau pemasukan di luar aplikasi.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 rounded-full border border-zinc-200 p-0.5 text-sm">
            {(["EXPENSE", "INCOME"] as const).map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => (setKind(k), setCategory((k === "EXPENSE" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES)[0]))}
                className={`rounded-full py-1.5 ${kind === k ? "bg-zinc-900 text-zinc-50" : "text-zinc-600"}`}
              >
                {k === "EXPENSE" ? "Pengeluaran" : "Pemasukan"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5 text-sm">
              <span className="text-zinc-600">Tanggal</span>
              <input type="date" required value={date} max={today} onChange={(e) => setDate(e.target.value)} className={field} />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="text-zinc-600">Kategori</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}>
                {cats.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-600">Jumlah (Rp)</span>
            <input
              inputMode="numeric"
              required
              placeholder="350.000"
              value={amount}
              onChange={(e) => {
                const n = e.target.value.replace(/\D/g, "");
                setAmount(n ? Number(n).toLocaleString("id-ID") : "");
              }}
              className={`${field} tabular-nums`}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-600">Keterangan (opsional)</span>
            <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} className={field} placeholder="VPS bulan November" />
          </label>
          <button disabled={busy} className="h-10 w-full rounded-full bg-zinc-900 text-sm text-zinc-50 disabled:opacity-50">
            {busy ? "Menyimpan…" : "Simpan"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type Recent = { id: string; date: string; kind: "INCOME" | "EXPENSE"; manual: boolean; label: string; note: string | null; amount: number };

export function RecentEntries({ items }: { items: Recent[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const remove = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/finance/entries/${id}`, { method: "DELETE" });
      const j = await res.json();
      if (!res.ok) return toast.error(j.message || "Gagal menghapus");
      toast.success("Catatan dihapus");
      setDeleteId(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  if (!items.length) return <p className="mt-3 text-sm text-zinc-500">Belum ada transaksi di periode ini.</p>;
  return (
    <>
      <ul className="mt-3 max-h-[30rem] divide-y divide-zinc-100 overflow-y-auto">
        {items.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-2 text-sm">
                <span className="font-medium">{r.label}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">{r.manual ? "Manual" : "Aplikasi"}</span>
              </p>
              <p className="truncate text-xs text-zinc-500">
                {new Date(r.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })}
                {r.note && ` · ${r.note}`}
              </p>
            </div>
            <span className="shrink-0 text-sm font-medium tabular-nums">
              {r.kind === "EXPENSE" ? "−" : "+"}
              {rupiah(r.amount)}
            </span>
            <span className="w-8 shrink-0 text-right">
              {r.manual && (
                <button type="button" aria-label="Hapus catatan" disabled={busy === r.id} onClick={() => setDeleteId(r.id)} className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40">
                  <IconTrash size={15} />
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && busy === null && setDeleteId(null)}>
        <AlertDialogContent className="border-[#E6DFD3] bg-[#FFFDF9] text-[#15130F] sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-medium text-[#15130F]">
              Hapus catatan manual?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#5E574D]">
              Catatan pemasukan atau pengeluaran manual ini akan dihapus permanen dari buku besar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={busy !== null} className="rounded-full border-[#DFD7C8] bg-white text-[#3F3A33] hover:bg-[#FAF8F4]">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busy !== null}
              onClick={(e) => {
                e.preventDefault();
                if (deleteId) void remove(deleteId);
              }}
              className="rounded-full bg-red-600 text-white hover:bg-red-700"
            >
              {busy ? "Menghapus..." : "Ya, hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
