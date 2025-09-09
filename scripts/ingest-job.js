#!/usr/bin/env node

/**
 * Hourly Ingestion Cronjob
 * Executes the /v1/ingest/brandon endpoint every hour and logs results
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger.js';
import { CronJob } from 'cron';

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

    // Don't throw error - let cron continue running
    return null;
  }
}

/**
 * Create and start the cron job
 */
function startCronJob() {
  // Run every hour at minute 5
  const job = new CronJob(
    '5 * * * *', // cron pattern: "At minute 5 of every hour"
    executeIngestion,
    null, // onComplete callback
    true, // start immediately
    'America/Los_Angeles' // timezone (Pacific Time)
  );

  logger.info('🚀 Hourly ingestion cron job started - will run every hour at minute 5');
  logger.info(`Next execution: ${job.nextDate().toJSDate().toISOString()}`);

  return job;
}

/**
 * Handle graceful shutdown
 */
async function gracefulShutdown(signal) {
  logger.info(`${signal} received, shutting down cronjob gracefully`);
  
  if (cronJob) {
    cronJob.stop();
    logger.info('Cron job stopped');
  }
  
  await prisma.$disconnect();
  logger.info('Database connection closed');
  process.exit(0);
}

// Start the cron job
const cronJob = startCronJob();

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Keep the process alive
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  // Don't exit - let cron continue
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Don't exit - let cron continue
});

logger.info('Hourly ingestion daemon started and running...');