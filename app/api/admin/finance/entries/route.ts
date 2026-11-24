import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";
import { addManualEntries } from "@/lib/finance";

const Input = z.object({
  kind: z.enum(["INCOME", "EXPENSE"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  category: z.string().trim().min(1, "Kategori wajib diisi").max(60),
  amount: z.number().int().positive("Jumlah harus lebih dari 0").max(10_000_000_000),
  note: z.string().trim().max(300).nullable().optional(),
});

// POST /api/admin/finance/entries — one manual income or expense row
export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const parsed = Input.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    const { date, ...rest } = parsed.data;
    const inserted = await addManualEntries([{ ...rest, date: new Date(`${date}T00:00:00+07:00`) }]);
    if (!inserted) return NextResponse.json({ error: "DUPLICATE", message: "Catatan yang sama persis sudah ada" }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error, "Gagal menyimpan catatan");
  }
}
