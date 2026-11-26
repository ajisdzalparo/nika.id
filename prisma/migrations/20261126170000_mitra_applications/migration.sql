-- CreateTable
CREATE TABLE "MitraApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "applicantType" TEXT NOT NULL DEFAULT 'USAHA',
    "businessName" TEXT,
    "businessKind" TEXT,
    "instagram" TEXT,
    "city" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MitraApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MitraApplication_status_createdAt_idx" ON "MitraApplication"("status", "createdAt");
CREATE INDEX "MitraApplication_email_idx" ON "MitraApplication"("email");
CREATE INDEX "MitraApplication_userId_idx" ON "MitraApplication"("userId");

-- AddForeignKey
ALTER TABLE "MitraApplication" ADD CONSTRAINT "MitraApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Mitra is now granted by an admin only. Accounts that are already mitra keep their status, marked verified.
UPDATE "User" SET "agencyVerified" = true WHERE "accountType" = 'AGENCY';
