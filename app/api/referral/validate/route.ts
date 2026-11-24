import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { resolveReferralForBuyer, sanitizeReferralCode } from "@/lib/referral";

// GET /api/referral/validate?code=... — checks referral code eligibility for checkout or registration preview
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clean = sanitizeReferralCode(searchParams.get("code"));
  if (!clean) {
    return NextResponse.json({ valid: false, message: "Masukkan kode referral." }, { status: 400 });
  }

  const session = await getSession(request, "user");
  if (!session) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: clean },
      select: { name: true, referralCode: true },
    });
    if (!referrer) {
      return NextResponse.json({ valid: false, message: "Kode referral tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({
      valid: true,
      code: referrer.referralCode,
      referrerName: referrer.name || "Mitra SatuMoment",
    });
  }

  const res = await resolveReferralForBuyer({
    buyerId: session.user.id,
    buyerEmail: session.user.email,
    rawCode: clean,
  });

  if (!res.valid) {
    return NextResponse.json({ valid: false, message: res.reason || "Kode referral tidak valid." }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    code: res.code,
    referrerName: res.referrerName,
  });
}
