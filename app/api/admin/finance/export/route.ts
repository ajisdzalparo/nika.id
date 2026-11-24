import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";
import { getFinanceReport } from "@/lib/finance";
import { buildFinanceWorkbook } from "@/lib/finance-excel";

const csv = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// GET /api/admin/finance/export?from=YYYY-MM-DD&to=YYYY-MM-DD[&format=csv]
// Default: .xlsx with summary, per-period and ledger sheets. format=csv: ledger rows only.
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const fromStr = url.searchParams.get("from") ?? "2000-01-01";
    const toStr = url.searchParams.get("to") ?? "2100-01-01";
    const from = new Date(`${fromStr}T00:00:00+07:00`);
    const to = new Date(`${toStr}T00:00:00+07:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return new Response("Tanggal tidak valid", { status: 400 });

    const rows = await prisma.ledgerEntry.findMany({
      where: { createdAt: { gte: from, lt: to } },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { email: true } } },
    });
    const name = `laporan-keuangan-${fromStr}-sd-${toStr}`;

    if (url.searchParams.get("format") === "csv") {
      const header = ["tanggal", "akun", "tipe", "sumber", "jumlah", "user", "transaksi", "penarikan", "catatan"];
      const lines = rows.map((r) =>
        [r.createdAt.toISOString(), r.account, r.type, r.source, r.amount, r.user?.email, r.transactionId, r.withdrawalId, r.note].map(csv).join(","),
      );
      return new Response("﻿" + [header.join(","), ...lines].join("\n"), {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"` },
      });
    }

    const report = await getFinanceReport(from, to);
    const buf = await buildFinanceWorkbook(
      report,
      rows.map((r) => ({ date: r.createdAt, account: r.account, type: r.type, source: r.source, amount: r.amount, email: r.user?.email ?? null, note: r.note })),
      `${fromStr} s/d ${toStr}`,
    );
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}.xlsx"`,
      },
    });
  } catch (error) {
    return apiErrorResponse(error, "Gagal mengekspor laporan");
  }
}
