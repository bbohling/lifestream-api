-- Migration: Add segments model for Strava segment data
CREATE TABLE "segments" (
  "id" BIGINT PRIMARY KEY, -- Strava segment ID
  "name" TEXT NOT NULL,
  "komAthleteId" BIGINT, -- Athlete ID of current KOM holder
  "komRank" INT, -- Rank of KOM (should be 1 for true KOM)
  "distance" FLOAT, -- Segment distance in miles
  "averageGrade" FLOAT, -- Average grade (%)
  "maximumGrade" FLOAT, -- Maximum grade (%)
  "elevationHigh" FLOAT, -- Highest elevation in feet
  "elevationLow" FLOAT, -- Lowest elevation in feet
  "startLatLng" TEXT, -- JSON array [lat, lng]
  "endLatLng" TEXT, -- JSON array [lat, lng]
  "starred" BOOLEAN DEFAULT false,
  "lastUpdated" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "idx_segments_komAthleteId" ON "segments" ("komAthleteId");
CREATE INDEX "idx_segments_lastUpdated" ON "segments" ("lastUpdated");
