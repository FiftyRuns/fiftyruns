-- Add garminConnectedAt column to track when a user connected Garmin OAuth
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "garminConnectedAt" TIMESTAMP(3);
