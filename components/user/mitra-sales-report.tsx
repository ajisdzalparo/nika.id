"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import {
  IconCalendar,
  IconCash,
  IconChartBar,
  IconDownload,
  IconExternalLink,
  IconPercentage,
  IconReceipt2,
  IconSearch,
  IconTicket,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";
import { Panel, PanelTitle, StatTile } from "@/components/common/studio-ui";
import { NumberInput } from "@/components/common/number-input";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { PLAN_LIMITS, type PlanType } from "@/lib/limits";

export interface MitraSaleRow {
  id: string;
  slug?: string | null;
  title: string;
  plan?: string;
  clientName: string | null;
  clientWhatsapp?: string | null;
  clientPrice: number | null;
  mitraCost: number | null;
  activatedAt: string;
  weddingDate?: string | null;
}

export interface MitraQuotaPurchase {
  id: string;
  amount: number;
  quotaAdded: number;
  status: string;
  paymentMethod: string;
  notes: string | null;
  createdAt: string;
}

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const compact = (n: number) => {
  const a = Math.abs(n);
  const s = a >= 1e9 ? `${+(a / 1e9).toFixed(1)}M` : a >= 1e6 ? `${+(a / 1e6).toFixed(1)}jt` : a >= 1e3 ? `${Math.round(a / 1e3)}rb` : `${a}`;
  return (n < 0 ? "-" : "") + s;
};

const dayKeyWib = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));

const monthKeyWib = (iso: string) => dayKeyWib(iso).slice(0, 7);

type DatePreset = "THIS_MONTH" | "LAST_30" | "LAST_MONTH" | "THIS_YEAR" | "ALL" | "CUSTOM";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function isoFromUtcParts(year: number, monthIndex: number, day: number) {
  const d = new Date(Date.UTC(year, monthIndex, day));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function presetToRange(preset: Exclude<DatePreset, "CUSTOM">, todayWib: string): { from: string; to: string } {
  const [yStr, mStr, dStr] = todayWib.split("-");
  const y = Number(yStr);
  const m = Number(mStr) - 1;
  const d = Number(dStr);
  if (preset === "ALL") return { from: "", to: "" };
  if (preset === "THIS_MONTH") {
    return { from: isoFromUtcParts(y, m, 1), to: isoFromUtcParts(y, m + 1, 0) };
  }
  if (preset === "LAST_MONTH") {
    return { from: isoFromUtcParts(y, m - 1, 1), to: isoFromUtcParts(y, m, 0) };
  }
  if (preset === "LAST_30") {
    return { from: isoFromUtcParts(y, m, d - 29), to: todayWib };
  }
  return { from: isoFromUtcParts(y, 0, 1), to: isoFromUtcParts(y, 11, 31) };
}

function formatIsoDay(isoDay: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) return isoDay;
  return dayShortFmt.format(new Date(`${isoDay}T05:00:00.000Z`));
}

const monthLabel = (key: string) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", month: "long", year: "numeric" }).format(
    new Date(`${key}-01T05:00:00.000Z`),
  );

const shortMonthLabel = (key: string) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", month: "short", year: "2-digit" }).format(
    new Date(`${key}-01T05:00:00.000Z`),
  );

const dayShortFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const CHART_COLORS = { revenue: "#A8741A", cost: "#9B8F7E", profit: "#1F1A14" };
const CHART_CONFIG = {
  revenue: { label: "Omzet", color: CHART_COLORS.revenue },
  cost: { label: "Modal", color: CHART_COLORS.cost },
  profit: { label: "Untung", color: CHART_COLORS.profit },
} satisfies ChartConfig;

const TX_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  SUCCESS: { label: "Berhasil", cls: "bg-[#EEF4EA] text-[#3F6B3A]" },
  PENDING: { label: "Menunggu", cls: "bg-[#F6EEDF] text-[#8A6424]" },
  FAILED: { label: "Gagal", cls: "bg-[#F6E7E4] text-[#9A3B2E]" },
};

