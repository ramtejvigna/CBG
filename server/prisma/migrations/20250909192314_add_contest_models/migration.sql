-- CreateEnum
CREATE TYPE "public"."ContestStatus" AS ENUM ('UPCOMING', 'REGISTRATION_OPEN', 'ONGOING', 'FINISHED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Contest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "registrationEnd" TIMESTAMP(3) NOT NULL,
    "status" "public"."ContestStatus" NOT NULL DEFAULT 'UPCOMING',
    "creatorId" TEXT NOT NULL,
    "tags" TEXT[],
    "prizeMoney" INTEGER NOT NULL DEFAULT 0,
    "maxParticipants" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContestParticipant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "points" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,

    CONSTRAINT "ContestParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContestChallenge" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ContestChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContestSubmission" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "contestChallengeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "status" "public"."SubmissionStatus" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "runtime" INTEGER,
    "memory" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testResults" JSONB,

    CONSTRAINT "ContestSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContestParticipant_userId_contestId_key" ON "public"."ContestParticipant"("userId", "contestId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestChallenge_contestId_challengeId_key" ON "public"."ContestChallenge"("contestId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestSubmission_participantId_contestChallengeId_key" ON "public"."ContestSubmission"("participantId", "contestChallengeId");

-- AddForeignKey
ALTER TABLE "public"."Contest" ADD CONSTRAINT "Contest_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContestParticipant" ADD CONSTRAINT "ContestParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContestParticipant" ADD CONSTRAINT "ContestParticipant_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "public"."Contest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContestChallenge" ADD CONSTRAINT "ContestChallenge_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "public"."Contest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContestChallenge" ADD CONSTRAINT "ContestChallenge_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContestSubmission" ADD CONSTRAINT "ContestSubmission_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "public"."ContestParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContestSubmission" ADD CONSTRAINT "ContestSubmission_contestChallengeId_fkey" FOREIGN KEY ("contestChallengeId") REFERENCES "public"."ContestChallenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContestSubmission" ADD CONSTRAINT "ContestSubmission_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "public"."Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
