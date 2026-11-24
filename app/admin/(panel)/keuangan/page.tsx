import Link from "next/link";
import { IconArrowDownRight, IconArrowUpRight, IconDownload } from "@tabler/icons-react";
import { SiteHeader } from "@/components/site-header";
import { WithdrawalsAdmin } from "@/components/admin/withdrawals-admin";
import { FinanceBreakdown, FinanceCharts } from "@/components/admin/finance-charts";
import { FinanceImportDialog, ManualEntryDialog, RecentEntries } from "@/components/admin/finance-tools";
import { prisma } from "@/lib/prisma";
import { getFinanceReport } from "@/lib/finance";

export const dynamic = "force-dynamic";

const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const PERIODS = {
  "bulan-ini": "Bulan ini",
  "bulan-lalu": "Bulan lalu",
  "30-hari": "30 hari",
  "90-hari": "90 hari",
  "tahun-ini": "Tahun ini",
  semua: "Semua",
} as const;
type Period = keyof typeof PERIODS | "kustom";

const at = (ymd: string) => new Date(`${ymd}T00:00:00+07:00`);
const ymdJkt = (d: Date) => new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
const isYmd = (s?: string) => Boolean(s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(at(s).getTime()));

/** Period boundaries in Jakarta time; `to` is exclusive. */
function range(period: Period, dari?: string, sampai?: string, firstEntry?: Date | null) {
  const now = new Date();
  const today = ymdJkt(now);
  const [y, m] = today.split("-").map(Number);
  const month = (yy: number, mm: number) => at(`${yy}-${String(mm).padStart(2, "0")}-01`);
  const tomorrow = new Date(at(today).getTime() + 86_400_000);
  switch (period) {
    case "kustom": {
      const from = at(dari!);
      const to = new Date(at(sampai!).getTime() + 86_400_000);
      return from < to ? { from, to } : { from: at(sampai!), to: new Date(from.getTime() + 86_400_000) };
    }
    case "bulan-lalu":
      return { from: m === 1 ? month(y - 1, 12) : month(y, m - 1), to: month(y, m) };
    case "30-hari":
      return { from: new Date(tomorrow.getTime() - 30 * 86_400_000), to: tomorrow };
    case "90-hari":
      return { from: new Date(tomorrow.getTime() - 90 * 86_400_000), to: tomorrow };
    case "tahun-ini":
      return { from: at(`${y}-01-01`), to: tomorrow };
    case "semua":
      return { from: firstEntry ? at(ymdJkt(firstEntry)) : month(y, m), to: tomorrow };
    default:
      return { from: month(y, m), to: tomorrow };
  }
}

