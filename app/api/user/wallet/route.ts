import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { getUserBalance, LEDGER_ACCOUNT, MIN_WITHDRAWAL, requestWithdrawal, WithdrawalError } from "@/lib/ledger";
import { featureBlockedResponse } from "@/lib/feature-guard";

// GET /api/user/wallet — balance, earnings history and withdrawals of the signed-in user
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const userId = session.user.id;
    const [balance, entries, withdrawals] = await Promise.all([
      getUserBalance(userId),
      prisma.ledgerEntry.findMany({
        where: { userId, account: LEDGER_ACCOUNT.earnings },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, type: true, source: true, amount: true, availableAt: true, note: true, createdAt: true },
      }),
      prisma.withdrawalRequest.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 }),
    ]);
    return NextResponse.json({ balance, entries, withdrawals, minWithdrawal: MIN_WITHDRAWAL });
  } catch (error) {
    return apiErrorResponse(error, "Gagal memuat dompet");
  }
}

const WithdrawInput = z.object({
  amount: z.number().int().positive(),
  method: z.enum(["BANK", "EWALLET"]),
  provider: z.string().trim().min(2, "Nama bank/e-wallet wajib diisi").max(40),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d+$/, "Nomor rekening/akun hanya boleh berisi angka")
    .min(5, "Nomor rekening/akun tidak valid")
    .max(40),
  accountName: z.string().trim().min(2, "Nama pemilik wajib diisi").max(100),
});

// POST /api/user/wallet — request a withdrawal of available earnings
export async function POST(request: Request) {
  const blocked = await featureBlockedResponse("DOMPET");
  if (blocked) return blocked;

  try {
    const session = await requireAuth(request);
    const parsed = WithdrawInput.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });
    }
    const wd = await requestWithdrawal(session.user.id, parsed.data);
    return NextResponse.json({ withdrawal: wd }, { status: 201 });
  } catch (error) {
    if (error instanceof WithdrawalError) return NextResponse.json({ error: "WITHDRAWAL_REJECTED", message: error.message }, { status: 400 });
    return apiErrorResponse(error, "Gagal mengajukan penarikan");
  }
}
