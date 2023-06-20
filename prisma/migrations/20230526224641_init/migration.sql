/*
  Warnings:

  - You are about to drop the `TeamStats` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TeamStats" DROP CONSTRAINT "TeamStats_leaderboardId_fkey";

-- DropForeignKey
ALTER TABLE "TeamStats" DROP CONSTRAINT "TeamStats_teamId_fkey";

-- DropTable
DROP TABLE "TeamStats";

-- CreateTable
CREATE TABLE "teamstats" (
    "id" TEXT NOT NULL,
    "leaderboardId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "draws" INTEGER NOT NULL,
    "goalsFor" INTEGER NOT NULL,
    "goalsAgainst" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teamstats_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "teamstats" ADD CONSTRAINT "teamstats_leaderboardId_fkey" FOREIGN KEY ("leaderboardId") REFERENCES "leaderboards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teamstats" ADD CONSTRAINT "teamstats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
