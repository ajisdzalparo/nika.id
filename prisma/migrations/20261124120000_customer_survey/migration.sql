-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recommend" INTEGER,
    "source" TEXT,
    "designScore" INTEGER,
    "easeScore" INTEGER,
    "priceScore" INTEGER,
    "wish" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SurveyResponse_userId_createdAt_idx" ON "SurveyResponse"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SurveyResponse_status_createdAt_idx" ON "SurveyResponse"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
