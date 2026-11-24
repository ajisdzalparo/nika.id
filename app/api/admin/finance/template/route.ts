import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";
import { buildImportTemplate } from "@/lib/finance-excel";

// GET /api/admin/finance/template — Excel template for importing income/expenses
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const buf = await buildImportTemplate();
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="template-keuangan-undangin-yuk.xlsx"',
      },
    });
  } catch (error) {
    return apiErrorResponse(error, "Gagal membuat template");
  }
}
