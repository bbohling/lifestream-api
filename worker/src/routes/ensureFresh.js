import { Hono } from 'hono';

const ensureFresh = new Hono();

/**
 * GET /v1/ensure-fresh/:userId
 * Returns immediately with { fresh: true } or { fresh: false, syncing: true }.
 * When stale, triggers background Strava sync. UI can poll until fresh, then invalidate queries.
 */
ensureFresh.get('/:userId', async (c) => {
  const userId = c.req.param('userId');
  if (!userId) {
    return c.json({ error: 'No user provided.' }, 400);
  }
  const { ingestService } = c.get('services');
  const status = await ingestService.checkFreshStatus(userId, (p) => c.executionCtx.waitUntil(p));
  return c.json(status);
});

export default ensureFresh;
