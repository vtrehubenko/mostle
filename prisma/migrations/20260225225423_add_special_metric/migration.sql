/*
  Warnings:

  - You are about to drop the column `extreme` on the `GameObject` table. All the data in the column will be lost.
  - Added the required column `specialHint` to the `DailyGame` table without a default value. This is not possible if the table is not empty.
  - Added the required column `specialLabel` to the `DailyGame` table without a default value. This is not possible if the table is not empty.
  - Added the required column `specialValue` to the `GameObject` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DailyGame" ADD COLUMN     "specialHint" TEXT NOT NULL,
ADD COLUMN     "specialLabel" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "GameObject" DROP COLUMN "extreme",
ADD COLUMN     "specialValue" INTEGER NOT NULL;
