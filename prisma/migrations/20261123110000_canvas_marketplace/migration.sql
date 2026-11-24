-- AlterTable
ALTER TABLE "CatalogTemplate" ADD COLUMN     "creatorId" TEXT,
ADD COLUMN     "platformFeePct" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewStatus" TEXT NOT NULL DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "TemplatePurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "transactionId" TEXT,
    "price" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "creatorShare" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplatePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemplatePurchase_transactionId_key" ON "TemplatePurchase"("transactionId");

-- CreateIndex
CREATE INDEX "TemplatePurchase_userId_idx" ON "TemplatePurchase"("userId");

-- CreateIndex
CREATE INDEX "TemplatePurchase_templateId_idx" ON "TemplatePurchase"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplatePurchase_invitationId_templateId_key" ON "TemplatePurchase"("invitationId", "templateId");

-- CreateIndex
CREATE INDEX "CatalogTemplate_creatorId_idx" ON "CatalogTemplate"("creatorId");

-- CreateIndex
CREATE INDEX "CatalogTemplate_reviewStatus_idx" ON "CatalogTemplate"("reviewStatus");

-- AddForeignKey
ALTER TABLE "CatalogTemplate" ADD CONSTRAINT "CatalogTemplate_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "TemplatePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "TemplatePurchase_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "TemplatePurchase_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CatalogTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
