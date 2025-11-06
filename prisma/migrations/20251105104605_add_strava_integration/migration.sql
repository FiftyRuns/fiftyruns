/*
  Warnings:

  - A unique constraint covering the columns `[stravaAthleteId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GarminOAuth2" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '10 minutes';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stravaAccessToken" TEXT,
ADD COLUMN     "stravaAthleteId" TEXT,
ADD COLUMN     "stravaConnectedAt" TIMESTAMP(3),
ADD COLUMN     "stravaDeauthorizedAt" TIMESTAMP(3),
ADD COLUMN     "stravaRefreshToken" TEXT,
ADD COLUMN     "stravaScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "stravaTokenExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "StravaOAuthState" (
    "state" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StravaOAuthState_pkey" PRIMARY KEY ("state")
);

-- CreateIndex
CREATE INDEX "StravaOAuthState_expiresAt_idx" ON "StravaOAuthState"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_stravaAthleteId_key" ON "User"("stravaAthleteId");

-- AddForeignKey
ALTER TABLE "StravaOAuthState" ADD CONSTRAINT "StravaOAuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
