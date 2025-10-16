-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('public', 'protected', 'private');

-- CreateEnum
CREATE TYPE "DonationMultiplier" AS ENUM ('x1', 'x2', 'x5', 'x10');

-- CreateEnum
CREATE TYPE "ChallengeGoalType" AS ENUM ('DISTANCE', 'TIME', 'RUNS');

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameId" TEXT NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "password" TEXT NOT NULL,
    "passwordResetToken" TEXT,
    "passwordResetTokenExpiry" TIMESTAMP(3),
    "image" TEXT,
    "runDonationMultiplier" "DonationMultiplier",
    "runDonationMultiplierAskAgain" TIMESTAMP(3),
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "garminAccessToken" TEXT,
    "garminAccessTokenSecret" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GarminAuth" (
    "oauthToken" TEXT NOT NULL,
    "oauthTokenSecret" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GarminAuth_pkey" PRIMARY KEY ("oauthToken")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Posting" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "text" TEXT,
    "image" TEXT,
    "userId" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'protected',
    "runningExerciseId" TEXT,
    "season" TEXT NOT NULL,

    CONSTRAINT "Posting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "postingId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "postingId" TEXT,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "amountInCent" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postingId" TEXT NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunningExercise" (
    "id" TEXT NOT NULL,
    "distanceInMeters" INTEGER NOT NULL,
    "durationInSeconds" INTEGER NOT NULL,
    "postingId" TEXT NOT NULL,
    "garminActivityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunningExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunningStatistic" (
    "id" TEXT NOT NULL,
    "numberOfRuns" INTEGER NOT NULL,
    "distanceInMeters" INTEGER NOT NULL,
    "durationInSeconds" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "season" TEXT NOT NULL,

    CONSTRAINT "RunningStatistic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameId" TEXT NOT NULL,
    "description" TEXT,
    "prize" TEXT,
    "image" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "goalType" "ChallengeGoalType" NOT NULL,
    "goalDistanceMeters" INTEGER,
    "goalDurationSeconds" INTEGER,
    "goalRuns" INTEGER,
    "minDistanceMeters" INTEGER,
    "minDurationSeconds" INTEGER,
    "visibility" "Visibility" NOT NULL DEFAULT 'public',
    "sponsorLogos" TEXT[],
    "adminUserId" TEXT NOT NULL,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeMember" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeHighscore" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "runsCount" INTEGER NOT NULL DEFAULT 0,
    "distanceInMeters" INTEGER NOT NULL DEFAULT 0,
    "durationInSeconds" INTEGER NOT NULL DEFAULT 0,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeHighscore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Group_nameId_key" ON "Group"("nameId");

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_nameId_key" ON "User"("nameId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_emailVerificationToken_idx" ON "User"("emailVerificationToken");

-- CreateIndex
CREATE INDEX "User_runDonationMultiplierAskAgain_runDonationMultiplier_idx" ON "User"("runDonationMultiplierAskAgain", "runDonationMultiplier");

-- CreateIndex
CREATE UNIQUE INDEX "User_nameId_email_key" ON "User"("nameId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "GarminAuth_userId_key" ON "GarminAuth"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_userId_postingId_key" ON "Reaction"("userId", "postingId");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_postingId_key" ON "Donation"("postingId");

-- CreateIndex
CREATE UNIQUE INDEX "RunningExercise_postingId_key" ON "RunningExercise"("postingId");

-- CreateIndex
CREATE UNIQUE INDEX "RunningExercise_garminActivityId_key" ON "RunningExercise"("garminActivityId");

-- CreateIndex
CREATE UNIQUE INDEX "RunningStatistic_userId_key" ON "RunningStatistic"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadNotification_userId_notificationId_key" ON "ReadNotification"("userId", "notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "Challenge_nameId_key" ON "Challenge"("nameId");

-- CreateIndex
CREATE INDEX "Challenge_startAt_endAt_idx" ON "Challenge"("startAt", "endAt");

-- CreateIndex
CREATE INDEX "Challenge_visibility_idx" ON "Challenge"("visibility");

-- CreateIndex
CREATE INDEX "ChallengeMember_userId_idx" ON "ChallengeMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeMember_challengeId_userId_key" ON "ChallengeMember"("challengeId", "userId");

-- CreateIndex
CREATE INDEX "ChallengeHighscore_progressPercent_idx" ON "ChallengeHighscore"("progressPercent");

-- CreateIndex
CREATE UNIQUE INDEX "ChallengeHighscore_challengeId_userId_key" ON "ChallengeHighscore"("challengeId", "userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GarminAuth" ADD CONSTRAINT "GarminAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Posting" ADD CONSTRAINT "Posting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "Posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "Posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "Posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunningExercise" ADD CONSTRAINT "RunningExercise_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "Posting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunningStatistic" ADD CONSTRAINT "RunningStatistic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadNotification" ADD CONSTRAINT "ReadNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeMember" ADD CONSTRAINT "ChallengeMember_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeMember" ADD CONSTRAINT "ChallengeMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeHighscore" ADD CONSTRAINT "ChallengeHighscore_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeHighscore" ADD CONSTRAINT "ChallengeHighscore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
