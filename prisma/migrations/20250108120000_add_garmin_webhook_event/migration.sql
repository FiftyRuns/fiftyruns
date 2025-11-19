-- CreateTable
CREATE TABLE "GarminWebhookEvent" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "GarminWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GarminWebhookEvent_processedAt_idx" ON "GarminWebhookEvent"("processedAt");



