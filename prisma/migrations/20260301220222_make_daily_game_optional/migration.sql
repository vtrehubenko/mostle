-- DropForeignKey
ALTER TABLE "GameObject" DROP CONSTRAINT "GameObject_dailyGameId_fkey";

-- DropIndex
DROP INDEX "GameObject_dailyGameId_idx";

-- AlterTable
ALTER TABLE "GameObject" ALTER COLUMN "dailyGameId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "GameObject" ADD CONSTRAINT "GameObject_dailyGameId_fkey" FOREIGN KEY ("dailyGameId") REFERENCES "DailyGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;
