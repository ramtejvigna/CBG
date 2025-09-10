/*
  Warnings:

  - You are about to drop the column `prizeMoney` on the `Contest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Contest" DROP COLUMN "prizeMoney",
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;
