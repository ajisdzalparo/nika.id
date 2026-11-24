-- AlterTable
ALTER TABLE "RSVP" ADD COLUMN "note" TEXT,
ADD COLUMN "checkInToken" TEXT,
ADD COLUMN "checkedInAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "RSVP_checkInToken_key" ON "RSVP"("checkInToken");
