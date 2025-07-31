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

-- CreateIndex
CREATE INDEX "rate_limit_logs_timestamp_idx" ON "rate_limit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "rate_limit_logs_endpoint_idx" ON "rate_limit_logs"("endpoint");

-- CreateIndex
CREATE INDEX "rate_limit_logs_overallUsageDaily_idx" ON "rate_limit_logs"("overallUsageDaily");

-- CreateIndex
CREATE INDEX "rate_limit_logs_readUsageDaily_idx" ON "rate_limit_logs"("readUsageDaily");
