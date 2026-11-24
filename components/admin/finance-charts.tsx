"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { FinanceReport } from "@/lib/finance";

// Categorical palette validated for the light surface #FFFDF9 (dataviz validator, all checks pass).
// Fixed order: slot 1 = revenue, slot 2 = expense. Never reassigned by rank.
const C = { revenue: "#A8741A", expense: "#2D5FC4", net: "#1E1B17" };

const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const compact = (n: number) => {
  const a = Math.abs(n);
  const s = a >= 1e9 ? `${+(a / 1e9).toFixed(1)}M` : a >= 1e6 ? `${+(a / 1e6).toFixed(1)}jt` : a >= 1e3 ? `${Math.round(a / 1e3)}rb` : `${a}`;
  return (n < 0 ? "-" : "") + s;
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function periodLabel(p: string, long = false) {
  const [y, m, d] = p.split("-");
  if (!d) return `${MONTHS[+m - 1]}${long ? ` ${y}` : ` ’${y.slice(2)}`}`;
  return `${+d} ${MONTHS[+m - 1]}${long ? ` ${y}` : ""}`;
}

type TipItem = { dataKey?: string | number; value?: number | string; color?: string };
function Tip({ active, payload, label, names, week }: { active?: boolean; payload?: TipItem[]; label?: string; names: Record<string, string>; week?: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-44 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-zinc-900">
        {week && "Minggu "}
        {periodLabel(String(label), true)}
      </p>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-zinc-600">
            <span className="size-2 rounded-[2px]" style={{ background: p.color }} />
            {names[String(p.dataKey)]}
          </span>
          <span className="font-medium tabular-nums text-zinc-900">{rupiah(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

const axis = { tickLine: false, axisLine: false, tick: { fontSize: 11, fill: "#7B7165" } };

export function FinanceCharts({ report }: { report: FinanceReport }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const data = report.series;
  const hasData = data.some((d) => d.revenue || d.expense);
  const cashConfig = { revenue: { label: "Pendapatan", color: C.revenue }, expense: { label: "Pengeluaran", color: C.expense } } satisfies ChartConfig;
  const netConfig = { cumulativeNet: { label: "Laba kumulatif", color: C.net } } satisfies ChartConfig;
  const g = report.granularity;
  const unit = g === "month" ? "bulanan" : g === "week" ? "mingguan" : "harian";
  const week = g === "week";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-2xl">Arus kas {unit}</h3>
            <p className="mt-1 text-sm text-zinc-500">Pendapatan dibanding pengeluaran tiap {g === "month" ? "bulan" : week ? "minggu (mulai Senin)" : "hari"}.</p>
          </div>
          <div className="flex rounded-full border border-zinc-200 p-0.5 text-xs" role="tablist" aria-label="Tampilan">
            {(["chart", "table"] as const).map((v) => (
              <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={`rounded-full px-3 py-1 ${view === v ? "bg-zinc-900 text-zinc-50" : "text-zinc-600"}`}>
                {v === "chart" ? "Grafik" : "Tabel"}
              </button>
            ))}
          </div>
        </div>

        {!hasData ? (
          <p className="mt-6 text-sm text-zinc-500">Belum ada transaksi di periode ini.</p>
        ) : view === "chart" ? (
          <>
            <div className="mt-4">
              <Legend items={[{ color: C.revenue, label: "Pendapatan" }, { color: C.expense, label: "Pengeluaran" }]} />
            </div>
            <ChartContainer config={cashConfig} className="mt-3 aspect-auto h-64 w-full">
              <BarChart data={data} barGap={2} margin={{ left: 4, right: 4, top: 8 }}>
                <CartesianGrid vertical={false} stroke="#EFE8DC" />
                <XAxis dataKey="period" {...axis} tickFormatter={(v) => periodLabel(v)} minTickGap={16} />
                <YAxis {...axis} width={44} tickFormatter={compact} />
                <Tooltip cursor={{ fill: "#F7F3EC" }} content={<Tip week={week} names={{ revenue: "Pendapatan", expense: "Pengeluaran" }} />} />
                <Bar dataKey="revenue" fill={C.revenue} radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="expense" fill={C.expense} radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ChartContainer>
          </>
        ) : (
          <div className="mt-4 max-h-72 overflow-auto rounded-lg border border-zinc-100">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-50 text-left text-xs text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">{g === "month" ? "Bulan" : week ? "Minggu mulai" : "Tanggal"}</th>
                  <th className="px-3 py-2 text-right font-medium">Pendapatan</th>
                  <th className="px-3 py-2 text-right font-medium">Pengeluaran</th>
                  <th className="px-3 py-2 text-right font-medium">Laba</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {data
                  .filter((d) => d.revenue || d.expense)
                  .map((d) => (
                    <tr key={d.period} className="border-t border-zinc-100">
                      <td className="px-3 py-2">{periodLabel(d.period, true)}</td>
                      <td className="px-3 py-2 text-right">{rupiah(d.revenue)}</td>
                      <td className="px-3 py-2 text-right">{rupiah(d.expense)}</td>
                      <td className="px-3 py-2 text-right font-medium">{rupiah(d.net)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <h3 className="font-serif text-2xl">Laba kumulatif</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Akhir periode: <span className="font-medium text-zinc-900 tabular-nums">{rupiah(data.at(-1)?.cumulativeNet ?? 0)}</span>
        </p>
        {hasData ? (
          <ChartContainer config={netConfig} className="mt-4 aspect-auto h-64 w-full">
            <LineChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke="#EFE8DC" />
              <XAxis dataKey="period" {...axis} tickFormatter={(v) => periodLabel(v)} minTickGap={24} />
              <YAxis {...axis} width={44} tickFormatter={compact} />
              <ReferenceLine y={0} stroke="#C9BBA6" />
              <Tooltip cursor={{ stroke: "#C9BBA6", strokeDasharray: "3 3" }} content={<Tip week={week} names={{ cumulativeNet: "Laba kumulatif" }} />} />
              <Line dataKey="cumulativeNet" stroke={C.net} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "#FFFDF9", strokeWidth: 2 }} type="linear" />
            </LineChart>
          </ChartContainer>
        ) : (
          <p className="mt-6 text-sm text-zinc-500">Belum ada data.</p>
        )}
      </section>
    </div>
  );
}

type Slice = { label: string; amount: number; count: number };

/** Ranked horizontal bars (one hue = magnitude) with value and share as text. */
export function FinanceBreakdown({ report }: { report: FinanceReport }) {
  const tabs = [
    { id: "source", label: "Sumber", items: report.bySource, color: C.revenue, empty: "Belum ada pendapatan." },
    { id: "plan", label: "Paket", items: report.byPlan, color: C.revenue, empty: "Belum ada pembayaran aplikasi." },
    { id: "method", label: "Metode bayar", items: report.byMethod, color: C.revenue, empty: "Belum ada pembayaran aplikasi." },
    { id: "expense", label: "Pengeluaran", items: report.byExpenseCategory, color: C.expense, empty: "Belum ada pengeluaran. Tambahkan manual atau impor dari Excel." },
  ];
  const [tab, setTab] = useState(tabs[0].id);
  const cur = tabs.find((t) => t.id === tab)!;
  const total = cur.items.reduce((n, i: Slice) => n + i.amount, 0);
  const max = Math.max(1, ...cur.items.map((i) => i.amount));

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-2xl">Rincian</h3>
        <div className="flex flex-wrap gap-1 rounded-full border border-zinc-200 p-0.5 text-xs" role="tablist" aria-label="Rincian">
          {tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1 ${tab === t.id ? "bg-zinc-900 text-zinc-50" : "text-zinc-600"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {cur.items.length ? (
        <ul className="mt-5 space-y-3.5">
          {cur.items.map((i) => (
            <li key={i.label} className="space-y-1.5" title={`${i.label}: ${rupiah(i.amount)} dari ${i.count} transaksi`}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  {i.label} <span className="text-zinc-500">· {i.count}×</span>
                </span>
                <span className="shrink-0 tabular-nums">
                  <span className="font-medium">{rupiah(i.amount)}</span>
                  <span className="ml-2 inline-block w-11 text-right text-xs text-zinc-500">{total ? Math.round((i.amount / total) * 100) : 0}%</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full" style={{ width: `${Math.max(1.5, (i.amount / max) * 100)}%`, background: cur.color }} />
              </div>
            </li>
          ))}
          <li className="flex justify-between border-t border-zinc-100 pt-3 text-sm">
            <span className="text-zinc-500">Total</span>
            <span className="font-medium tabular-nums">{rupiah(total)}</span>
          </li>
        </ul>
      ) : (
        <p className="mt-5 text-sm text-zinc-500">{cur.empty}</p>
      )}
    </section>
  );
}
