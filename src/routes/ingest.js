import express from 'express';
import stravaService from '../services/stravaService.js';
import activityService from '../services/activityService.js';
import { logger } from '../utils/logger.js';
import { activitySchema } from '../utils/validation.js';
import { ValidationError } from '../utils/errors.js';

const router = express.Router();

/**
 * GET /v1/ingest/:userId[?getAll=true]
 * Syncs user activities from Strava API
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { getAll } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'No user provided.' });
    }

    logger.info(`Starting data ingestion for user: ${userId}, getAll: ${getAll}`);

    // Get user from database
    const user = await activityService.getUserByName(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if token needs refreshing
    let accessToken = user.accessToken;
    let refreshToken = user.refreshToken;

    if (stravaService.isTokenExpired(user.expiresAt)) {
      logger.info('Access token expired, refreshing...');
      const tokenData = await stravaService.refreshToken(user.refreshToken);

      // Update user with new tokens
      await activityService.updateUserTokens(userId, tokenData);
      accessToken = tokenData.accessToken;
      refreshToken = tokenData.refreshToken;
    }

    // Fetch activities from Strava
    let activities;
    if (getAll === 'true') {
      logger.info('Performing full historical sync (all activities)');
      activities = await stravaService.fetchAllActivities(accessToken);
    } else {
      // Smart incremental sync - use lastSyncAt for efficiency
      const stats = await activityService.getUserActivityStats(user.athleteId);
      logger.info(
        `User has ${stats.totalActivities} existing activities, latest: ${stats.latestActivityDate}`
      );

      logger.info('Performing smart incremental sync (since last sync with 1-week overlap)');
      activities = await stravaService.fetchIncrementalActivities(accessToken, user.lastSyncAt);
    }

    logger.info(`Fetched ${activities.length} activities from Strava`);

    // Transform and upsert activities
    const transformedActivities = activities.map((activity) =>
      stravaService.transformActivity(activity)
    );

    await activityService.upsertActivities(transformedActivities);

    // Update user's last sync timestamp
    await activityService.updateLastSyncAt(userId);

    logger.info(
      `Successfully processed ${transformedActivities.length} activities for user ${userId}`
    );

    res.json({ msg: 'success' });
  } catch (error) {
    logger.error('Ingestion error:', error.message);
    next(error);
  }
});

/**
 * POST /v1/activities
 * Upserts a single activity
 */
router.post('/', async (req, res, next) => {
  try {
    const parsed = activitySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid activity data');
    }
    const result = await activityService.upsertActivity(parsed.data);
    res.status(200).json({ msg: 'success', data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
