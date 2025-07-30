-- AlterTable
ALTER TABLE "activities" ADD COLUMN "rawData" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "lastSyncAt" DATETIME;
