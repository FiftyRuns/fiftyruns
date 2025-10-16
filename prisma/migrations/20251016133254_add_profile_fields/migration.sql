-- AlterTable
ALTER TABLE "User" ADD COLUMN     "autoDonate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "donationUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "profileVisibility" "Visibility" NOT NULL DEFAULT 'protected';
