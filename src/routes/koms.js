import express from 'express';
import activityService from '../services/activityService.js';
import komService from '../services/komService.js';
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

  // Fetch kom activities from the koms table (grouped by activity)
  const komActivities = await komService.getKomActivities(user.athleteId, parseInt(limit));

  res.json({ activities: komActivities, total: komActivities.length });
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

  const komStats = await komService.getKomStats(user.athleteId);

  res.json({ user: userId, stats: komStats });
  } catch (error) {
    logger.error('KOM stats error:', error.message);
    next(error);
  }
});

/**
 * GET /v1/koms/:userId/all
 * List all current KOMs with details for a user
 */
router.get('/:userId/all', async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'No user provided.' });
    }
    logger.info(`Getting all KOMs with details for user: ${userId}`);
    // Get user from database
    const user = await activityService.getUserByName(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
  const koms = await komService.getAllKomsWithDetails(user.athleteId);
  res.json({ koms, total: koms.length });
  } catch (error) {
    logger.error('All KOMs details error:', error.message);
    next(error);
  }
});

export default router;
