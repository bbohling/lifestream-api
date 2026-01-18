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
    
    // Capture ALL headers for debugging
    const allHeaders = {};
    headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    // Log all headers for debugging
    logger.info('Strava API response headers:', JSON.stringify(allHeaders, null, 2));
    
    // Parse known rate limit headers
    const rateLimit = headers.get('x-ratelimit-limit');
    const rateUsage = headers.get('x-ratelimit-usage');
    const readRateLimit = headers.get('x-readratelimit-limit');
    const readRateUsage = headers.get('x-readratelimit-usage');
    
    // Parse the values if they exist (format: "15min,daily")
    let parsed = null;
    if (rateLimit && rateUsage) {
      const [limit15min, limitDaily] = rateLimit.split(',').map(Number);
      const [usage15min, usageDaily] = rateUsage.split(',').map(Number);
      parsed = {
        overall: {
          limit15min,
          limitDaily,
          usage15min,
          usageDaily,
          remaining15min: limit15min - usage15min,
          remainingDaily: limitDaily - usageDaily,
        },
      };
      
      if (readRateLimit && readRateUsage) {
        const [readLimit15min, readLimitDaily] = readRateLimit.split(',').map(Number);
        const [readUsage15min, readUsageDaily] = readRateUsage.split(',').map(Number);
        parsed.read = {
          limit15min: readLimit15min,
          limitDaily: readLimitDaily,
          usage15min: readUsage15min,
          usageDaily: readUsageDaily,
          remaining15min: readLimit15min - readUsage15min,
          remainingDaily: readLimitDaily - readUsageDaily,
        };
      }
    }
    
    res.json({
      msg: 'success',
      rawHeaders: {
        'x-ratelimit-limit': rateLimit,
        'x-ratelimit-usage': rateUsage,
        'x-readratelimit-limit': readRateLimit,
        'x-readratelimit-usage': readRateUsage,
      },
      parsed,
      allHeaders,
    });
  } catch (error) {
    logger.error('Failed to get Strava rate limit status:', error.message);
    res.status(500).json({ error: 'Failed to get Strava rate limit status' });
  }
});

export default router;
