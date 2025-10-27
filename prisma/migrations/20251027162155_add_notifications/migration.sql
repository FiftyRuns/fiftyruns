-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('REACTION', 'COMMENT', 'TEAM', 'RUN', 'SYSTEM', 'INTEGRATION');

-- CreateEnum
CREATE TYPE "NotificationActionType" AS ENUM ('TEAM_JOIN_REQUEST');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "data" JSONB,
    "actionType" "NotificationActionType",
    "actionPayload" JSONB,
    "joinRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_joinRequestId_idx" ON "Notification"("joinRequestId");

-- AddForeignKey
ALTER TABLE "ReadNotification" ADD CONSTRAINT "ReadNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_joinRequestId_fkey" FOREIGN KEY ("joinRequestId") REFERENCES "GroupJoinRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
