import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { resolvePromoCode } from "@/lib/promo";
import { describePromo, sanitizePromoCode, type PromoCheckoutKind } from "@/lib/promo-shared";
import { resolveReferralForBuyer, sanitizeReferralCode } from "@/lib/referral";

const KINDS: PromoCheckoutKind[] = ["PLAN", "GUEST_ADDON", "AI_CREDIT", "AGENCY_QUOTA", "MARKETPLACE"];

// GET /api/promo/validate?code=..&kind=..&amount=.. — checks the checkout "Kode promo" field.
// Admin promo codes come first; anything else is tried as a user's referral code.
// The response carries the rule so the checkout can recompute the discount when the item changes;
// the server recomputes everything again when the order is created.
export async function GET(request: Request) {
  const session = await getSession(request, "user");
  if (!session) return NextResponse.json({ valid: false, message: "Silakan masuk dulu." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const code = sanitizePromoCode(searchParams.get("code"));
  const kindParam = searchParams.get("kind") as PromoCheckoutKind | null;
  const kind: PromoCheckoutKind = kindParam && KINDS.includes(kindParam) ? kindParam : "PLAN";
  const amount = Math.max(0, Number(searchParams.get("amount")) || 0);
  if (!code) return NextResponse.json({ valid: false, message: "Masukkan kode promo." }, { status: 400 });

  const promoRes = await resolvePromoCode(code, { userId: session.user.id, kind, basePrice: amount });
  if (promoRes.found) {
    if (!promoRes.valid) return NextResponse.json({ valid: false, message: promoRes.reason }, { status: 400 });
    const p = promoRes.promo;
    const rule = { percentOff: p.percentOff, amountOff: p.amountOff, maxDiscount: p.maxDiscount, appliesTo: p.appliesTo, minPurchase: p.minPurchase };
    return NextResponse.json({ valid: true, type: "PROMO", code: p.code, label: p.description || describePromo(rule), rule });
  }

  if (kind === "MARKETPLACE" || kind === "AI_CREDIT") {
    return NextResponse.json({ valid: false, message: "Kode promo tidak berlaku untuk pembelian ini." }, { status: 400 });
  }
  const refRes = await resolveReferralForBuyer({ buyerId: session.user.id, buyerEmail: session.user.email, rawCode: sanitizeReferralCode(code) });
  if (!refRes.valid || !refRes.code) {
    const exists = await prisma.user.findUnique({ where: { referralCode: sanitizeReferralCode(code) }, select: { id: true } });
    return NextResponse.json({ valid: false, message: exists ? refRes.reason || "Kode promo tidak berlaku." : "Kode promo tidak ditemukan." }, { status: 400 });
  }
  return NextResponse.json({ valid: true, type: "REFERRAL", code: refRes.code, label: `Kode dari ${refRes.referrerName || "teman"} · diskon 10% (maks Rp15rb)` });
}
