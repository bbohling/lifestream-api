import { Hono } from 'hono';
import { logger } from '../utils/logger.js';
import { ensureFreshMiddleware } from '../middleware/ensureFresh.js';

const koms = new Hono();

/**
 * GET /v1/koms/:userId
 * Get KOM activities for a user
 */
koms.get('/:userId', ensureFreshMiddleware, async (c) => {
  const userId = c.req.param('userId');
  const limit = c.req.query('limit') ?? '50';

  if (!userId) {
    return c.json({ error: 'No user provided.' }, 400);
  }

  logger.info(`Getting KOM activities for user: ${userId}`);

  const { activityService, komService } = c.get('services');
  const user = await activityService.getUserByName(userId);
  if (!user) {
    return c.json({ error: 'User not found.' }, 404);
  }

  // Fetch kom activities from the koms table (grouped by activity)
  const komActivities = await komService.getKomActivities(user.athleteId, parseInt(limit));

  return c.json({ activities: komActivities, total: komActivities.length });
});

/**
 * GET /v1/koms/:userId/stats
 * Get KOM statistics for a user
 */
koms.get('/:userId/stats', ensureFreshMiddleware, async (c) => {
  const userId = c.req.param('userId');

  if (!userId) {
    return c.json({ error: 'No user provided.' }, 400);
  }

  logger.info(`Getting KOM stats for user: ${userId}`);

  const { activityService, komService } = c.get('services');
  const user = await activityService.getUserByName(userId);
  if (!user) {
    return c.json({ error: 'User not found.' }, 404);
  }

  const komStats = await komService.getKomStats(user.athleteId);

  return c.json({ user: userId, stats: komStats });
});

/**
 * GET /v1/koms/:userId/all
 * List all current KOMs with details for a user
 */
koms.get('/:userId/all', ensureFreshMiddleware, async (c) => {
  const userId = c.req.param('userId');
  if (!userId) {
    return c.json({ error: 'No user provided.' }, 400);
  }
  logger.info(`Getting all KOMs with details for user: ${userId}`);
  const { activityService, komService } = c.get('services');
  const user = await activityService.getUserByName(userId);
  if (!user) {
    return c.json({ error: 'User not found.' }, 404);
  }
  const allKoms = await komService.getAllKomsWithDetails(user.athleteId);
  return c.json({ koms: allKoms, total: allKoms.length });
});

export default koms;
