-- AlterTable
ALTER TABLE "User" ADD COLUMN     "garminOAuth2AccessToken" TEXT,
ADD COLUMN     "garminOAuth2RefreshToken" TEXT,
ADD COLUMN     "garminOAuth2TokenExpiry" TIMESTAMP(3),
ADD COLUMN     "garminUserId" TEXT;

-- CreateTable
CREATE TABLE "GarminOAuth2" (
    "id" TEXT NOT NULL,
    "codeVerifier" TEXT NOT NULL,
    "state" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',

    CONSTRAINT "GarminOAuth2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GarminTokenExchange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oauth1Token" TEXT NOT NULL,
    "exchangeAttempted" BOOLEAN NOT NULL DEFAULT false,
    "exchangeSuccess" BOOLEAN,
    "exchangeError" TEXT,
    "exchangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GarminTokenExchange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GarminOAuth2_userId_key" ON "GarminOAuth2"("userId");

-- CreateIndex
CREATE INDEX "GarminOAuth2_expiresAt_idx" ON "GarminOAuth2"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "GarminTokenExchange_userId_key" ON "GarminTokenExchange"("userId");

-- CreateIndex
CREATE INDEX "GarminTokenExchange_exchangeSuccess_idx" ON "GarminTokenExchange"("exchangeSuccess");

-- CreateIndex
CREATE INDEX "GarminTokenExchange_createdAt_idx" ON "GarminTokenExchange"("createdAt");

-- CreateIndex
CREATE INDEX "User_garminUserId_idx" ON "User"("garminUserId");

-- AddForeignKey
ALTER TABLE "GarminOAuth2" ADD CONSTRAINT "GarminOAuth2_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GarminTokenExchange" ADD CONSTRAINT "GarminTokenExchange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
