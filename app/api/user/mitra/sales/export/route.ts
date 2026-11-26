import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { styleHeader } from "@/lib/excel";
import { PLAN_LIMITS, type PlanType } from "@/lib/limits";
import { prisma } from "@/lib/prisma";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

// GET /api/user/mitra/sales/export?bulan=YYYY-MM (or ALL) — exports the mitra's sales report as .xlsx
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { accountType: true, agencyName: true, name: true },
    });
    if (!user || user.accountType !== "AGENCY") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Hanya tersedia untuk akun Mitra." }, { status: 403 });
    }

    const params = new URL(request.url).searchParams;
    const dari = params.get("dari")?.trim() || "";
    const sampai = params.get("sampai")?.trim() || "";
    const bulan = params.get("bulan")?.trim() || "ALL";
    const rows = await prisma.invitation.findMany({
      where: { userId: session.user.id, activatedAt: { not: null } },
      orderBy: { activatedAt: "desc" },
      select: {
        title: true,
        slug: true,
        plan: true,
        clientName: true,
        clientWhatsapp: true,
        clientPrice: true,
        mitraCost: true,
        activatedAt: true,
      },
    });

    const isoDayFmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const validDari = /^\d{4}-\d{2}-\d{2}$/.test(dari) ? dari : "";
    const validSampai = /^\d{4}-\d{2}-\d{2}$/.test(sampai) ? sampai : "";

    const filtered =
      validDari || validSampai
        ? rows.filter((r) => {
            if (!r.activatedAt) return false;
            const day = isoDayFmt.format(r.activatedAt);
            if (validDari && day < validDari) return false;
            if (validSampai && day > validSampai) return false;
            return true;
          })
        : bulan !== "ALL" && /^\d{4}-\d{2}$/.test(bulan)
          ? rows.filter((r) => {
              if (!r.activatedAt) return false;
              const wib = new Intl.DateTimeFormat("en-CA", {
                timeZone: "Asia/Jakarta",
                year: "numeric",
                month: "2-digit",
              }).format(r.activatedAt);
              return wib === bulan;
            })
          : rows;

    const wb = new ExcelJS.Workbook();
    wb.creator = "SatuMoment";
    wb.created = new Date();

    const ws = wb.addWorksheet("Laporan Penjualan");
    ws.columns = [
      { header: "Tanggal Aktif", key: "activatedAt", width: 16 },
      { header: "Nama Klien", key: "clientName", width: 24 },
      { header: "Judul Undangan", key: "title", width: 28 },
      { header: "Slug", key: "slug", width: 24 },
      { header: "Paket", key: "plan", width: 12 },
      { header: "Harga Jual (Rp)", key: "clientPrice", width: 18 },
      { header: "Modal (Rp)", key: "mitraCost", width: 16 },
      { header: "Untung (Rp)", key: "profit", width: 18 },
      { header: "Margin (%)", key: "margin", width: 12 },
    ];
    styleHeader(ws);

    let totalRevenue = 0;
    let totalCost = 0;

    for (const r of filtered) {
      const revenue = r.clientPrice ?? 0;
      const cost = r.mitraCost ?? 0;
      const profit = r.clientPrice === null ? null : revenue - cost;
      const margin = r.clientPrice && r.clientPrice > 0 ? Math.round(((revenue - cost) / revenue) * 100) : null;
      totalRevenue += revenue;
      totalCost += cost;

      const row = ws.addRow({
        activatedAt: r.activatedAt ? dateFmt.format(r.activatedAt) : "-",
        clientName: r.clientName || "-",
        title: r.title,
        slug: r.slug ? `/${r.slug}` : "-",
        plan: PLAN_LIMITS[(r.plan as PlanType) ?? "FREE"]?.name ?? r.plan,
        clientPrice: r.clientPrice ?? "",
        mitraCost: cost,
        profit: profit ?? "",
        margin: margin !== null ? `${margin}%` : "-",
      });
      for (const col of [6, 7, 8]) {
        const cell = row.getCell(col);
        if (typeof cell.value === "number") cell.numFmt = "#,##0";
      }
    }

    const totalRow = ws.addRow({
      activatedAt: "TOTAL",
      clientName: `${filtered.length} klien`,
      title: "",
      slug: "",
      plan: "",
      clientPrice: totalRevenue,
      mitraCost: totalCost,
      profit: totalRevenue - totalCost,
      margin: totalRevenue > 0 ? `${Math.round(((totalRevenue - totalCost) / totalRevenue) * 100)}%` : "-",
    });
    totalRow.font = { bold: true };
    for (const col of [6, 7, 8]) {
      totalRow.getCell(col).numFmt = "#,##0";
    }

    const buffer = await wb.xlsx.writeBuffer();
    const suffix =
      validDari || validSampai
        ? `${validDari || "awal"}-sd-${validSampai || "sekarang"}`
        : bulan === "ALL"
          ? "semua"
          : bulan;
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="laporan-penjualan-mitra-${suffix}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiErrorResponse(error, "Gagal mengekspor laporan penjualan");
  }
}
