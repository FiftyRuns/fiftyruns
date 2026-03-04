-- AlterTable
ALTER TABLE "GarminOAuth2" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '10 minutes';

-- CreateIndex
CREATE INDEX "Comment_postingId_idx" ON "Comment"("postingId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Posting_userId_idx" ON "Posting"("userId");

-- CreateIndex
CREATE INDEX "Posting_date_id_idx" ON "Posting"("date", "id");
