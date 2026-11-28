-- Couple testimonials for the landing page, moderated by admin
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "city" TEXT,
    "rating" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Testimonial_userId_key" ON "Testimonial"("userId");
CREATE INDEX "Testimonial_status_approvedAt_idx" ON "Testimonial"("status", "approvedAt");

ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
