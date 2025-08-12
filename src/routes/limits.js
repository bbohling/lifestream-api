import express from 'express';
import stravaService from '../services/stravaService.js';
import activityService from '../services/activityService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /v1/limits/:userId
 * Returns current Strava API rate limit status for the user
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'No user provided.' });
    }
    // Get user from database
    const user = await activityService.getUserByName(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    let accessToken = user.accessToken;
    if (stravaService.isTokenExpired(user.expiresAt)) {
      logger.info('Access token expired, refreshing...');
      const tokenData = await stravaService.refreshToken(user.refreshToken);
      await activityService.updateUserTokens(userId, tokenData);
      accessToken = tokenData.accessToken;
    }
    // Make a simple Strava API call to get rate limit headers
    const response = await fetch(`${stravaService.baseUrl}/athlete`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const headers = response.headers;
    // Parse rate limit headers
    const rateLimit = headers.get('x-ratelimit-limit');
    const rateUsage = headers.get('x-ratelimit-usage');
    res.json({
      msg: 'success',
      rateLimit,
      rateUsage,
    });
  } catch (error) {
    logger.error('Failed to get Strava rate limit status:', error.message);
    res.status(500).json({ error: 'Failed to get Strava rate limit status' });
  }
});

export default router;
