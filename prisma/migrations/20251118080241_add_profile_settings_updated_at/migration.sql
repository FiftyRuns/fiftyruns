-- AlterTable
ALTER TABLE "GarminOAuth2" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + INTERVAL '10 minutes';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileSettingsUpdatedAt" TIMESTAMP(3);
