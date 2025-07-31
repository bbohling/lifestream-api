import { logger } from '../utils/logger.js';
import { conversions } from '../utils/calculations.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Strava API Service
 * Handles OAuth token management and API calls to Strava with rate limiting
 */
export class StravaService {
  constructor() {
    this.baseUrl = 'https://www.strava.com/api/v3';
    this.oauthUrl = 'https://www.strava.com/oauth/token';
    this.clientId = process.env.STRAVA_CLIENT_ID;
    this.clientSecret = process.env.STRAVA_CLIENT_SECRET;

    // Rate limiting state
    this.rateLimitState = {
      // Overall limits (all endpoints)
      overall: {
        limit15min: 200,
        limitDaily: 2000,
        usage15min: 0,
        usageDaily: 0,
        lastReset15min: this.getNext15MinuteReset(),
        lastResetDaily: this.getNextDailyReset(),
      },
      // Read limits (non-upload endpoints)
      read: {
        limit15min: 100,
        limitDaily: 1000,
        usage15min: 0,
        usageDaily: 0,
        lastReset15min: this.getNext15MinuteReset(),
        lastResetDaily: this.getNextDailyReset(),
      },
    };

    // Only throw error in production or when actually trying to use the service
    if (process.env.NODE_ENV === 'production' && (!this.clientId || !this.clientSecret)) {
      throw new Error('Strava client ID and secret must be configured');
    }

    // Warn about placeholder values
    if (this.clientId === 'your_strava_client_id' || this.clientSecret === 'your_strava_client_secret') {
      logger.warn('Strava credentials appear to be placeholder values. Please update your .env file.');
    }
  }

  /**
   * Get the next 15-minute reset time (0, 15, 30, 45 minutes after the hour)
   */
  getNext15MinuteReset() {
    const now = new Date();
    const minutes = now.getMinutes();
    const nextReset = new Date(now);

    if (minutes < 15) {
      nextReset.setMinutes(15, 0, 0);
    } else if (minutes < 30) {
      nextReset.setMinutes(30, 0, 0);
    } else if (minutes < 45) {
      nextReset.setMinutes(45, 0, 0);
    } else {
      nextReset.setHours(nextReset.getHours() + 1, 0, 0, 0);
    }

    return nextReset;
  }

  /**
   * Get the next daily reset time (midnight UTC)
   */
  getNextDailyReset() {
    const now = new Date();
    const nextReset = new Date(now);
    nextReset.setUTCHours(24, 0, 0, 0); // Next midnight UTC
    return nextReset;
  }

  /**
   * Reset rate limit counters if reset time has passed
   */
  checkAndResetRateLimits() {
    const now = new Date();

    // Check 15-minute resets
    if (now >= this.rateLimitState.overall.lastReset15min) {
      this.rateLimitState.overall.usage15min = 0;
      this.rateLimitState.overall.lastReset15min = this.getNext15MinuteReset();
      logger.info('Rate limit 15-minute counter reset (overall)');
    }

    if (now >= this.rateLimitState.read.lastReset15min) {
      this.rateLimitState.read.usage15min = 0;
      this.rateLimitState.read.lastReset15min = this.getNext15MinuteReset();
      logger.info('Rate limit 15-minute counter reset (read)');
    }

    // Check daily resets
    if (now >= this.rateLimitState.overall.lastResetDaily) {
      this.rateLimitState.overall.usageDaily = 0;
      this.rateLimitState.overall.lastResetDaily = this.getNextDailyReset();
      logger.info('Rate limit daily counter reset (overall)');
    }

    if (now >= this.rateLimitState.read.lastResetDaily) {
      this.rateLimitState.read.usageDaily = 0;
      this.rateLimitState.read.lastResetDaily = this.getNextDailyReset();
      logger.info('Rate limit daily counter reset (read)');
    }
  }

