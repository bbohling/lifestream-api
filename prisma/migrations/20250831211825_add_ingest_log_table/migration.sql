-- CreateTable
CREATE TABLE "ingest_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "added" INTEGER,
    "updated" INTEGER,
    "komsAdded" INTEGER,
    "error" TEXT,
    "duration" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ingest_logs_userId_idx" ON "ingest_logs"("userId");

-- CreateIndex
CREATE INDEX "ingest_logs_timestamp_idx" ON "ingest_logs"("timestamp");

-- CreateIndex
CREATE INDEX "ingest_logs_success_idx" ON "ingest_logs"("success");
