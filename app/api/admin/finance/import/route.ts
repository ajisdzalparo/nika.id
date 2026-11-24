import { NextResponse } from "next/server";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";
import { addManualEntries } from "@/lib/finance";
import { parseFinanceFile } from "@/lib/finance-excel";

const MAX_BYTES = 5 * 1024 * 1024;

// POST /api/admin/finance/import (multipart, field "file": .xlsx or .csv)
// ?dryRun=1 validates without saving. Rows already imported are skipped.
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "VALIDATION_ERROR", message: "Pilih file Excel atau CSV" }, { status: 400 });
    if (!/\.(xlsx|csv)$/i.test(file.name)) return NextResponse.json({ error: "VALIDATION_ERROR", message: "Format harus .xlsx atau .csv" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "VALIDATION_ERROR", message: "Ukuran file maksimal 5 MB" }, { status: 400 });

    let parsed;
    try {
      parsed = await parseFinanceFile(await file.arrayBuffer(), file.name);
    } catch {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: "File tidak bisa dibaca. Pastikan formatnya .xlsx dari Excel/Google Sheets." }, { status: 400 });
    }

    const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
    // Nothing is saved when any row is invalid, so a fixed file can be uploaded again as a whole
    const inserted = dryRun || parsed.errors.length ? 0 : await addManualEntries(parsed.entries);
    const income = parsed.entries.filter((e) => e.kind === "INCOME").reduce((n, e) => n + e.amount, 0);
    const expense = parsed.entries.filter((e) => e.kind === "EXPENSE").reduce((n, e) => n + e.amount, 0);

    return NextResponse.json({
      saved: !dryRun && parsed.errors.length === 0,
      rows: parsed.entries.length,
      inserted,
      duplicates: !dryRun && parsed.errors.length === 0 ? parsed.entries.length - inserted : 0,
      income,
      expense,
      errors: parsed.errors.slice(0, 50),
      errorCount: parsed.errors.length,
    });
  } catch (error) {
    return apiErrorResponse(error, "Gagal mengimpor file");
  }
}
