/*
  Warnings:

  - A unique constraint covering the columns `[stravaActivityId]` on the table `RunningExercise` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ActivitySource" AS ENUM ('MANUAL', 'GARMIN', 'STRAVA');

-- AlterTable
ALTER TABLE "GarminOAuth2" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '10 minutes';

-- AlterTable
ALTER TABLE "RunningExercise" ADD COLUMN     "source" "ActivitySource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "stravaActivityId" TEXT;

-- CreateTable
CREATE TABLE "StravaWebhookSubscription" (
    "id" TEXT NOT NULL,
    "stravaSubscriptionId" INTEGER NOT NULL,
    "callbackUrl" TEXT NOT NULL,
    "verifyToken" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StravaWebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StravaWebhookEvent" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "objectType" TEXT NOT NULL,
    "aspectType" TEXT NOT NULL,
    "objectId" TEXT,
    "ownerId" TEXT,
    "subscriptionId" INTEGER,
    "updates" JSONB,
    "signatureValid" BOOLEAN,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "StravaWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StravaWebhookSubscription_stravaSubscriptionId_key" ON "StravaWebhookSubscription"("stravaSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "StravaWebhookEvent_deliveryId_key" ON "StravaWebhookEvent"("deliveryId");

-- CreateIndex
CREATE INDEX "StravaWebhookEvent_objectId_idx" ON "StravaWebhookEvent"("objectId");

-- CreateIndex
CREATE INDEX "StravaWebhookEvent_ownerId_idx" ON "StravaWebhookEvent"("ownerId");

-- CreateIndex
CREATE INDEX "StravaWebhookEvent_processedAt_idx" ON "StravaWebhookEvent"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RunningExercise_stravaActivityId_key" ON "RunningExercise"("stravaActivityId");

-- CreateIndex
CREATE INDEX "RunningExercise_source_idx" ON "RunningExercise"("source");
