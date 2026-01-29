/*
  Warnings:

  - You are about to drop the column `needsOnboarding` on the `Session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Session" DROP COLUMN "needsOnboarding";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "needsOnboarding" BOOLEAN NOT NULL DEFAULT false;
