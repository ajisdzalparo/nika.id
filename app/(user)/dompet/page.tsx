"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconBrandWhatsapp,
  IconCheck,
  IconCopy,
  IconLoader2,
  IconPencil,
  IconShare,
  IconWallet,
} from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";

interface ReferralSummary {
  code: string;
  signups: number;
  conversions: number;
  totalCommission: number;
}

interface Entry {
  id: string;
  type: string;
  source: string | null;
  amount: number;
  availableAt: string | null;
  note: string | null;
  createdAt: string;
}
interface Withdrawal {
  id: string;
  amount: number;
  method: string;
  provider: string;
  accountNumber: string;
  accountName: string;
  status: "PENDING" | "PAID" | "REJECTED";
  adminNote: string | null;
  proofUrl: string | null;
  createdAt: string;
}

const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const date = (s: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(s));

const TYPE_LABEL: Record<string, string> = {
  COMMISSION: "Komisi referral",
  SALE_SHARE: "Penjualan template",
  WITHDRAWAL: "Penarikan",
  WITHDRAWAL_REVERSAL: "Penarikan ditolak (dikembalikan)",
  ADJUSTMENT: "Penyesuaian",
};
const STATUS: Record<Withdrawal["status"], { label: string; cls: string }> = {
  PENDING: { label: "Diproses", cls: "bg-[#F4EAD6] text-[#6E5426]" },
  PAID: { label: "Sudah ditransfer", cls: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Ditolak", cls: "bg-red-50 text-red-700" },
};

const field = "h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-[15px] outline-none focus:border-zinc-400 focus:ring-2 focus:ring-[#8A6A2F]/20";

export default function DompetPage() {
  const [data, setData] = useState<{ balance: { available: number; pending: number }; entries: Entry[]; withdrawals: Withdrawal[]; minWithdrawal: number } | null>(null);
  const [referral, setReferral] = useState<ReferralSummary | null>(null);
  const [editingCode, setEditingCode] = useState(false);
  const [draftCode, setDraftCode] = useState("");
  const [savingCode, setSavingCode] = useState(false);
  const [form, setForm] = useState({ amount: "", method: "BANK" as "BANK" | "EWALLET", provider: "", accountNumber: "", accountName: "" });
  const [sending, setSending] = useState(false);

  const load = () => {
    fetch("/api/user/wallet")
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("Gagal memuat dompet"));
    fetch("/api/user/referral")
      .then((r) => (r.ok ? r.json() : null))
      .then((r) => {
        if (r?.code) {
          setReferral(r);
          setDraftCode(r.code);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = referral ? `${origin}/?ref=${referral.code}` : "";

  const saveReferralCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCode(true);
    try {
      const res = await fetch("/api/user/referral", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: draftCode }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.message || "Gagal mengubah kode referral");
        return;
      }
      setReferral((prev) => (prev ? { ...prev, code: j.code } : prev));
      setDraftCode(j.code);
      setEditingCode(false);
      toast.success("Kode referral diperbarui!");
    } finally {
      setSavingCode(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/user/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount.replace(/\D/g, "")) }),
      });
      const j = await res.json();
      if (!res.ok) return toast.error(j.message || "Gagal mengajukan penarikan");
      toast.success("Penarikan diajukan. Admin akan memprosesnya.");
      setForm((f) => ({ ...f, amount: "" }));
      load();
    } finally {
      setSending(false);
    }
  };

  const hasOpen = data?.withdrawals.some((w) => w.status === "PENDING");
  const canWithdraw = Boolean(data && data.balance.available >= data.minWithdrawal && !hasOpen);

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <header className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">Dompet</p>
            <h2 className="font-serif text-5xl font-medium">Saldo & penarikan</h2>
            <p className="max-w-2xl text-zinc-600">Pemasukan dari komisi referral dan penjualan template masuk ke sini, lalu bisa ditarik ke rekening atau e-wallet.</p>
          </header>

          {!data ? (
            <div className="flex justify-center py-20">
              <IconLoader2 className="animate-spin text-zinc-400" />
            </div>
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-zinc-950 p-6 text-zinc-50">
                  <p className="flex items-center gap-2 text-sm text-zinc-400">
                    <IconWallet size={17} className="text-[#C9A45C]" /> Bisa ditarik
                  </p>
                  <p className="mt-3 font-serif text-5xl lining-nums">{rupiah(data.balance.available)}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                  <p className="text-sm text-zinc-500">Masih ditahan</p>
                  <p className="mt-3 font-serif text-5xl lining-nums text-zinc-800">{rupiah(data.balance.pending)}</p>
                  <p className="mt-2 text-xs text-zinc-500">Pemasukan baru ditahan beberapa hari (masa refund) sebelum bisa ditarik.</p>
                </div>
              </section>

              {/* Program Referral */}
              {referral && (
                <section id="referral" className="rounded-2xl border border-[#DFD2BC] bg-[#FFFDF9] p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
                    <div className="space-y-2">
                      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">
                        <IconShare size={14} /> Program Referral
                      </p>
                      <h3 className="font-serif text-2xl font-medium text-[#15130F] sm:text-3xl">
                        Bagikan link, teman hemat 10%, kamu dapat komisi 15%
                      </h3>
                      <p className="max-w-xl text-sm text-[#5E574D]">
                        Setiap teman yang mendaftar atau checkout dengan kodemu mendapat diskon 10% (maks Rp15.000), dan 15% dari transaksi mereka (maks Rp100.000 per transaksi, di luar top-up Kredit AI) masuk ke Dompet ini.
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#5E574D]">
                        <span>
                          <strong className="font-serif text-lg tabular-nums text-[#15130F]">{referral.signups}</strong> teman daftar
                        </span>
                        <span>·</span>
                        <span>
                          <strong className="font-serif text-lg tabular-nums text-[#15130F]">{referral.conversions}</strong> transaksi berhasil
                        </span>
                        <span>·</span>
                        <span>
                          Total komisi <strong className="font-serif text-lg tabular-nums text-[#8A6A2F]">{rupiah(referral.totalCommission)}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="w-full space-y-3 rounded-xl border border-[#E6DFD3] bg-white p-4 xl:w-[390px] xl:shrink-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#6B6358]">Kode Referral Kamu</span>
                        {!editingCode && (
                          <button
                            type="button"
                            onClick={() => setEditingCode(true)}
                            className="-mr-2 inline-flex min-h-9 items-center gap-1 rounded-full px-2 text-xs font-medium text-[#8A6A2F] hover:bg-[#F3EEE5]"
                          >
                            <IconPencil size={13} /> Ubah kode
                          </button>
                        )}
                      </div>

                      {editingCode ? (
                        <form onSubmit={saveReferralCode} className="space-y-2">
                          <input
                            value={draftCode}
                            onChange={(e) => setDraftCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16))}
                            className="h-11 w-full min-w-0 rounded-xl border border-[#DFD7C8] bg-[#FAF8F4] px-3.5 font-mono text-base font-semibold uppercase tracking-widest text-[#15130F] outline-none focus:border-[#8A6A2F]"
                            placeholder="MISAL2026"
                            aria-label="Kode referral baru"
                            minLength={4}
                            autoFocus
                            required
                          />
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] text-[#7D7468]">4–16 huruf atau angka</p>
                            <div className="flex shrink-0 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCode(false);
                                  setDraftCode(referral.code);
                                }}
                                className="h-10 rounded-full px-3.5 text-xs font-medium text-[#6B6358] hover:bg-[#F3EEE5]"
                              >
                                Batal
                              </button>
                              <button
                                type="submit"
                                disabled={savingCode || draftCode.length < 4}
                                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#15130F] px-4 text-xs font-medium text-[#FAF8F4] disabled:opacity-40"
                              >
                                {savingCode ? <IconLoader2 size={14} className="animate-spin" /> : <IconCheck size={14} />}
                                Simpan
                              </button>
                            </div>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between gap-2 rounded-xl border border-[#EFEAE0] bg-[#FAF8F4] px-3.5 py-2.5">
                          <span className="font-mono text-base font-bold tracking-widest text-[#15130F]">{referral.code}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(referral.code);
                              toast.success("Kode referral disalin");
                            }}
                            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-[#DFD7C8] bg-white px-3 text-xs font-medium text-[#15130F] hover:bg-[#F3EEE5]"
                          >
                            <IconCopy size={13} /> Salin Kode
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(referralLink);
                            toast.success("Link referral disalin!");
                          }}
                          className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#15130F] px-4 text-xs font-medium text-[#FAF8F4] hover:bg-[#2A261F]"
                        >
                          <IconCopy size={14} /> Salin Link
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Lagi cari undangan pernikahan digital yang elegan? Coba UNDANGIN YUK — buka ${referralLink} atau pakai kode ${referral.code} biar langsung dapat diskon 10%!`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#DFD7C8] bg-white px-4 text-xs font-medium text-[#15130F] hover:bg-[#F3EEE5]"
                        >
                          <IconBrandWhatsapp size={15} className="text-[#1F9D55]" /> Bagikan WA
                        </a>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <section className="space-y-6">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
                    <h3 className="font-serif text-2xl">Riwayat penarikan</h3>
                    {data.withdrawals.length ? (
                      <ul className="mt-4 divide-y divide-zinc-100">
                        {data.withdrawals.map((w) => (
                          <li key={w.id} className="flex items-start justify-between gap-4 py-3">
                            <div className="min-w-0">
                              <p className="font-medium lining-nums">{rupiah(w.amount)}</p>
                              <p className="truncate text-sm text-zinc-500">
                                {w.provider} · {w.accountNumber} · {date(w.createdAt)}
                              </p>
                              {w.adminNote && <p className="mt-1 text-sm text-zinc-600">Catatan admin: {w.adminNote}</p>}
                              {w.proofUrl && (
                                <a href={w.proofUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-[#8A6A2F] underline underline-offset-4">
                                  Lihat bukti transfer
                                </a>
                              )}
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${STATUS[w.status].cls}`}>{STATUS[w.status].label}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-zinc-500">Belum ada penarikan.</p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
                    <h3 className="font-serif text-2xl">Riwayat saldo</h3>
                    {data.entries.length ? (
                      <ul className="mt-4 divide-y divide-zinc-100">
                        {data.entries.map((e) => {
                          const held = e.availableAt && new Date(e.availableAt) > new Date();
                          return (
                            <li key={e.id} className="flex items-center justify-between gap-4 py-3">
                              <div className="flex min-w-0 items-center gap-3">
                                {e.amount >= 0 ? <IconArrowDownRight size={18} className="shrink-0 text-emerald-600" /> : <IconArrowUpRight size={18} className="shrink-0 text-zinc-500" />}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{TYPE_LABEL[e.type] ?? e.type}</p>
                                  <p className="text-xs text-zinc-500">
                                    {date(e.createdAt)}
                                    {held ? ` · bisa ditarik ${date(e.availableAt!)}` : ""}
                                  </p>
                                </div>
                              </div>
                              <span className={`shrink-0 text-sm font-medium lining-nums ${e.amount >= 0 ? "text-emerald-700" : "text-zinc-700"}`}>
                                {e.amount >= 0 ? "+" : "−"}
                                {rupiah(Math.abs(e.amount))}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-zinc-500">Belum ada pemasukan. Komisi referral dan penjualan template akan muncul di sini.</p>
                    )}
                  </div>
                </section>

                <aside className="xl:sticky xl:top-20 xl:self-start">
                  <form onSubmit={submit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
                    <h3 className="font-serif text-2xl">Tarik saldo</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["BANK", "Rekening bank"],
                          ["EWALLET", "E-wallet"],
                        ] as const
                      ).map(([k, l]) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, method: k }))}
                          className={`h-10 rounded-full border text-sm ${form.method === k ? "border-zinc-900 bg-zinc-900 text-zinc-50" : "border-zinc-200 text-zinc-600"}`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                    <label className="block space-y-1.5"><span className="block text-xs font-medium text-[#6B6358]">{form.method === "BANK" ? "Bank" : "E-wallet"}</span>
                      <input className={field} placeholder={form.method === "BANK" ? "Contoh: BCA" : "Contoh: GoPay"} value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} required />
                    </label>
                    <label className="block space-y-1.5"><span className="block text-xs font-medium text-[#6B6358]">{form.method === "BANK" ? "Nomor rekening" : "Nomor HP e-wallet"}</span>
                      <input className={field} inputMode="numeric" value={form.accountNumber} onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))} required />
                    </label>
                    <label className="block space-y-1.5"><span className="block text-xs font-medium text-[#6B6358]">Nama pemilik</span>
                      <input className={field} placeholder="Sesuai buku tabungan / akun" value={form.accountName} onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))} required />
                    </label>
                    <input
                      className={field}
                      aria-label={`Jumlah penarikan, minimal ${rupiah(data.minWithdrawal)}`}
                      placeholder={`Jumlah (min ${rupiah(data.minWithdrawal)})`}
                      inputMode="numeric"
                      value={form.amount ? Number(form.amount.replace(/\D/g, "") || 0).toLocaleString("id-ID") : ""}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/\D/g, "") }))}
                      required
                    />
                    <button type="submit" disabled={!canWithdraw || sending} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-900 text-sm font-medium text-zinc-50 disabled:opacity-50">
                      {sending && <IconLoader2 size={16} className="animate-spin" />} Ajukan penarikan
                    </button>
                    <p className="text-xs text-zinc-500">
                      {hasOpen
                        ? "Masih ada penarikan yang diproses. Tunggu selesai sebelum mengajukan lagi."
                        : data.balance.available < data.minWithdrawal
                          ? `Penarikan bisa diajukan setelah saldo mencapai ${rupiah(data.minWithdrawal)}.`
                          : "Admin akan mentransfer dan mengunggah bukti transfer."}
                    </p>
                  </form>
                </aside>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
