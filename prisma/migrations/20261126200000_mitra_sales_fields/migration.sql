-- Mitra sales report: client price, activation cost and activation time per invitation
ALTER TABLE "Invitation" ADD COLUMN "clientPrice" INTEGER;
ALTER TABLE "Invitation" ADD COLUMN "mitraCost" INTEGER;
ALTER TABLE "Invitation" ADD COLUMN "activatedAt" TIMESTAMP(3);
