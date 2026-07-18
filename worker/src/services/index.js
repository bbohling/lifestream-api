import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';

import { StravaService } from './stravaService.js';
import { ActivityService } from './activityService.js';
import { IngestService } from './ingestService.js';
import { ReportService } from './reportService.js';
import { KomService } from './komService.js';
import { BulkSyncManager } from './bulkSyncManager.js';

/**
 * Build the per-request service graph. Workers get a fresh PrismaClient on
 * every request (D1 adapter is cheap to construct; no connection pool).
 */
export function createServices(env) {
  const adapter = new PrismaD1(env.DB);
  const prisma = new PrismaClient({ adapter });

  const stravaService = new StravaService({
    clientId: env.STRAVA_CLIENT_ID,
    clientSecret: env.STRAVA_CLIENT_SECRET,
    prisma,
  });
  const activityService = new ActivityService(prisma);
  const ingestService = new IngestService(stravaService, activityService);
  const reportService = new ReportService(activityService);
  const komService = new KomService(prisma);
  const bulkSyncManager = new BulkSyncManager(prisma, stravaService, activityService);

  return {
    prisma,
    stravaService,
    activityService,
    ingestService,
    reportService,
    komService,
    bulkSyncManager,
  };
}
