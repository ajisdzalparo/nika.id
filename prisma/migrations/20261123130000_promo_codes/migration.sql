-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "promoCodeUsed" TEXT;

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "percentOff" INTEGER,
    "amountOff" INTEGER,
    "maxDiscount" INTEGER,
    "appliesTo" TEXT NOT NULL DEFAULT 'ALL',
    "minPurchase" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER,
    "perUserLimit" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- Starter code for the Mitra launch: 20% off the first Mitra pack, once per account
INSERT INTO "PromoCode" ("id", "code", "description", "percentOff", "appliesTo", "perUserLimit", "updatedAt")
VALUES ('promo_mitrabaru', 'MITRABARU', 'Diskon 20% paket Mitra pertama', 20, 'AGENCY_QUOTA', 1, CURRENT_TIMESTAMP);
