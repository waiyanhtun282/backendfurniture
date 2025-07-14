/*
  Warnings:

  - You are about to drop the column `randToken` on the `User` table. All the data in the column will be lost.
  - Added the required column `randomToken` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "randToken",
ADD COLUMN     "randomToken" TEXT NOT NULL;
