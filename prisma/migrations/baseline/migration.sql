-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "athleteId" BIGINT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "activities" (
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

-- CreateTable
CREATE TABLE "raw_activities" (
    "activityId" BIGINT NOT NULL PRIMARY KEY,
    "rawData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "raw_activities_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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

-- CreateTable
CREATE TABLE "rate_limit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endpoint" TEXT NOT NULL,
    "overallLimit15min" INTEGER NOT NULL,
    "overallLimitDaily" INTEGER NOT NULL,
    "overallUsage15min" INTEGER NOT NULL,
    "overallUsageDaily" INTEGER NOT NULL,
    "readLimit15min" INTEGER NOT NULL,
    "readLimitDaily" INTEGER NOT NULL,
    "readUsage15min" INTEGER NOT NULL,
    "readUsageDaily" INTEGER NOT NULL,
    "maxUtilizationPercent" REAL NOT NULL,
    "delayAppliedMs" INTEGER NOT NULL DEFAULT 0,
    "wasRateLimited" BOOLEAN NOT NULL DEFAULT false,
    "retryAfterMs" INTEGER
);

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

-- CreateIndex
CREATE UNIQUE INDEX "users_name_key" ON "users"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_athleteId_key" ON "users"("athleteId");

-- CreateIndex
CREATE INDEX "activities_athleteId_idx" ON "activities"("athleteId");

-- CreateIndex
CREATE INDEX "activities_startDate_idx" ON "activities"("startDate");

-- CreateIndex
CREATE INDEX "activities_activityType_idx" ON "activities"("activityType");

-- CreateIndex
CREATE INDEX "activities_athleteId_activityType_idx" ON "activities"("athleteId", "activityType");

-- CreateIndex
CREATE INDEX "activities_athleteId_startDate_idx" ON "activities"("athleteId", "startDate");

-- CreateIndex
CREATE INDEX "activities_komCount_idx" ON "activities"("komCount");

-- CreateIndex
CREATE INDEX "activities_bestKomRank_idx" ON "activities"("bestKomRank");

-- CreateIndex
CREATE INDEX "activities_athleteId_komCount_idx" ON "activities"("athleteId", "komCount");

-- CreateIndex
CREATE UNIQUE INDEX "bulk_sync_states_userId_key" ON "bulk_sync_states"("userId");

-- CreateIndex
CREATE INDEX "bulk_sync_summaries_userId_idx" ON "bulk_sync_summaries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bulk_sync_summaries_userId_activityId_key" ON "bulk_sync_summaries"("userId", "activityId");

-- CreateIndex
CREATE INDEX "rate_limit_logs_timestamp_idx" ON "rate_limit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "rate_limit_logs_endpoint_idx" ON "rate_limit_logs"("endpoint");

-- CreateIndex
CREATE INDEX "rate_limit_logs_overallUsageDaily_idx" ON "rate_limit_logs"("overallUsageDaily");

-- CreateIndex
CREATE INDEX "rate_limit_logs_readUsageDaily_idx" ON "rate_limit_logs"("readUsageDaily");

-- CreateIndex
CREATE INDEX "gears_athleteId_idx" ON "gears"("athleteId");