  /**
   * Update rate limit state from API response headers
   */
  updateRateLimitFromHeaders(headers) {
    // Overall rate limits
    const overallLimit = headers.get('x-ratelimit-limit');
    const overallUsage = headers.get('x-ratelimit-usage');

    // Read rate limits (non-upload endpoints)
    const readLimit = headers.get('x-readratelimit-limit');
    const readUsage = headers.get('x-readratelimit-usage');

    if (overallLimit && overallUsage) {
      const [limit15min, limitDaily] = overallLimit.split(',').map(Number);
      const [usage15min, usageDaily] = overallUsage.split(',').map(Number);

      this.rateLimitState.overall.limit15min = limit15min;
      this.rateLimitState.overall.limitDaily = limitDaily;
      this.rateLimitState.overall.usage15min = usage15min;
      this.rateLimitState.overall.usageDaily = usageDaily;
    }

    if (readLimit && readUsage) {
      const [limit15min, limitDaily] = readLimit.split(',').map(Number);
      const [usage15min, usageDaily] = readUsage.split(',').map(Number);

      this.rateLimitState.read.limit15min = limit15min;
      this.rateLimitState.read.limitDaily = limitDaily;
      this.rateLimitState.read.usage15min = usage15min;
      this.rateLimitState.read.usageDaily = usageDaily;
    }
  }

  /**
   * Check if we're approaching rate limits and calculate delay if needed
   */
  calculateRateLimitDelay() {
    this.checkAndResetRateLimits();

    // Use read limits since our endpoints are non-upload
    const state = this.rateLimitState.read;
    const overallState = this.rateLimitState.overall;

    // Calculate utilization percentages
    const usage15minPercent = (state.usage15min / state.limit15min) * 100;
    const usageDailyPercent = (state.usageDaily / state.limitDaily) * 100;
    const overallUsage15minPercent = (overallState.usage15min / overallState.limit15min) * 100;
    const overallUsageDailyPercent = (overallState.usageDaily / overallState.limitDaily) * 100;

    // Find the highest utilization
    const maxUtilization = Math.max(
      usage15minPercent,
      usageDailyPercent,
      overallUsage15minPercent,
      overallUsageDailyPercent
    );

    // Progressive delays based on utilization
    if (maxUtilization >= 90) {
      // Very high usage - long delay
      return 10000; // 10 seconds
    } else if (maxUtilization >= 80) {
      // High usage - medium delay
      return 5000; // 5 seconds
    } else if (maxUtilization >= 70) {
      // Moderate usage - short delay
      return 2000; // 2 seconds
    } else if (maxUtilization >= 50) {
      // Getting busy - minimal delay
      return 1000; // 1 second
    }

    // Low usage - no delay needed
    return 0;
  }

