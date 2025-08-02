/*
  Warnings:

  - You are about to drop the column `gear` on the `activities` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "gears" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "resourceState" INTEGER NOT NULL,
    "distance" REAL,
    "brandName" TEXT,
    "modelName" TEXT,
    "frameType" INTEGER,
    "description" TEXT,
    "athleteId" BIGINT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_activities" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "athleteId" BIGINT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "distance" REAL,
    "movingTime" INTEGER,
    "elapsedTime" INTEGER,
    "totalElevationGain" REAL,
    "elevationHigh" REAL,
    "elevationLow" REAL,
    "activityType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "achievementCount" INTEGER,
    "prCount" INTEGER,
    "trainer" BOOLEAN NOT NULL DEFAULT false,
    "commute" BOOLEAN NOT NULL DEFAULT false,
    "gearId" TEXT,
    "averageSpeed" REAL,
    "maxSpeed" REAL,
    "averageCadence" REAL,
    "averageTemperature" REAL,
    "averageWatts" REAL,
    "maxWatts" INTEGER,
    "weightedAverageWatts" INTEGER,
    "kilojoules" REAL,
    "deviceWatts" BOOLEAN,
    "averageHeartRate" REAL,
    "maxHeartRate" INTEGER,
    "sufferScore" INTEGER NOT NULL DEFAULT 0,
    "segmentEfforts" TEXT DEFAULT '[]',
    "komCount" INTEGER NOT NULL DEFAULT 0,
    "bestKomRank" INTEGER,
    "bestPrRank" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "activities_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "users" ("athleteId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "activities_gearId_fkey" FOREIGN KEY ("gearId") REFERENCES "gears" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_activities" ("achievementCount", "activityType", "athleteId", "averageCadence", "averageHeartRate", "averageSpeed", "averageTemperature", "averageWatts", "bestKomRank", "bestPrRank", "commute", "createdAt", "deviceWatts", "distance", "elapsedTime", "elevationHigh", "elevationLow", "id", "kilojoules", "komCount", "maxHeartRate", "maxSpeed", "maxWatts", "movingTime", "name", "prCount", "segmentEfforts", "startDate", "sufferScore", "totalElevationGain", "trainer", "updatedAt", "weightedAverageWatts") SELECT "achievementCount", "activityType", "athleteId", "averageCadence", "averageHeartRate", "averageSpeed", "averageTemperature", "averageWatts", "bestKomRank", "bestPrRank", "commute", "createdAt", "deviceWatts", "distance", "elapsedTime", "elevationHigh", "elevationLow", "id", "kilojoules", "komCount", "maxHeartRate", "maxSpeed", "maxWatts", "movingTime", "name", "prCount", "segmentEfforts", "startDate", "sufferScore", "totalElevationGain", "trainer", "updatedAt", "weightedAverageWatts" FROM "activities";
DROP TABLE "activities";
ALTER TABLE "new_activities" RENAME TO "activities";
CREATE INDEX "activities_athleteId_idx" ON "activities"("athleteId");
CREATE INDEX "activities_startDate_idx" ON "activities"("startDate");
CREATE INDEX "activities_activityType_idx" ON "activities"("activityType");
CREATE INDEX "activities_athleteId_activityType_idx" ON "activities"("athleteId", "activityType");
CREATE INDEX "activities_athleteId_startDate_idx" ON "activities"("athleteId", "startDate");
CREATE INDEX "activities_komCount_idx" ON "activities"("komCount");
CREATE INDEX "activities_bestKomRank_idx" ON "activities"("bestKomRank");
CREATE INDEX "activities_athleteId_komCount_idx" ON "activities"("athleteId", "komCount");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "gears_athleteId_idx" ON "gears"("athleteId");
