import express from 'express';
import activityService from '../services/activityService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /v1/koms/:userId
 * Get KOM activities for a user
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'No user provided.' });
    }

    logger.info(`Getting KOM activities for user: ${userId}`);

    // Get user from database
    const user = await activityService.getUserByName(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const komActivities = await activityService.getKomActivities(user.athleteId, parseInt(limit));

    // Parse segment efforts to show KOM details
    const enrichedActivities = komActivities.map((activity) => ({
      id: activity.id.toString(),
      name: activity.name,
      date: activity.startDate,
      komCount: activity.komCount,
      bestKomRank: activity.bestKomRank,
      bestPrRank: activity.bestPrRank,
      koms: JSON.parse(activity.segmentEfforts || '[]')
        .filter((effort) => effort.komRank)
        .map((effort) => ({
          segmentName: effort.segmentName,
          rank: effort.komRank,
          achievements: effort.achievements,
        })),
    }));

    res.json({
      activities: enrichedActivities,
      total: komActivities.length,
    });
  } catch (error) {
    logger.error('KOM activities error:', error.message);
    next(error);
  }
});

/**
 * GET /v1/koms/:userId/stats
 * Get KOM statistics for a user
 */
router.get('/:userId/stats', async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'No user provided.' });
    }

    logger.info(`Getting KOM stats for user: ${userId}`);

    // Get user from database
    const user = await activityService.getUserByName(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const komStats = await activityService.getKomStats(user.athleteId);

    res.json({
      user: userId,
      stats: komStats,
    });
  } catch (error) {
    logger.error('KOM stats error:', error.message);
    next(error);
  }
});

export default router;
