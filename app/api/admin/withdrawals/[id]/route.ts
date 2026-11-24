import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, requireAdmin } from "@/lib/auth-helpers";
import { markWithdrawalPaid, rejectWithdrawal, WithdrawalError } from "@/lib/ledger";

const Input = z.object({
  action: z.enum(["PAID", "REJECTED"]),
  proofUrl: z.string().url().nullable().optional(),
  note: z.string().trim().max(300).nullable().optional(),
});

// PATCH /api/admin/withdrawals/[id] — mark as transferred (PAID) or reject (amount returns to the user)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const parsed = Input.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    const { action, proofUrl, note } = parsed.data;
    if (action === "PAID") await markWithdrawalPaid(id, proofUrl ?? null, note ?? null);
    else await rejectWithdrawal(id, note ?? null);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof WithdrawalError) return NextResponse.json({ error: "WITHDRAWAL_STATE", message: error.message }, { status: 409 });
    return apiErrorResponse(error, "Gagal memproses penarikan");
  }
}
