import express from 'express';
import stravaService from '../services/stravaService.js';
import activityService from '../services/activityService.js';
import segmentService from '../services/segmentService.js';
import { logger } from '../utils/logger.js';
import { activitySchema } from '../utils/validation.js';
import { ValidationError } from '../utils/errors.js';
import { conversions } from '../utils/calculations.js';

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

    // --- NEW: Upsert segments for each activity ---
    // Collect all unique segment IDs from activities
    const segmentIds = new Set();
    for (const activity of activities) {
      if (activity.segment_efforts) {
        for (const effort of activity.segment_efforts) {
          if (effort.segment && effort.segment.id) {
            segmentIds.add(effort.segment.id);
          }
        }
      }
    }

    // Fetch and upsert segment data with rate limiting and concurrency control
    const accessTokenForSegments = accessToken;
    const segmentIdList = Array.from(segmentIds);
    const concurrency = 5;
    for (let i = 0; i < segmentIdList.length; i += concurrency) {
      const batch = segmentIdList.slice(i, i + concurrency);
      const batchPromises = batch.map(async (segmentId) => {
        try {
          // Fetch segment data from Strava
          const segmentDataRaw = await stravaService.makeRequest(`/segments/${segmentId}`, accessTokenForSegments);
          // Transform segment data for DB
          const segmentData = {
            id: BigInt(segmentDataRaw.id),
            name: segmentDataRaw.name || '',
            komAthleteId: segmentDataRaw.kom ? BigInt(segmentDataRaw.kom?.athlete_id) : null,
            komRank: segmentDataRaw.kom ? 1 : null,
            distance: segmentDataRaw.distance ? conversions.metersToMiles(segmentDataRaw.distance) : null,
            averageGrade: segmentDataRaw.average_grade || null,
            maximumGrade: segmentDataRaw.maximum_grade || null,
            elevationHigh: segmentDataRaw.elevation_high ? conversions.metersToFeet(segmentDataRaw.elevation_high) : null,
            elevationLow: segmentDataRaw.elevation_low ? conversions.metersToFeet(segmentDataRaw.elevation_low) : null,
            startLatLng: segmentDataRaw.start_latlng ? JSON.stringify(segmentDataRaw.start_latlng) : null,
            endLatLng: segmentDataRaw.end_latlng ? JSON.stringify(segmentDataRaw.end_latlng) : null,
            starred: segmentDataRaw.starred || false,
            lastUpdated: new Date(),
          };
          await segmentService.upsertSegment(segmentData);
        } catch (error) {
          logger.error(`Failed to fetch/upsert segment ${segmentId}:`, error.message);
        }
      });
      await Promise.all(batchPromises);
      // Add a small delay between batches to respect rate limits
      if (i + concurrency < segmentIdList.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    // --- END NEW ---

    const { added, updated } = await activityService.upsertActivitiesWithCounts(transformedActivities);

    // Update user's last sync timestamp
    await activityService.updateLastSyncAt(userId);

    logger.info(
      `Successfully processed ${transformedActivities.length} activities for user ${userId} (added: ${added}, updated: ${updated})`
    );

    res.json({ msg: 'success', added, updated });
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
