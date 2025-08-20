-- CreateTable
CREATE TABLE "koms" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "athleteId" BIGINT NOT NULL,
    "activityId" BIGINT NOT NULL,
    "segmentId" BIGINT NOT NULL,
    "resourceState" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "elapsedTime" INTEGER NOT NULL,
    "movingTime" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "startDateLocal" DATETIME NOT NULL,
    "distance" REAL NOT NULL,
    "startIndex" INTEGER NOT NULL,
    "endIndex" INTEGER NOT NULL,
    "averageCadence" REAL,
    "deviceWatts" BOOLEAN,
    "averageWatts" REAL,
    "averageHeartrate" REAL,
    "maxHeartrate" INTEGER,
    "prRank" INTEGER,
    "komRank" INTEGER,
    "visibility" TEXT NOT NULL,
    "achievements" TEXT NOT NULL DEFAULT '[]',
    "segment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "koms_athleteId_idx" ON "koms"("athleteId");

-- CreateIndex
CREATE INDEX "koms_activityId_idx" ON "koms"("activityId");

-- CreateIndex
CREATE INDEX "koms_segmentId_idx" ON "koms"("segmentId");

-- CreateIndex
CREATE INDEX "koms_startDate_idx" ON "koms"("startDate");

-- CreateIndex
CREATE INDEX "koms_komRank_idx" ON "koms"("komRank");
