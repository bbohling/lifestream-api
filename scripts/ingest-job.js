#!/usr/bin/env node

/**
 * Hourly Ingestion Cronjob
 * Executes the /v1/ingest/brandon endpoint every hour and logs results
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger.js';

const prisma = new PrismaClient();

/**
 * Execute the ingestion endpoint internally
 */
async function executeIngestion() {
  const startTime = Date.now();
  
  try {
    logger.info('🕐 Starting hourly ingestion cronjob for user: brandon');

    // Import the required services
    const { default: stravaService } = await import('../src/services/stravaService.js');
    const { default: activityService } = await import('../src/services/activityService.js');

    // Get user from database
    const user = await activityService.getUserByName('brandon');
    if (!user) {
      throw new Error('User brandon not found');
    }

    // Check if token needs refreshing
    let accessToken = user.accessToken;
    if (stravaService.isTokenExpired(user.expiresAt)) {
      logger.info('🔄 Access token expired, refreshing...');
      const tokenData = await stravaService.refreshToken(user.refreshToken);
      await activityService.updateUserTokens('brandon', tokenData);
      accessToken = tokenData.accessToken;
    }

    // Perform smart incremental sync
    const stats = await activityService.getUserActivityStats(user.athleteId);
    logger.info(
      `User has ${stats.totalActivities} existing activities, latest: ${stats.latestActivityDate}`
    );

    logger.info('Performing smart incremental sync (since last sync with 1-week overlap)');
    const activities = await stravaService.fetchIncrementalActivities(accessToken, user.lastSyncAt);

    logger.info(`Fetched ${activities.length} activities from Strava`);

    // Transform and upsert activities
    const transformedActivities = activities.map((activity) =>
      stravaService.transformActivity(activity)
    );

    const { added, updated } = await activityService.upsertActivitiesWithCounts(transformedActivities);

    // Fetch and upsert KOMs for athlete
    const koms = await stravaService.fetchKoms(user.athleteId, accessToken);
    const komResult = await stravaService.upsertKoms(koms, user.athleteId);

    // Update user's last sync timestamp
    await activityService.updateLastSyncAt('brandon');

    const duration = Date.now() - startTime;
    
    const result = {
      msg: 'success',
      added,
      updated,
      komsAdded: komResult.added
    };

    // Log successful result to database
    await prisma.ingestLog.create({
      data: {
        userId: 'brandon',
        success: true,
        added: result.added,
        updated: result.updated,
        komsAdded: result.komsAdded,
        duration,
      },
    });

    logger.info(
      `✅ Hourly ingestion completed successfully: added=${result.added}, updated=${result.updated}, komsAdded=${result.komsAdded}, duration=${duration}ms`
    );

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('❌ Hourly ingestion failed:', error.message);

    // Log failed result to database
    await prisma.ingestLog.create({
      data: {
        userId: 'brandon',
        success: false,
        error: error.message,
        duration,
      },
    });

    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await executeIngestion();
    process.exit(0);
  } catch (error) {
    logger.error('Cronjob failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down cronjob gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down cronjob gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the main function
main();