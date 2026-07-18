/**
 * Fire-and-forget middleware: triggers background Strava sync when data is stale.
 * Does not block - continues immediately and serves current DB data.
 * UI uses GET /v1/ensure-fresh/:userId to poll and invalidate queries when sync completes.
 */
export async function ensureFreshMiddleware(c, next) {
  const userId = c.req.param('userId');
  if (userId) {
    const { ingestService } = c.get('services');
    ingestService.syncIfStale(userId, (p) => c.executionCtx.waitUntil(p));
  }
  await next();
}
