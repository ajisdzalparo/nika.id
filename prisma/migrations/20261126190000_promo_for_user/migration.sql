-- A promo code can be restricted to one account (mitra trial codes)
ALTER TABLE "PromoCode" ADD COLUMN "forUserId" TEXT;
