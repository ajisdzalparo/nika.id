import { NextResponse } from "next/server";
import { apiErrorResponse, requireAuth } from "@/lib/auth-helpers";
import { getUserReferralSummary, updateUserReferralCode } from "@/lib/referral";

// GET /api/user/referral — returns referral code, stats, and commission history
export async function GET(request: Request) {
  try {
    const session = await requireAuth(request);
    const summary = await getUserReferralSummary(session.user.id);
    return NextResponse.json(summary);
  } catch (error) {
    return apiErrorResponse(error, "Gagal memuat data referral");
  }
}

// PATCH /api/user/referral { code } — customize user's referral code
export async function PATCH(request: Request) {
  try {
    const session = await requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const rawCode = typeof body?.code === "string" ? body.code : "";
    const res = await updateUserReferralCode(session.user.id, rawCode);
    if (!res.ok) {
      return NextResponse.json({ error: "INVALID_CODE", message: res.message }, { status: 400 });
    }
    return NextResponse.json({ code: res.code });
  } catch (error) {
    return apiErrorResponse(error, "Gagal memperbarui kode referral");
  }
}
