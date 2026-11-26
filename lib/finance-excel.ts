import ExcelJS from "exceljs";
import { readSpreadsheetRows, styleHeader } from "@/lib/excel";
import type { FinanceReport, ManualEntryInput } from "@/lib/finance";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/finance";

export const IMPORT_COLUMNS = ["Tanggal", "Jenis", "Kategori", "Jumlah", "Keterangan"] as const;
export const MAX_IMPORT_ROWS = 2000;

const RUPIAH_FMT = '"Rp" #,##0';

export interface ImportResult {
  entries: ManualEntryInput[];
  errors: { row: number; message: string }[];
}

/** Only real calendar days (rejects 2026-13-31 or 2026-02-30). */
function jktDate(y: string, m: string, d: string): Date | null {
  const ymd = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  const date = new Date(`${ymd}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + 7 * 3_600_000).toISOString().slice(0, 10) === ymd ? date : null;
}

/** "23/11/2026", "2026-11-23", Excel dates, Date objects → Date at 00:00 Jakarta time. */
function parseDate(v: unknown): Date | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const ymd = v.toISOString().slice(0, 10);
    return new Date(`${ymd}T00:00:00+07:00`);
  }
  if (typeof v === "number" && v > 20000 && v < 80000) {
    // Excel serial date
    const ms = Math.round((v - 25569) * 86_400_000);
    return new Date(`${new Date(ms).toISOString().slice(0, 10)}T00:00:00+07:00`);
  }
  const s = String(v ?? "").trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return jktDate(m[1], m[2], m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return jktDate(m[3], m[2], m[1]);
  return null;
}

/** 1500000, "1.500.000", "Rp 1.500.000", "1500000,00" → 1500000 */
function parseAmount(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
  const s = String(v ?? "")
    .replace(/rp/i, "")
    .replace(/\s/g, "")
    .replace(/,\d{1,2}$/, "")
    .replace(/[.,]/g, "");
  if (!/^-?\d+$/.test(s)) return null;
  return Number(s);
}

function parseKind(v: unknown): "INCOME" | "EXPENSE" | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (["pemasukan", "masuk", "income", "pendapatan"].includes(s)) return "INCOME";
  if (["pengeluaran", "keluar", "expense", "biaya"].includes(s)) return "EXPENSE";
  return null;
}

function rowsToEntries(rows: unknown[][]): ImportResult {
  const entries: ManualEntryInput[] = [];
  const errors: ImportResult["errors"] = [];
  if (!rows.length) return { entries, errors: [{ row: 1, message: "File kosong" }] };

  // Map header names (case-insensitive) to column indexes
  const header = rows[0].map((h) => String(h ?? "").trim().toLowerCase());
  const col = Object.fromEntries(IMPORT_COLUMNS.map((c) => [c, header.indexOf(c.toLowerCase())]));
  const missing = IMPORT_COLUMNS.filter((c) => c !== "Keterangan" && col[c] < 0);
  if (missing.length) return { entries, errors: [{ row: 1, message: `Kolom tidak ditemukan: ${missing.join(", ")}. Gunakan template.` }] };

  const body = rows.slice(1);
  if (body.length > MAX_IMPORT_ROWS) return { entries, errors: [{ row: 1, message: `Maksimal ${MAX_IMPORT_ROWS} baris per file` }] };

  body.forEach((r, i) => {
    const rowNo = i + 2;
    if (r.every((c) => String(c ?? "").trim() === "")) return; // skip blank lines
    const date = parseDate(r[col.Tanggal]);
    const kind = parseKind(r[col.Jenis]);
    const category = String(r[col.Kategori] ?? "").trim();
    const amount = parseAmount(r[col.Jumlah]);
    const note = col.Keterangan >= 0 ? String(r[col.Keterangan] ?? "").trim() : "";
    if (!date) return errors.push({ row: rowNo, message: "Tanggal tidak valid (pakai format 2026-11-23 atau 23/11/2026)" });
    if (!kind) return errors.push({ row: rowNo, message: "Jenis harus Pemasukan atau Pengeluaran" });
    if (!category) return errors.push({ row: rowNo, message: "Kategori wajib diisi" });
    if (amount === null || amount <= 0) return errors.push({ row: rowNo, message: "Jumlah harus angka lebih dari 0" });
    entries.push({ kind, date, category: category.slice(0, 60), amount, note: note.slice(0, 300) || null });
  });
  return { entries, errors };
}

/** Reads the first sheet of an .xlsx (or a .csv) into validated manual entries. */
export async function parseFinanceFile(buffer: ArrayBuffer, filename: string): Promise<ImportResult> {
  return rowsToEntries(await readSpreadsheetRows(buffer, filename, "data"));
}

/** Template with headers, example rows and a sheet explaining the columns. */
export async function buildImportTemplate() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Data");
  ws.columns = [
    { header: "Tanggal", key: "date", width: 14, style: { numFmt: "yyyy-mm-dd" } },
    { header: "Jenis", key: "kind", width: 14 },
    { header: "Kategori", key: "cat", width: 22 },
    { header: "Jumlah", key: "amount", width: 16, style: { numFmt: RUPIAH_FMT } },
    { header: "Keterangan", key: "note", width: 40 },
  ];
  styleHeader(ws);
  ws.addRow({ date: new Date("2026-11-01"), kind: "Pengeluaran", cat: "Server & hosting", amount: 350000, note: "VPS bulan November" });
  ws.addRow({ date: new Date("2026-11-05"), kind: "Pengeluaran", cat: "API AI", amount: 125000, note: "Tagihan Anthropic" });
  ws.addRow({ date: new Date("2026-11-10"), kind: "Pemasukan", cat: "Agency / B2B", amount: 1190000, note: "Paket Mitra 30 dibayar langsung" });
  for (let r = 2; r <= 500; r++) {
    ws.getCell(`B${r}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"Pemasukan,Pengeluaran"'] };
  }

  const help = wb.addWorksheet("Petunjuk");
  help.columns = [{ width: 18 }, { width: 80 }];
  [
    ["Kolom", "Keterangan"],
    ["Tanggal", "Format 2026-11-23 atau 23/11/2026"],
    ["Jenis", "Pemasukan atau Pengeluaran"],
    ["Kategori", `Pengeluaran: ${EXPENSE_CATEGORIES.join(", ")}`],
    ["", `Pemasukan: ${INCOME_CATEGORIES.join(", ")} (kategori lain juga boleh)`],
    ["Jumlah", "Angka rupiah tanpa titik, mis. 350000 (format Rp 350.000 juga diterima)"],
    ["Keterangan", "Opsional"],
    ["Catatan", "Baris yang sama persis tidak akan tercatat dua kali walau file diunggah ulang. Hapus contoh sebelum mengunggah."],
  ].forEach((r) => help.addRow(r));
  styleHeader(help);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Report workbook: summary sheet + ledger sheet for the period. */
export async function buildFinanceWorkbook(
  report: FinanceReport,
  ledgerRows: { date: Date; account: string; type: string; source: string | null; amount: number; email: string | null; note: string | null }[],
  periodLabel: string,
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SatuMoment";

  const s = wb.addWorksheet("Ringkasan");
  s.columns = [{ width: 32 }, { width: 20, style: { numFmt: RUPIAH_FMT } }, { width: 12 }];
  s.addRow(["Laporan keuangan", periodLabel]).font = { bold: true, size: 14 };
  s.addRow([]);
  const k = report.kpi;
  (
    [
      ["Pendapatan", k.revenue],
      ["Pengeluaran", k.expense],
      ["Laba bersih", k.net],
      ["Jumlah pembayaran", k.payments],
      ["Rata-rata nilai pembayaran", k.averageOrder],
      ["Pembayaran menunggu verifikasi", k.pendingPayments.amount],
      ["Terutang ke user", k.owedToUsers],
      ["Penarikan dibayar", k.withdrawalsPaid.amount],
      ["Penarikan menunggu", k.withdrawalsPending.amount],
    ] as const
  ).forEach(([label, v]) => {
    const r = s.addRow([label, v]);
    if (label === "Jumlah pembayaran") r.getCell(2).numFmt = "0";
  });
  const section = (title: string, items: { label: string; amount: number; count: number }[]) => {
    s.addRow([]);
    const h = s.addRow([title, "Jumlah", "Transaksi"]);
    h.font = { bold: true };
    items.forEach((i) => s.addRow([i.label, i.amount, i.count]));
  };
  section("Pendapatan per sumber", report.bySource);
  section("Pendapatan per paket", report.byPlan);
  section("Pendapatan per metode bayar", report.byMethod);
  section("Pengeluaran per kategori", report.byExpenseCategory);

  const t = wb.addWorksheet("Per periode");
  t.columns = [
    { header: report.granularity === "month" ? "Bulan" : report.granularity === "week" ? "Minggu mulai" : "Tanggal", key: "period", width: 14 },
    { header: "Pendapatan", key: "revenue", width: 18, style: { numFmt: RUPIAH_FMT } },
    { header: "Pengeluaran", key: "expense", width: 18, style: { numFmt: RUPIAH_FMT } },
    { header: "Laba bersih", key: "net", width: 18, style: { numFmt: RUPIAH_FMT } },
    { header: "Laba kumulatif", key: "cumulativeNet", width: 18, style: { numFmt: RUPIAH_FMT } },
  ];
  styleHeader(t);
  report.series.forEach((p) => t.addRow(p));

  const l = wb.addWorksheet("Buku besar");
  l.columns = [
    { header: "Tanggal", key: "date", width: 20, style: { numFmt: "yyyy-mm-dd hh:mm" } },
    { header: "Akun", key: "account", width: 20 },
    { header: "Tipe", key: "type", width: 20 },
    { header: "Sumber / kategori", key: "source", width: 22 },
    { header: "Jumlah", key: "amount", width: 16, style: { numFmt: RUPIAH_FMT } },
    { header: "User", key: "email", width: 28 },
    { header: "Catatan", key: "note", width: 36 },
  ];
  styleHeader(l);
  ledgerRows.forEach((r) => l.addRow(r));
  l.autoFilter = { from: "A1", to: "G1" };

  return Buffer.from(await wb.xlsx.writeBuffer());
}
