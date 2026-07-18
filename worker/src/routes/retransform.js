import { Hono } from 'hono';
import {
  retransformAllActivities,
  retransformUserActivities,
} from '../utils/retransformActivities.js';
import { logger } from '../utils/logger.js';

const retransform = new Hono();

/**
 * POST /v1/retransform/all
 * Re-transform all activities using raw data and updated calculations
 */
retransform.post('/all', async (c) => {
  logger.info('Starting re-transformation of all activities via API');

  const { prisma, stravaService } = c.get('services');
  const result = await retransformAllActivities(prisma, stravaService);

  return c.json({
    success: true,
    message: 'Re-transformation completed successfully',
    stats: {
      total: result.total,
      processed: result.processed,
      errors: result.errors,
      successRate:
        result.total > 0 ? ((result.processed / result.total) * 100).toFixed(1) + '%' : '0%',
    },
  });
});

/**
 * POST /v1/retransform/user/:athleteId
 * Re-transform activities for a specific user using raw data
 */
retransform.post('/user/:athleteId', async (c) => {
  const athleteId = c.req.param('athleteId');

  if (!athleteId) {
    return c.json({ error: 'Athlete ID is required' }, 400);
  }

  logger.info(`Starting re-transformation for athlete ${athleteId} via API`);

  const { prisma, stravaService } = c.get('services');
  const result = await retransformUserActivities(prisma, stravaService, athleteId);

  return c.json({
    success: true,
    message: `Re-transformation completed for athlete ${athleteId}`,
    stats: {
      athleteId: result.athleteId,
      total: result.total,
      processed: result.processed,
      errors: result.errors,
      successRate:
        result.total > 0 ? ((result.processed / result.total) * 100).toFixed(1) + '%' : '0%',
    },
  });
});

/**
 * GET /v1/retransform/status
 * Get statistics about raw activities available for re-transformation
 */
retransform.get('/status', async (c) => {
  const { prisma } = c.get('services');

  // Get counts of activities and raw activities
  const [activityCount, rawActivityCount, usersWithActivities] = await Promise.all([
    prisma.activity.count(),
    prisma.rawActivity.count(),
    prisma.user.findMany({
      select: {
        athleteId: true,
        name: true,
        _count: {
          select: {
            activities: true,
          },
        },
      },
      where: {
        activities: {
          some: {},
        },
      },
    }),
  ]);

  return c.json({
    success: true,
    stats: {
      totalActivities: activityCount,
      totalRawActivities: rawActivityCount,
      coverage:
        rawActivityCount > 0 ? ((rawActivityCount / activityCount) * 100).toFixed(1) + '%' : '0%',
      usersWithActivities: usersWithActivities.map((user) => ({
        athleteId: user.athleteId.toString(),
        name: user.name,
        activityCount: user._count.activities,
      })),
    },
  });
});

export default retransform;
