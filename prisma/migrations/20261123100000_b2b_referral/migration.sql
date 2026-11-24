-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "clientEditToken" TEXT,
ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "clientWhatsapp" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referralCodeUsed" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" TEXT NOT NULL DEFAULT 'PERSONAL',
ADD COLUMN     "agencyInstagram" TEXT,
ADD COLUMN     "agencyLogo" TEXT,
ADD COLUMN     "agencyName" TEXT,
ADD COLUMN     "agencyQuota" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "agencyQuotaExpiresAt" TIMESTAMP(3),
ADD COLUMN     "agencyVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "agencyWhatsapp" TEXT,
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referredById" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_clientEditToken_key" ON "Invitation"("clientEditToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
