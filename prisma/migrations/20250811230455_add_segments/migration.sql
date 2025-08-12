/*
  Warnings:

  - Made the column `id` on table `segments` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_segments" (
    "id" BIGINT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "komAthleteId" BIGINT,
    "komRank" INTEGER,
    "distance" REAL,
    "averageGrade" REAL,
    "maximumGrade" REAL,
    "elevationHigh" REAL,
    "elevationLow" REAL,
    "startLatLng" TEXT,
    "endLatLng" TEXT,
    "starred" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_segments" ("averageGrade", "createdAt", "distance", "elevationHigh", "elevationLow", "endLatLng", "id", "komAthleteId", "komRank", "lastUpdated", "maximumGrade", "name", "starred", "startLatLng", "updatedAt") SELECT "averageGrade", coalesce("createdAt", CURRENT_TIMESTAMP) AS "createdAt", "distance", "elevationHigh", "elevationLow", "endLatLng", "id", "komAthleteId", "komRank", coalesce("lastUpdated", CURRENT_TIMESTAMP) AS "lastUpdated", "maximumGrade", "name", coalesce("starred", false) AS "starred", "startLatLng", coalesce("updatedAt", CURRENT_TIMESTAMP) AS "updatedAt" FROM "segments";
DROP TABLE "segments";
ALTER TABLE "new_segments" RENAME TO "segments";
CREATE INDEX "segments_komAthleteId_idx" ON "segments"("komAthleteId");
CREATE INDEX "segments_lastUpdated_idx" ON "segments"("lastUpdated");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