type TipItem = { dataKey?: string | number; value?: number | string; color?: string };
function ChartTip({ active, payload, label }: { active?: boolean; payload?: TipItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const labels: Record<string, string> = { revenue: "Omzet", cost: "Modal", profit: "Untung" };
  return (
    <div className="min-w-44 rounded-xl border border-[#EDE3CF] bg-[#FFFDF9] px-3.5 py-2.5 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-[#1F1A14]">{label ? monthLabel(label) : ""}</p>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-[#5E5446]">
            <span className="size-2 rounded-[2px]" style={{ background: p.color }} />
            {labels[String(p.dataKey)] ?? p.dataKey}
          </span>
          <span className="font-medium tabular-nums text-[#1F1A14]">{rupiah(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Dedicated Mitra financial & sales book: KPI summary, monthly revenue/cost/profit trend chart,
 * searchable inline-editable sales table, Excel export, and wholesale quota purchase history.
 */
export function MitraSalesReport({
  todayWib,
  initialRows,
  quotaPurchases = [],
  usableQuota = 0,
  quotaExpiresAt = null,
}: {
  todayWib: string;
  initialRows: MitraSaleRow[];
  quotaPurchases?: MitraQuotaPurchase[];
  usableQuota?: number;
  quotaExpiresAt?: string | null;
}) {
  const [rows, setRows] = useState(initialRows);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState<"ALL" | "UNPRICED" | "PRICED" | "TRIAL">("ALL");
  const [chartView, setChartView] = useState<"chart" | "summary">("chart");

  const defaultRange = useMemo(() => presetToRange("THIS_MONTH", todayWib), [todayWib]);
  const [preset, setPreset] = useState<DatePreset>("THIS_MONTH");
  const [fromDate, setFromDate] = useState<string>(defaultRange.from);
  const [toDate, setToDate] = useState<string>(defaultRange.to);

  const selectPreset = (next: Exclude<DatePreset, "CUSTOM">) => {
    setPreset(next);
    const range = presetToRange(next, todayWib);
    setFromDate(range.from);
    setToDate(range.to);
  };

  const months = useMemo(() => {
    const keys = new Set(rows.map((r) => monthKeyWib(r.activatedAt)));
    keys.add(todayWib.slice(0, 7));
    return [...keys].sort().reverse();
  }, [rows, todayWib]);

  const periodRows = useMemo(
    () =>
      rows.filter((r) => {
        const day = dayKeyWib(r.activatedAt);
        if (fromDate && day < fromDate) return false;
        if (toDate && day > toDate) return false;
        return true;
      }),
    [rows, fromDate, toDate],
  );

  const exportUrl = useMemo(() => {
    if (!fromDate && !toDate) return "/api/user/mitra/sales/export?bulan=ALL";
    const qs = new URLSearchParams();
    if (fromDate) qs.set("dari", fromDate);
    if (toDate) qs.set("sampai", toDate);
    return `/api/user/mitra/sales/export?${qs.toString()}`;
  }, [fromDate, toDate]);

  const activeRangeSummary =
    !fromDate && !toDate
      ? `Semua waktu (${rows.length} klien)`
      : fromDate && toDate
        ? `${formatIsoDay(fromDate)} – ${formatIsoDay(toDate)}`
        : fromDate
          ? `Mulai ${formatIsoDay(fromDate)}`
          : `Sampai ${formatIsoDay(toDate)}`;

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return periodRows.filter((r) => {
      if (priceFilter === "UNPRICED" && r.clientPrice !== null) return false;
      if (priceFilter === "PRICED" && r.clientPrice === null) return false;
      if (priceFilter === "TRIAL" && (r.mitraCost ?? 0) > 0) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        (r.clientName ?? "").toLowerCase().includes(q) ||
        (r.slug ?? "").toLowerCase().includes(q)
      );
    });
  }, [periodRows, search, priceFilter]);

  const stats = useMemo(() => {
    const revenue = periodRows.reduce((n, r) => n + (r.clientPrice ?? 0), 0);
    const cost = periodRows.reduce((n, r) => n + (r.mitraCost ?? 0), 0);
    const priced = periodRows.filter((r) => r.clientPrice !== null);
    const unpriced = periodRows.length - priced.length;
    const profit = revenue - cost;
    const avgPrice = priced.length > 0 ? Math.round(revenue / priced.length) : 0;
    const avgCost = periodRows.length > 0 ? Math.round(cost / periodRows.length) : 0;
    const marginPct = revenue > 0 ? Math.round((profit / revenue) * 100) : null;
    const quotaSpend = quotaPurchases
      .filter((t) => t.status === "SUCCESS")
      .reduce((n, t) => n + t.amount, 0);
    return { revenue, cost, profit, unpriced, avgPrice, avgCost, marginPct, quotaSpend };
  }, [periodRows, quotaPurchases]);

  const monthlySeries = useMemo(() => {
    const map = new Map<string, { month: string; clients: number; revenue: number; cost: number; profit: number }>();
    for (const k of [...months].reverse().slice(-12)) {
      map.set(k, { month: k, clients: 0, revenue: 0, cost: 0, profit: 0 });
    }
    for (const r of rows) {
      const k = monthKeyWib(r.activatedAt);
      const bucket = map.get(k);
      if (!bucket) continue;
      const rev = r.clientPrice ?? 0;
      const cst = r.mitraCost ?? 0;
      bucket.clients += 1;
      bucket.revenue += rev;
      bucket.cost += cst;
      bucket.profit += rev - cst;
    }
    return [...map.values()];
  }, [rows, months]);

  const savePrice = async (row: MitraSaleRow) => {
    const raw = drafts[row.id];
    if (raw === undefined) return;
    const next = raw === "" ? null : Number(raw);
    if (next === row.clientPrice) return;
    setSavingId(row.id);
    try {
      const res = await fetch(`/api/user/invitations/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientPrice: next }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(d.message || "Gagal menyimpan harga jual");
      setRows((list) => list.map((r) => (r.id === row.id ? { ...r, clientPrice: next } : r)));
      toast.success(`Harga jual ${row.clientName || row.title} disimpan`);
    } finally {
      setSavingId(null);
    }
  };

  const shownTotals = useMemo(() => {
    const revenue = shown.reduce((n, r) => n + (r.clientPrice ?? 0), 0);
    const cost = shown.reduce((n, r) => n + (r.mitraCost ?? 0), 0);
    const profit = revenue - cost;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : null;
    return { revenue, cost, profit, margin };
  }, [shown]);

  return (
    <div className="space-y-6">
      {/* Date range picker, quick presets & Excel export bar */}
      <div className="space-y-3 rounded-2xl border border-[#EDE3CF] bg-white p-4 shadow-[0_1px_2px_rgba(26,21,16,.04)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ["THIS_MONTH", "Bulan ini"],
                ["LAST_30", "30 hari"],
                ["LAST_MONTH", "Bulan lalu"],
                ["THIS_YEAR", "Tahun ini"],
                ["ALL", "Semua"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => selectPreset(key)}
                className={`h-9 rounded-full px-3.5 text-xs font-medium transition ${
                  preset === key
                    ? "bg-[#1F1A14] text-[#F6EEDD]"
                    : "border border-[#E9DDC6] bg-[#FCF8F1] text-[#5E5446] hover:border-[#8A6424] hover:text-[#1F1A14]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <a
            href={exportUrl}
            download
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E6D5B2] bg-[#FCF8F1] px-4 text-xs font-medium text-[#1F1A14] transition hover:border-[#8A6424] hover:bg-[#F5EBD6]"
          >
            <IconDownload size={15} className="text-[#8A6424]" /> Ekspor Excel (.xlsx)
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F3EBDB] pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8E8268]">
              <IconCalendar size={14} className="text-[#8A6424]" /> Rentang tanggal
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex h-9 items-center gap-1.5 rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-3 text-xs text-[#6B5F50] focus-within:border-[#8A6424] focus-within:bg-white">
                <span className="text-[11px] text-[#8E8268]">Dari</span>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  aria-label="Tanggal mulai"
                  onChange={(e) => {
                    setPreset("CUSTOM");
                    setFromDate(e.target.value);
                  }}
                  className="bg-transparent text-xs font-medium text-[#1F1A14] outline-none"
                />
              </label>
              <span className="text-xs text-[#8E8268]">–</span>
              <label className="flex h-9 items-center gap-1.5 rounded-full border border-[#E9DDC6] bg-[#FCF8F1] px-3 text-xs text-[#6B5F50] focus-within:border-[#8A6424] focus-within:bg-white">
                <span className="text-[11px] text-[#8E8268]">Sampai</span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  aria-label="Tanggal akhir"
                  onChange={(e) => {
                    setPreset("CUSTOM");
                    setToDate(e.target.value);
                  }}
                  className="bg-transparent text-xs font-medium text-[#1F1A14] outline-none"
                />
              </label>
            </div>
          </div>
          <p className="text-xs text-[#6B5F50]">
            Menampilkan: <strong className="font-medium text-[#1F1A14]">{activeRangeSummary}</strong>
          </p>
        </div>
      </div>

      {/* 6 KPI cards: 1 col on mobile, 2 on tablet, 3 on desktop so long rupiah values never clip */}
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Klien aktif"
          value={periodRows.length}
          icon={IconUsers}
          hint={!fromDate && !toDate ? "Total sepanjang waktu" : `Dari ${rows.length} total klien`}
        />
        <StatTile
          label="Total omzet"
          value={rupiah(stats.revenue)}
          icon={IconCash}
          hint={stats.unpriced ? `${stats.unpriced} belum diisi harganya` : "Semua harga tercatat"}
        />
        <StatTile
          label="Total modal"
          value={rupiah(stats.cost)}
          icon={IconReceipt2}
          hint={periodRows.length ? `Rata-rata ${rupiah(stats.avgCost)}/klien` : "Kuota / paket terpakai"}
        />
        <StatTile
          label="Untung bersih"
          value={rupiah(stats.profit)}
          icon={IconChartBar}
          hint={stats.marginPct !== null ? `Margin ${stats.marginPct}%` : "Isi harga jual untuk hitung"}
        />
        <StatTile
          label="Rata-rata jual"
          value={stats.avgPrice ? rupiah(stats.avgPrice) : "–"}
          icon={IconTrendingUp}
          hint="Per klien yang terisi harga"
        />
        <StatTile
          label="Sisa kuota"
          value={`${usableQuota} kuota`}
          icon={IconTicket}
          hint={
            quotaExpiresAt
              ? `s.d. ${dayShortFmt.format(new Date(quotaExpiresAt))}`
              : stats.quotaSpend > 0
                ? `Total belanja ${rupiah(stats.quotaSpend)}`
                : "Belum ada stok kuota"
          }
        />
      </section>

      {/* Monthly Trend Chart / Monthly Breakdown */}
      <Panel className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <PanelTitle>Tren bulanan</PanelTitle>
            <p className="mt-1 text-xs text-[#6B5F50]">Perbandingan omzet, modal, dan keuntungan bersih hingga 12 bulan terakhir.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 text-xs text-[#5E5446] sm:flex">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px]" style={{ background: CHART_COLORS.revenue }} /> Omzet
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px]" style={{ background: CHART_COLORS.cost }} /> Modal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px]" style={{ background: CHART_COLORS.profit }} /> Untung
              </span>
            </div>
            <div className="inline-flex rounded-full border border-[#E9DDC6] bg-[#FCF8F1] p-0.5 text-xs" role="tablist" aria-label="Tampilan tren">
              {(
                [
                  ["chart", "Grafik"],
                  ["summary", "Ringkasan"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={chartView === k}
                  onClick={() => setChartView(k)}
                  className={`rounded-full px-3 py-1 font-medium transition ${
                    chartView === k ? "bg-[#1F1A14] text-[#F6EEDD]" : "text-[#6B5F50] hover:text-[#1F1A14]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#6B5F50]">
            Grafik tren akan muncul otomatis begitu undangan klien pertama Anda aktif.
          </p>
        ) : chartView === "chart" ? (
          <ChartContainer config={CHART_CONFIG} className="h-64 w-full">
            <BarChart data={monthlySeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#F3EBDB" />
              <XAxis
                dataKey="month"
                tickFormatter={shortMonthLabel}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#7B7165" }}
              />
              <YAxis
                tickFormatter={compact}
                tickLine={false}
                axisLine={false}
                width={52}
                tick={{ fontSize: 11, fill: "#7B7165" }}
              />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="revenue" fill={CHART_COLORS.revenue} radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="cost" fill={CHART_COLORS.cost} radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="profit" fill={CHART_COLORS.profit} radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-[#F3EBDB] text-left text-[11px] uppercase tracking-[0.12em] text-[#8E8268]">
                  <th className="py-2.5 pr-3 font-medium">Bulan</th>
                  <th className="py-2.5 pr-3 text-right font-medium">Klien</th>
                  <th className="py-2.5 pr-3 text-right font-medium">Omzet</th>
                  <th className="py-2.5 pr-3 text-right font-medium">Modal</th>
                  <th className="py-2.5 text-right font-medium">Untung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EBDB]">
                {[...monthlySeries].reverse().map((m) => (
                  <tr key={m.month} className="hover:bg-[#FCF8F1]/60">
                    <td className="py-2.5 pr-3 font-medium text-[#1F1A14]">{monthLabel(m.month)}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-[#5E5446]">{m.clients}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-[#40372B]">{rupiah(m.revenue)}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-[#6B5F50]">{rupiah(m.cost)}</td>
                    <td className="py-2.5 text-right tabular-nums font-medium text-[#1F1A14]">{rupiah(m.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Detailed Sales Table per Client */}
      <Panel className="overflow-hidden p-0">
        <div className="space-y-3 border-b border-[#F3EBDB] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <PanelTitle>Rincian penjualan per klien</PanelTitle>
              <p className="mt-1 text-xs text-[#6B5F50]">
                Ketik harga jual ke klien di kolom Harga Jual lalu tekan Enter atau klik di luar untuk menyimpan otomatis.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <IconSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8268]" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Cari klien di laporan penjualan"
                placeholder="Cari klien, judul, slug…"
                className="h-9 rounded-full border-[#E9DDC6] bg-[#FCF8F1] pl-9 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["ALL", `Semua (${periodRows.length})`],
                ["UNPRICED", `Belum diisi harga (${stats.unpriced})`],
                ["PRICED", `Sudah terisi (${periodRows.length - stats.unpriced})`],
                ["TRIAL", `Uji coba / Rp0 (${periodRows.filter((r) => (r.mitraCost ?? 0) === 0).length})`],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setPriceFilter(k)}
                className={`h-8 rounded-full px-3 text-xs font-medium transition ${
                  priceFilter === k
                    ? "bg-[#1F1A14] text-[#F6EEDD]"
                    : "border border-[#E9DDC6] bg-white text-[#5E5446] hover:border-[#8A6424] hover:text-[#1F1A14]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-[#6B5F50]">
            {periodRows.length === 0
              ? "Belum ada undangan klien yang aktif di periode ini."
              : "Tidak ada klien yang cocok dengan pencarian atau filter ini."}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-[#F3EBDB] bg-[#FCF8F1]/60 text-left text-[11px] uppercase tracking-[0.12em] text-[#8E8268]">
                    <th className="px-5 py-3 font-medium">Klien &amp; Undangan</th>
                    <th className="px-3 py-3 font-medium">Aktif</th>
                    <th className="px-3 py-3 font-medium">Harga Jual</th>
                    <th className="px-3 py-3 text-right font-medium">Modal</th>
                    <th className="px-3 py-3 text-right font-medium">Untung</th>
                    <th className="px-5 py-3 text-right font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EBDB]">
                  {shown.map((r) => {
                    const cost = r.mitraCost ?? 0;
                    const profit = r.clientPrice === null ? null : r.clientPrice - cost;
                    const margin =
                      r.clientPrice && r.clientPrice > 0 ? Math.round(((r.clientPrice - cost) / r.clientPrice) * 100) : null;
                    const planName = PLAN_LIMITS[(r.plan as PlanType) ?? "PREMIUM"]?.name ?? "Premium";
                    return (
                      <tr key={r.id} className="align-middle transition-colors hover:bg-[#FCF8F1]/70">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[#1F1A14]">{r.clientName || r.title}</p>
                            <span className="rounded-full border border-[#E6D5B2] bg-[#F7F0E1] px-2 py-0.5 text-[10px] font-medium text-[#5C431A]">
                              {planName}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-[#6B5F50]">
                            {r.clientName && <span>{r.title}</span>}
                            {r.slug && (
                              <a
                                href={`/${r.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-0.5 text-[#8A6424] hover:underline"
                              >
                                /{r.slug} <IconExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-xs text-[#40372B]">
                          {dayShortFmt.format(new Date(r.activatedAt))}
                        </td>
                        <td className="px-3 py-3.5">
                          <NumberInput
                            value={drafts[r.id] ?? (r.clientPrice === null ? "" : String(r.clientPrice))}
                            onValueChange={(v) => setDrafts((d) => ({ ...d, [r.id]: v }))}
                            onBlur={() => void savePrice(r)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.currentTarget.blur();
                              }
                            }}
                            disabled={savingId === r.id}
                            format="thousands"
                            prefix="Rp"
                            maxDigits={9}
                            placeholder="Isi harga"
                            className="h-9 w-44"
                            aria-label={`Harga jual ${r.clientName || r.title}`}
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5 text-right tabular-nums text-[#5E5446]">
                          {rupiah(cost)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-3 py-3.5 text-right tabular-nums font-medium ${
                            profit === null ? "text-[#8E8268]" : profit < 0 ? "text-[#9A3B2E]" : "text-[#1F1A14]"
                          }`}
                        >
                          {profit === null ? "–" : rupiah(profit)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right tabular-nums text-xs">
                          {margin === null ? (
                            <span className="text-[#8E8268]">–</span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium ${
                                margin >= 50
                                  ? "bg-[#EEF4EA] text-[#3F6B3A]"
                                  : margin >= 0
                                    ? "bg-[#F6EEDF] text-[#8A6424]"
                                    : "bg-[#F6E7E4] text-[#9A3B2E]"
                              }`}
                            >
                              {margin}
                              <IconPercentage size={11} />
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#E9DDC6] bg-[#FCF8F1] font-medium text-[#1F1A14]">
                    <td colSpan={2} className="px-5 py-3 text-xs uppercase tracking-[0.12em] text-[#6B5F50]">
                      Total ({shown.length} klien)
                    </td>
                    <td className="px-3 py-3 tabular-nums">{rupiah(shownTotals.revenue)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-[#5E5446]">{rupiah(shownTotals.cost)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{rupiah(shownTotals.profit)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-xs text-[#8A6424]">
                      {shownTotals.margin !== null ? `${shownTotals.margin}%` : "–"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile stacked rows */}
            <ul className="divide-y divide-[#F3EBDB] md:hidden">
              {shown.map((r) => {
                const cost = r.mitraCost ?? 0;
                const profit = r.clientPrice === null ? null : r.clientPrice - cost;
                return (
                  <li key={r.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-[#1F1A14]">{r.clientName || r.title}</p>
                        {r.clientName && <p className="text-xs text-[#6B5F50]">{r.title}</p>}
                      </div>
                      <span className="shrink-0 text-xs text-[#8E8268]">{dayShortFmt.format(new Date(r.activatedAt))}</span>
                    </div>
                    <div className="space-y-1.5">
                      <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-[#8E8268]">Harga Jual</span>
                      <NumberInput
                        value={drafts[r.id] ?? (r.clientPrice === null ? "" : String(r.clientPrice))}
                        onValueChange={(v) => setDrafts((d) => ({ ...d, [r.id]: v }))}
                        onBlur={() => void savePrice(r)}
                        disabled={savingId === r.id}
                        format="thousands"
                        prefix="Rp"
                        maxDigits={9}
                        placeholder="Isi harga jual"
                        className="h-10"
                        aria-label={`Harga jual ${r.clientName || r.title}`}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-[#FCF8F1] px-3 py-2 text-xs">
                      <span className="text-[#6B5F50]">
                        Modal: <strong className="tabular-nums text-[#1F1A14]">{rupiah(cost)}</strong>
                      </span>
                      <span className="text-[#6B5F50]">
                        Untung: <strong className="tabular-nums text-[#1F1A14]">{profit === null ? "–" : rupiah(profit)}</strong>
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <div className="border-t border-[#F3EBDB] bg-[#FCF8F1]/60 px-5 py-3 text-xs text-[#8E8268]">
          Modal undangan yang diaktifkan dengan kuota dihitung dari rata-rata harga paket kuota yang Anda beli; undangan dari kode uji coba bermodal Rp 0.
        </div>
      </Panel>

      {/* Quota Purchase History */}
      <Panel className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F3EBDB] p-5 sm:p-6">
          <div>
            <PanelTitle>Riwayat belanja kuota Mitra</PanelTitle>
            <p className="mt-1 text-xs text-[#6B5F50]">
              Catatan pembelian paket kuota grosir untuk dicocokkan dengan total modal &amp; omzet penjualan Anda.
            </p>
          </div>
          <Link
            href="/upgrade?pilih=mitra#kuota-mitra"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E6D5B2] bg-[#FCF8F1] px-3.5 text-xs font-medium text-[#8A6424] transition hover:border-[#8A6424] hover:text-[#1F1A14]"
          >
            <IconTicket size={14} /> Tambah Kuota
          </Link>
        </div>

        {quotaPurchases.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-[#6B5F50]">
            Belum ada pembelian paket kuota grosir. Paket yang Anda beli akan tercatat otomatis di sini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-[#F3EBDB] bg-[#FCF8F1]/60 text-left text-[11px] uppercase tracking-[0.12em] text-[#8E8268]">
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-3 py-3 font-medium">Paket / Catatan</th>
                  <th className="px-3 py-3 text-right font-medium">Kuota</th>
                  <th className="px-3 py-3 text-right font-medium">Nominal</th>
                  <th className="px-5 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EBDB]">
                {quotaPurchases.map((tx) => {
                  const st = TX_STATUS_BADGE[tx.status] ?? { label: tx.status, cls: "bg-[#F6EEDF] text-[#6B5F50]" };
                  return (
                    <tr key={tx.id} className="hover:bg-[#FCF8F1]/60">
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-[#40372B]">
                        {dayShortFmt.format(new Date(tx.createdAt))}
                      </td>
                      <td className="px-3 py-3 text-sm text-[#1F1A14]">
                        {tx.notes || `Paket Kuota Mitra (${tx.quotaAdded} undangan)`}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-[#5E5446]">
                        +{tx.quotaAdded}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums font-medium text-[#1F1A14]">
                        {rupiah(tx.amount)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