function Change({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value === null) return <span className="text-xs text-zinc-500">baru di periode ini</span>;
  const up = value >= 0;
  const good = invert ? !up : up;
  const Icon = up ? IconArrowUpRight : IconArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${good ? "text-[#1E6B4F]" : "text-[#9C2F1F]"}`}>
      <Icon size={13} aria-hidden />
      {Math.abs(value).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%<span className="ml-1 font-normal text-zinc-500">vs periode lalu</span>
    </span>
  );
}

export default async function KeuanganPage({ searchParams }: { searchParams: Promise<{ periode?: string; dari?: string; sampai?: string }> }) {
  const { periode, dari, sampai } = await searchParams;
  const period: Period = periode === "kustom" && isYmd(dari) && isYmd(sampai) ? "kustom" : periode && periode in PERIODS ? (periode as Period) : "bulan-ini";
  const first = period === "semua" ? await prisma.ledgerEntry.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }) : null;
  const { from, to } = range(period, dari, sampai, first?.createdAt);
  const compare = period !== "semua";

  const [report, pending] = await Promise.all([
    getFinanceReport(from, to),
    prisma.withdrawalRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);
  const k = report.kpi;
  const fromStr = ymdJkt(from);
  const toStr = ymdJkt(to); // exclusive
  const lastDay = ymdJkt(new Date(to.getTime() - 1));
  const exportHref = `/api/admin/finance/export?from=${fromStr}&to=${toStr}`;
  const fmtDay = (s: string) => at(s).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

  const main = [
    { label: "Pendapatan", value: rupiah(k.revenue), change: k.revenueChange, hint: `${k.payments} pembayaran aplikasi` },
    { label: "Pengeluaran", value: rupiah(k.expense), change: k.expenseChange, invert: true, hint: "Dicatat manual / impor" },
    { label: "Laba bersih", value: rupiah(k.net), change: k.netChange, hint: k.margin === null ? "Belum ada pendapatan" : `Margin ${k.margin.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%` },
    { label: "Rata-rata pembayaran", value: rupiah(k.averageOrder), change: k.paymentsChange, hint: "Perubahan = jumlah pembayaran" },
  ];
  const side = [
    { label: "Menunggu verifikasi", value: rupiah(k.pendingPayments.amount), hint: `${k.pendingPayments.count} transaksi pending`, href: "/admin/transaksi" },
    { label: "Terutang ke user", value: rupiah(k.owedToUsers), hint: "Saldo komisi & penjualan" },
    { label: "Penarikan dibayar", value: rupiah(k.withdrawalsPaid.amount), hint: `${k.withdrawalsPaid.count} penarikan di periode ini` },
    { label: "Penarikan menunggu", value: rupiah(k.withdrawalsPending.amount), hint: `${k.withdrawalsPending.count} pengajuan` },
  ];

  return (
    <>
      <SiteHeader />
      <div className="flex-1 px-4 pb-16 pt-8 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="space-y-5">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#8A6A2F]">Keuangan</p>
                <h2 className="font-serif text-4xl font-medium sm:text-5xl">Laporan keuangan</h2>
                <p className="text-zinc-600">
                  {fmtDay(fromStr)} – {fmtDay(lastDay)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ManualEntryDialog />
                <FinanceImportDialog />
                <a href={exportHref} className="flex h-9 items-center gap-1.5 rounded-full border border-zinc-300 px-4 text-sm hover:bg-zinc-100">
                  <IconDownload size={15} /> Excel
                </a>
                <a href={`${exportHref}&format=csv`} className="flex h-9 items-center rounded-full px-2 text-sm text-zinc-500 underline-offset-4 hover:underline">
                  CSV
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
              <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:px-0" aria-label="Periode">
                {(Object.keys(PERIODS) as (keyof typeof PERIODS)[]).map((p) => (
                  <Link
                    key={p}
                    href={`/admin/keuangan?periode=${p}`}
                    className={`flex h-9 shrink-0 items-center rounded-full border px-4 text-sm ${p === period ? "border-zinc-900 bg-zinc-900 text-zinc-50" : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"}`}
                  >
                    {PERIODS[p]}
                  </Link>
                ))}
              </nav>
              <form action="/admin/keuangan" className="flex flex-wrap items-center gap-2 text-sm">
                <input type="hidden" name="periode" value="kustom" />
                <input type="date" name="dari" required defaultValue={fromStr} aria-label="Dari tanggal" className="h-9 rounded-full border border-zinc-300 bg-white px-3" />
                <span className="text-zinc-500">s/d</span>
                <input type="date" name="sampai" required defaultValue={lastDay} aria-label="Sampai tanggal" className="h-9 rounded-full border border-zinc-300 bg-white px-3" />
                <button className={`h-9 rounded-full border px-4 ${period === "kustom" ? "border-zinc-900 bg-zinc-900 text-zinc-50" : "border-zinc-300 hover:bg-zinc-100"}`}>Terapkan</button>
              </form>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 sm:grid-cols-2 xl:grid-cols-4">
            {main.map((t) => (
              <div key={t.label} className="bg-white p-5">
                <p className="text-sm text-zinc-500">{t.label}</p>
                <p className="mt-2 font-serif text-3xl tabular-nums lining-nums break-words">{t.value}</p>
                <div className="mt-2 flex flex-col gap-0.5">
                  {compare && <Change value={t.change} invert={t.invert} />}
                  <span className="text-xs text-zinc-500">{t.hint}</span>
                </div>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {side.map((t) => {
              const body = (
                <>
                  <p className="text-xs text-zinc-500">{t.label}</p>
                  <p className="mt-1 text-lg font-medium tabular-nums">{t.value}</p>
                  <p className="text-xs text-zinc-500">{t.hint}</p>
                </>
              );
              return t.href ? (
                <Link key={t.label} href={t.href} className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-400">
                  {body}
                </Link>
              ) : (
                <div key={t.label} className="rounded-xl border border-zinc-200 bg-white p-4">
                  {body}
                </div>
              );
            })}
          </section>

          <FinanceCharts report={report} />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <FinanceBreakdown report={report} />
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
              <h3 className="font-serif text-2xl">Transaksi terakhir</h3>
              <p className="mt-1 text-sm text-zinc-500">30 catatan terbaru di periode ini. Catatan manual bisa dihapus.</p>
              <RecentEntries items={report.recent} />
            </section>
          </div>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
            <h3 className="font-serif text-2xl">Penarikan menunggu</h3>
            <p className="mb-2 text-sm text-zinc-500">Transfer ke rekening user, lalu tandai sudah ditransfer. Penarikan yang ditolak mengembalikan saldo user.</p>
            <WithdrawalsAdmin items={pending.map((w) => ({ id: w.id, amount: w.amount, method: w.method, provider: w.provider, accountNumber: w.accountNumber, accountName: w.accountName, createdAt: w.createdAt.toISOString(), user: w.user }))} />
          </section>
        </div>
      </div>
    </>
  );
}
