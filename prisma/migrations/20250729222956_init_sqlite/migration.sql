-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "athleteId" BIGINT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
    "gear" TEXT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "activities_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "users" ("athleteId") ON DELETE RESTRICT ON UPDATE CASCADE
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
