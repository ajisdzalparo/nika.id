-- AlterTable
ALTER TABLE "Guest" ADD COLUMN     "eventName" TEXT,
ADD COLUMN     "greeting" TEXT,
ADD COLUMN     "guestType" TEXT NOT NULL DEFAULT 'REGULAR',
ADD COLUMN     "label" TEXT,
ADD COLUMN     "maxGuests" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "recipientType" TEXT NOT NULL DEFAULT 'PERSONAL',
ADD COLUMN     "rsvpEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Guest_invitationId_label_idx" ON "Guest"("invitationId", "label");
