-- CreateTable
CREATE TABLE "InvitationMember" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitationMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvitationMember_invitationId_userId_key" ON "InvitationMember"("invitationId", "userId");
CREATE INDEX "InvitationMember_userId_idx" ON "InvitationMember"("userId");

-- AddForeignKey
ALTER TABLE "InvitationMember" ADD CONSTRAINT "InvitationMember_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvitationMember" ADD CONSTRAINT "InvitationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
