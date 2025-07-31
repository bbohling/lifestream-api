-- CreateTable
CREATE TABLE "bulk_sync_states" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "athleteId" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "phase" TEXT NOT NULL DEFAULT 'summary_fetch',
    "totalActivities" INTEGER NOT NULL DEFAULT 0,
    "processedActivities" INTEGER NOT NULL DEFAULT 0,
    "processedSummaries" INTEGER NOT NULL DEFAULT 0,
    "requestsUsedToday" INTEGER NOT NULL DEFAULT 0,
    "currentPage" INTEGER NOT NULL DEFAULT 1,
    "processedActivityIds" TEXT NOT NULL DEFAULT '[]',
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastResetDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "bulk_sync_summaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "activityId" BIGINT NOT NULL,
    "summaryData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_raw_activities" (
    "activityId" BIGINT NOT NULL PRIMARY KEY,
    "rawData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "raw_activities_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_raw_activities" ("activityId", "createdAt", "rawData", "updatedAt") SELECT "activityId", "createdAt", "rawData", "updatedAt" FROM "raw_activities";
DROP TABLE "raw_activities";
ALTER TABLE "new_raw_activities" RENAME TO "raw_activities";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "bulk_sync_states_userId_key" ON "bulk_sync_states"("userId");

-- CreateIndex
CREATE INDEX "bulk_sync_summaries_userId_idx" ON "bulk_sync_summaries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bulk_sync_summaries_userId_activityId_key" ON "bulk_sync_summaries"("userId", "activityId");
