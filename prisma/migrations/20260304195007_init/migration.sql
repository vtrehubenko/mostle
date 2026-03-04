/*
  Warnings:

  - You are about to drop the column `date` on the `DailyGame` table. All the data in the column will be lost.
  - You are about to drop the column `dailyGameId` on the `GameObject` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dateKey]` on the table `DailyGame` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dateKey` to the `DailyGame` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GameObject" DROP CONSTRAINT "GameObject_dailyGameId_fkey";

-- DropIndex
DROP INDEX "DailyGame_date_key";

-- AlterTable
ALTER TABLE "DailyGame" DROP COLUMN "date",
ADD COLUMN     "dateKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "GameObject" DROP COLUMN "dailyGameId";

-- CreateTable
CREATE TABLE "_DailyGameToGameObject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DailyGameToGameObject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DailyGameToGameObject_B_index" ON "_DailyGameToGameObject"("B");

-- CreateIndex
CREATE UNIQUE INDEX "DailyGame_dateKey_key" ON "DailyGame"("dateKey");

-- AddForeignKey
ALTER TABLE "_DailyGameToGameObject" ADD CONSTRAINT "_DailyGameToGameObject_A_fkey" FOREIGN KEY ("A") REFERENCES "DailyGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DailyGameToGameObject" ADD CONSTRAINT "_DailyGameToGameObject_B_fkey" FOREIGN KEY ("B") REFERENCES "GameObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
