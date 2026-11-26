-- CreateTable
CREATE TABLE "MarketplaceInterest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "priceBand" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceInterest_userId_key" ON "MarketplaceInterest"("userId");

-- CreateIndex
CREATE INDEX "MarketplaceInterest_role_idx" ON "MarketplaceInterest"("role");

-- AddForeignKey
ALTER TABLE "MarketplaceInterest" ADD CONSTRAINT "MarketplaceInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
