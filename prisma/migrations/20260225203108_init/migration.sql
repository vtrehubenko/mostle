-- CreateTable
CREATE TABLE "DailyGame" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "theme" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameObject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "oldest" INTEGER NOT NULL,
    "largest" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "influence" INTEGER NOT NULL,
    "extreme" INTEGER NOT NULL,
    "dailyGameId" TEXT NOT NULL,

    CONSTRAINT "GameObject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyGame_date_key" ON "DailyGame"("date");

-- CreateIndex
CREATE INDEX "GameObject_dailyGameId_idx" ON "GameObject"("dailyGameId");

-- AddForeignKey
ALTER TABLE "GameObject" ADD CONSTRAINT "GameObject_dailyGameId_fkey" FOREIGN KEY ("dailyGameId") REFERENCES "DailyGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