  /**
   * Apply rate limiting delay if needed
   */
  async applyRateLimit() {
    const delay = this.calculateRateLimitDelay();

    if (delay > 0) {
      const state = this.rateLimitState.read;
      logger.info(
        `Rate limiting: delaying ${delay}ms (usage: ${state.usage15min}/${state.limit15min} per 15min, ${state.usageDaily}/${state.limitDaily} per day)`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  /**
   * Log rate limit data to database for monitoring and analytics
   */
  async logRateLimit(endpoint, delayApplied = 0, wasRateLimited = false, retryAfter = null) {
    try {
      const state = this.rateLimitState;
      
      // Calculate utilization percentages
      const overallUtil15min = (state.overall.usage15min / state.overall.limit15min) * 100;
      const overallUtilDaily = (state.overall.usageDaily / state.overall.limitDaily) * 100;
      const readUtil15min = (state.read.usage15min / state.read.limit15min) * 100;
      const readUtilDaily = (state.read.usageDaily / state.read.limitDaily) * 100;
      
      const maxUtilization = Math.max(overallUtil15min, overallUtilDaily, readUtil15min, readUtilDaily);

      await prisma.rateLimitLog.create({
        data: {
          endpoint,
          // Overall limits
          overallLimit15min: state.overall.limit15min,
          overallLimitDaily: state.overall.limitDaily,
          overallUsage15min: state.overall.usage15min,
          overallUsageDaily: state.overall.usageDaily,
          // Read limits
          readLimit15min: state.read.limit15min,
          readLimitDaily: state.read.limitDaily,
          readUsage15min: state.read.usage15min,
          readUsageDaily: state.read.usageDaily,
          // Analytics
          maxUtilizationPercent: Math.round(maxUtilization * 100) / 100, // Round to 2 decimal places
          delayAppliedMs: delayApplied,
          wasRateLimited,
          retryAfterMs: retryAfter,
        },
      });

      // Log significant usage milestones for visibility
      if (state.read.usageDaily >= 2500) {
        logger.warn(`🚨 Critical: ${state.read.usageDaily}/${state.read.limitDaily} daily read requests used (${Math.round(readUtilDaily)}%)`);
      } else if (state.read.usageDaily >= 2000) {
        logger.warn(`⚠️  High usage: ${state.read.usageDaily}/${state.read.limitDaily} daily read requests used (${Math.round(readUtilDaily)}%)`);
      } else if (state.read.usageDaily >= 1500) {
        logger.info(`📊 Moderate usage: ${state.read.usageDaily}/${state.read.limitDaily} daily read requests used (${Math.round(readUtilDaily)}%)`);
      }
    } catch (error) {
      // Don't let rate limit logging break the main functionality
      logger.error('Failed to log rate limit data:', error.message);
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(expiresAt) {
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= expiresAt;
  }

  /**
   * Refresh OAuth access token
   */
  async refreshToken(refreshToken) {
    try {
      // Check if credentials are configured
      if (!this.clientId || !this.clientSecret) {
        throw new Error('Strava client credentials not configured. Please check your .env file.');
      }

      if (this.clientId === 'your_strava_client_id' || this.clientSecret === 'your_strava_client_secret') {
        throw new Error('Strava credentials are still placeholder values. Please update your .env file with actual credentials from https://www.strava.com/settings/api');
      }

      const response = await fetch(this.oauthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Token refresh failed: ${response.status} ${errorText}`;
        
        // Provide helpful error messages for common issues
        if (response.status === 400) {
          const errorData = JSON.parse(errorText);
          if (errorData.errors?.some(e => e.field === 'client_id' && e.code === 'invalid')) {
            errorMessage += '\n\n🔧 This usually means:\n';
            errorMessage += '1. Your STRAVA_CLIENT_ID is incorrect or missing\n';
            errorMessage += '2. You need to create a Strava API application at https://www.strava.com/settings/api\n';
            errorMessage += '3. Update your .env file with the correct Client ID and Client Secret';
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      logger.info('Token refreshed successfully');

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
      };
    } catch (error) {
      logger.error('Failed to refresh token:', error.message);
      throw error;
    }
  }

  /**
   * Make authenticated request to Strava API with rate limiting
   */
  async makeRequest(endpoint, accessToken, options = {}) {
    // Calculate delay applied before making request
    const delayApplied = this.calculateRateLimitDelay();
    
    // Apply rate limiting before making request
    await this.applyRateLimit();

    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
      ...options,
    };

    let wasRateLimited = false;
    let retryAfter = null;

    try {
      const response = await fetch(url, config);

      // Update rate limit state from response headers
      this.updateRateLimitFromHeaders(response.headers);

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - extract info from headers and wait
          wasRateLimited = true;
          const retryAfterHeader = response.headers.get('retry-after');
          const waitTime = retryAfterHeader ? parseInt(retryAfterHeader) * 1000 : 60000; // Default 1 minute
          retryAfter = waitTime;

          logger.warn(`Rate limited (429). Waiting ${waitTime}ms before retry`);
          
          // Log the rate limit event
          await this.logRateLimit(endpoint, delayApplied, wasRateLimited, retryAfter);
          
          await new Promise((resolve) => setTimeout(resolve, waitTime));

          // Retry the request once
          logger.info(`Retrying request to ${endpoint}`);
          return this.makeRequest(endpoint, accessToken, options);
        }

        const errorText = await response.text();
        throw new Error(`Strava API error: ${response.status} ${errorText}`);
      }

      // Log successful request with rate limit data
      await this.logRateLimit(endpoint, delayApplied, wasRateLimited, retryAfter);

      return await response.json();
    } catch (error) {
      logger.error(`Strava API request failed for ${endpoint}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch activity summaries from Strava API (step 1)
   */
  async fetchActivitySummaries(accessToken, page = 1, perPage = 200, after = null, before = null) {
    let endpoint = `/athlete/activities?per_page=${perPage}&page=${page}`;

    if (after) {
      endpoint += `&after=${after}`;
    }

    if (before) {
      endpoint += `&before=${before}`;
    }

    return await this.makeRequest(endpoint, accessToken);
  }

  /**
   * Fetch detailed activity data including segment efforts (step 2)
   */
  async fetchActivityDetail(accessToken, activityId) {
    const endpoint = `/activities/${activityId}?include_all_efforts=true`;
    return await this.makeRequest(endpoint, accessToken);
  }

  /**
   * Fetch all activity summaries with pagination
   */
  async fetchAllActivitySummaries(accessToken) {
    let allActivities = [];
    let page = 1;
    const perPage = 200;

    while (true) {
      logger.info(`Fetching activity summaries page ${page}`);
      const activities = await this.fetchActivitySummaries(accessToken, page, perPage);

      if (activities.length === 0) {
        break;
      }

      allActivities = allActivities.concat(activities);
      page++;

      // If we got less than perPage activities, we've reached the end
      if (activities.length < perPage) {
        break;
      }
    }

    logger.info(`Fetched ${allActivities.length} total activity summaries`);
    return allActivities;
  }

  /**
   * Fetch recent activity summaries (incremental sync)
   */
  async fetchRecentActivitySummaries(accessToken, lastSyncAt = null) {
    logger.info('Fetching recent activity summaries (incremental sync)');

    // Add 1-week overlap for safety to ensure we don't miss any activities
    const after = lastSyncAt
      ? Math.floor((new Date(lastSyncAt).getTime() - 7 * 24 * 60 * 60 * 1000) / 1000)
      : null;

    if (after) {
      logger.info(
        `Fetching activities since ${new Date(after * 1000).toISOString()} (with 1-week overlap)`
      );
    }

    return await this.fetchActivitySummaries(accessToken, 1, 200, after);
  }

  /**
   * Fetch incremental activities with smart date-based filtering
   */
  async fetchIncrementalActivities(accessToken, lastSyncAt = null) {
    logger.info('Starting smart incremental activity fetch');

    // Step 1: Get activity summaries since last sync (with overlap)
    const activitySummaries = await this.fetchRecentActivitySummaries(accessToken, lastSyncAt);

    if (activitySummaries.length === 0) {
      logger.info('No new activities found since last sync');
      return [];
    }

    // Step 2: Get detailed data for each activity
    const activityIds = activitySummaries.map((activity) => activity.id);
    logger.info(`Fetching detailed data for ${activityIds.length} incremental activities`);

    const detailedActivities = await this.fetchActivityDetails(accessToken, activityIds);

    logger.info(
      `Successfully fetched detailed data for ${detailedActivities.length}/${activityIds.length} incremental activities`
    );
    return detailedActivities;
  }

  /**
   * Fetch detailed data for multiple activities with concurrency control
   */
  async fetchActivityDetails(accessToken, activityIds, concurrency = 5) {
    const results = [];

    // Process activities in batches to avoid overwhelming the API
    for (let i = 0; i < activityIds.length; i += concurrency) {
      const batch = activityIds.slice(i, i + concurrency);
      const batchPromises = batch.map(async (activityId) => {
        try {
          return await this.fetchActivityDetail(accessToken, activityId);
        } catch (error) {
          logger.error(`Failed to fetch details for activity ${activityId}:`, error.message);
          // Return null for failed requests so we can filter them out
          return null;
        }
      });

      try {
        const batchResults = await Promise.all(batchPromises);
        // Filter out null results (failed requests)
        const validResults = batchResults.filter((result) => result !== null);
        results.push(...validResults);

        logger.info(
          `Processed activity details ${i + 1} to ${Math.min(i + concurrency, activityIds.length)} of ${activityIds.length}`
        );

        // Add a small delay between batches to respect rate limits
        if (i + concurrency < activityIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        logger.error(`Error processing batch ${i / concurrency + 1}:`, error.message);
        throw error;
      }
    }

    return results;
  }

  /**
   * Fetch all activities with full details (two-step process)
   */
  async fetchAllActivities(accessToken) {
    logger.info('Starting comprehensive activity fetch with segment efforts');

    // Step 1: Get all activity summaries
    const activitySummaries = await this.fetchAllActivitySummaries(accessToken);

    if (activitySummaries.length === 0) {
      logger.info('No activities found');
      return [];
    }

    // Step 2: Get detailed data for each activity
    const activityIds = activitySummaries.map((activity) => activity.id);
    logger.info(`Fetching detailed data for ${activityIds.length} activities`);

    const detailedActivities = await this.fetchActivityDetails(accessToken, activityIds);

    logger.info(
      `Successfully fetched detailed data for ${detailedActivities.length}/${activityIds.length} activities`
    );
    return detailedActivities;
  }

  /**
   * Fetch recent activities with full details (legacy - for backward compatibility)
   */
  async fetchRecentActivities(accessToken, lastSyncAt = null) {
    logger.info('Starting incremental activity fetch with segment efforts');

    // Use new smart incremental method
    return this.fetchIncrementalActivities(accessToken, lastSyncAt);
  }

  /**
   * Transform Strava activity data to database format
   * Returns both processed activity data and raw data separately
   */
  transformActivity(activity) {
    // Extract segment efforts data for potential future use
    const segmentEfforts =
      activity.segment_efforts?.map((effort) => ({
        id: effort.id,
        name: effort.name,
        segmentId: effort.segment?.id,
        segmentName: effort.segment?.name,
        komRank: effort.kom_rank,
        prRank: effort.pr_rank,
        achievements: effort.achievements || [],
        elapsedTime: effort.elapsed_time,
        movingTime: effort.moving_time,
        // Convert distance from meters to miles for consistency
        distance: effort.distance ? conversions.metersToMiles(effort.distance) : null,
        startIndex: effort.start_index,
        endIndex: effort.end_index,
      })) || [];

    // Log KOM/PR achievements for this activity
    const komEfforts = segmentEfforts.filter((effort) => effort.komRank);
    const prEfforts = segmentEfforts.filter((effort) => effort.prRank);

    // Calculate KOM/PR statistics
    const komCount = komEfforts.length;
    const bestKomRank =
      komEfforts.length > 0 ? Math.min(...komEfforts.map((e) => e.komRank)) : null;
    const bestPrRank = prEfforts.length > 0 ? Math.min(...prEfforts.map((e) => e.prRank)) : null;

    if (komEfforts.length > 0 || prEfforts.length > 0) {
      logger.info(
        `Activity ${activity.id} - KOMs: ${komEfforts.length} (best rank: ${bestKomRank}), PRs: ${prEfforts.length} (best rank: ${bestPrRank})`
      );
    }

    return {
      // Processed activity data for the main Activity table
      activityData: {
        id: BigInt(activity.id),
        athleteId: BigInt(activity.athlete?.id || activity.athlete_id),
        name: activity.name || '',
        // Convert distance from meters to miles
        distance: activity.distance ? conversions.metersToMiles(activity.distance) : null,
        movingTime: activity.moving_time,
        elapsedTime: activity.elapsed_time,
        // Convert elevation from meters to feet
        totalElevationGain: activity.total_elevation_gain ? conversions.metersToFeet(activity.total_elevation_gain) : null,
        elevationHigh: activity.elev_high ? conversions.metersToFeet(activity.elev_high) : null,
        elevationLow: activity.elev_low ? conversions.metersToFeet(activity.elev_low) : null,
        activityType: activity.type,
        startDate: new Date(activity.start_date_local?.replace('Z', '') || activity.start_date),
        achievementCount: activity.achievement_count,
        prCount: activity.pr_count,
        trainer: activity.trainer || false,
        commute: activity.commute || false,
        gear: activity.gear_id || null,
        // Convert speed from m/s to mph
        averageSpeed: activity.average_speed ? conversions.mpsToMph(activity.average_speed) : null,
        maxSpeed: activity.max_speed ? conversions.mpsToMph(activity.max_speed) : null,
        averageCadence: activity.average_cadence,
        // Convert temperature from Celsius to Fahrenheit
        averageTemperature: activity.average_temp ? conversions.celsiusToFahrenheit(activity.average_temp) : null,
        averageWatts: activity.average_watts,
        maxWatts: activity.max_watts,
        weightedAverageWatts: activity.weighted_average_watts,
        kilojoules: activity.kilojoules,
        deviceWatts: activity.device_watts,
        averageHeartRate: activity.average_heartrate,
        maxHeartRate: activity.max_heartrate,
        sufferScore: activity.suffer_score || 0,
        // KOM/PR specific fields for easy querying
        komCount: komCount,
        bestKomRank: bestKomRank,
        bestPrRank: bestPrRank,
        // Store segment efforts as JSON for future use
        segmentEfforts: JSON.stringify(segmentEfforts),
      },
      // Raw data for the RawActivity table
      rawData: JSON.stringify(activity),
    };
  }
}

export default new StravaService();
