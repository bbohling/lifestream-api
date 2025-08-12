import { PrismaClient } from '@prisma/client';
import stravaService from '../services/stravaService.js';
import activityService from '../services/activityService.js';
import segmentService from './segmentService.js';
import { logger } from '../utils/logger.js';
import { BULK_SYNC } from '../config.js';
import { conversions } from '../utils/calculations.js';

const prisma = new PrismaClient();

/**
 * BulkSyncManager
 * Manages bulk Strava data sync, respecting rate limits and providing resumable progress tracking.
 * All errors are logged with context using the custom logger.
 */
export class BulkSyncManager {
  /**
   * Initialize BulkSyncManager with batch size, delay, and limits.
   * @constructor
   */
  constructor() {
    this.dailyLimit = BULK_SYNC.dailyLimit;
    this.batchSize = BULK_SYNC.batchSize;
    this.delayBetweenBatches = BULK_SYNC.delayBetweenBatches;
  }

  /**
   * Reset bulk sync state and clear summaries for a fresh start.
   * @param {string|number} userId - The user identifier.
   * @returns {Promise<void>}
   */
  async resetBulkSync(userId) {
    try {
      // Clear existing summaries
      await prisma.bulkSyncSummaries.deleteMany({
        where: { userId },
      });

      // Reset or delete existing state
      await prisma.bulkSyncState.deleteMany({
        where: { userId },
      });

      logger.info(`Reset bulk sync state and cleared summaries for user ${userId}`);
    } catch (error) {
      // Log error with context
      logger.error(`Error resetting bulk sync for user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get or create bulk sync state for a user
   */
  async getBulkSyncState(userId) {
    try {
      let state = await prisma.bulkSyncState.findUnique({
        where: { userId },
      });

      if (!state) {
        // Initialize new bulk sync state
        const user = await activityService.getUserByName(userId);
        if (!user) {
          throw new Error(`User ${userId} not found`);
        }

        state = await prisma.bulkSyncState.create({
          data: {
            userId,
            athleteId: user.athleteId,
            status: 'pending',
            phase: 'summary_fetch',
            totalActivities: 0,
            processedActivities: 0,
            processedSummaries: 0,
            requestsUsedToday: 0,
            currentPage: 1,
            startDate: new Date(),
            lastResetDate: new Date(),
            processedActivityIds: '[]',
          },
        });
      }

      return state;
    } catch (error) {
      logger.error('Error getting bulk sync state:', error.message);
      throw error;
    }
  }

  /**
   * Store activity summaries in database for detail fetch phase
   */
  async storeSummaries(userId, summaries) {
    try {
      // Store summaries using individual upserts to handle duplicates
      let storedCount = 0;
      
      for (const summary of summaries) {
        try {
          await prisma.bulkSyncSummaries.upsert({
            where: {
              userId_activityId: {
                userId,
                activityId: summary.id
              }
            },
            update: {
              summaryData: JSON.stringify(summary)
            },
            create: {
              userId,
              activityId: summary.id, // Use BigInt directly
              summaryData: JSON.stringify(summary)
            }
          });
          storedCount++;
        } catch (error) {
          logger.warn(`Failed to store summary for activity ${summary.id}:`, error.message);
        }
      }

      logger.info(`Stored ${storedCount}/${summaries.length} activity summaries for user ${userId}`);
    } catch (error) {
      logger.error(`Error storing summaries for user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Update bulk sync state
   */
  async updateBulkSyncState(userId, updates) {
    try {
      return await prisma.bulkSyncState.update({
        where: { userId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error updating bulk sync state:', error.message);
      throw error;
    }
  }

  /**
   * Check if we need to reset daily request counter
   */
  checkDailyReset(state) {
    const now = new Date();
    const lastReset = new Date(state.lastResetDate);
    
    // Reset if it's a new day (UTC)
    if (now.getUTCDate() !== lastReset.getUTCDate() || 
        now.getUTCMonth() !== lastReset.getUTCMonth() ||
        now.getUTCFullYear() !== lastReset.getUTCFullYear()) {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate remaining requests for today
   */
  getRemainingRequests(state) {
    const SAFETY_LIMIT = 950; // Strava daily read limit minus buffer
    const maxAllowed = Math.min(this.dailyLimit, SAFETY_LIMIT);
    if (this.checkDailyReset(state)) {
      return maxAllowed;
    }
    return Math.max(0, maxAllowed - state.requestsUsedToday);
  }

  /**
   * Phase 1: Fetch all activity summaries (1 request per ~200 activities)
   */
  async fetchAllSummariesPhase(userId, accessToken) {
    logger.info(`Starting summary fetch phase for user ${userId}`);
    
    let state = await this.getBulkSyncState(userId);
    let allSummaries = [];
    
    // Reset daily counter if needed
    if (this.checkDailyReset(state)) {
      state = await this.updateBulkSyncState(userId, {
        requestsUsedToday: 0,
        lastResetDate: new Date(),
      });
    }

    let remainingRequests = this.getRemainingRequests(state);
    logger.info(`Starting with ${remainingRequests} requests remaining for today`);

    // Fetch activity summaries with pagination
    let currentPage = state.currentPage;
    let requestsUsed = 0;

    while (remainingRequests > 0) {
      try {
        logger.info(`Fetching summaries page ${currentPage} (${remainingRequests} requests left today)`);
        
        const summaries = await stravaService.fetchActivitySummaries(
          accessToken, 
          currentPage, 
          200 // Max per page
        );
        
        requestsUsed++;
        remainingRequests--;

        if (summaries.length === 0) {
          logger.info('No more activity summaries found - phase complete');
          break;
        }

        allSummaries = allSummaries.concat(summaries);
        currentPage++;

        // Store summaries in database for detail fetch phase
        await this.storeSummaries(userId, summaries);

        // Update progress
        await this.updateBulkSyncState(userId, {
          currentPage,
          processedSummaries: allSummaries.length,
          requestsUsedToday: state.requestsUsedToday + requestsUsed,
        });

        // If we got less than 200, we've reached the end
        if (summaries.length < 200) {
          logger.info(`Reached end of activities at page ${currentPage - 1}`);
          break;
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        logger.error(`Error fetching summaries page ${currentPage}:`, error.message);
        
        // Update state and rethrow
        await this.updateBulkSyncState(userId, {
          requestsUsedToday: state.requestsUsedToday + requestsUsed,
          status: 'error',
          errorMessage: error.message,
        });
        
        throw error;
      }
    }

    // Phase complete - update state
    const finalState = await this.updateBulkSyncState(userId, {
      phase: remainingRequests > 0 ? 'detail_fetch' : 'paused_daily_limit',
      totalActivities: allSummaries.length,
      requestsUsedToday: state.requestsUsedToday + requestsUsed,
      processedSummaries: allSummaries.length,
    });

    if (remainingRequests === 0) {
      logger.info(`Daily limit reached. Summary phase paused. Resume tomorrow to continue.`);
      logger.info(`Progress: ${allSummaries.length} summaries fetched so far`);
    } else {
      logger.info(`Summary phase complete: ${allSummaries.length} activities found`);
    }

    return {
      summaries: allSummaries,
      requestsUsed,
      remainingRequests,
      totalFound: allSummaries.length,
      phaseComplete: remainingRequests > 0,
    };
  }

  /**
   * Phase 2: Fetch detailed activity data (1 request per activity)
   */
  async fetchDetailsPhase(userId, accessToken, activitySummaries = null) {
    logger.info(`Starting detail fetch phase for user ${userId}`);
    
    let state = await this.getBulkSyncState(userId);
    
    // Reset daily counter if needed
    if (this.checkDailyReset(state)) {
      state = await this.updateBulkSyncState(userId, {
        requestsUsedToday: 0,
        lastResetDate: new Date(),
      });
    }

    // Get activity IDs to process
    let activityIds;
    if (activitySummaries) {
      activityIds = activitySummaries.map(a => a.id);
    } else {
      // Get IDs from previously fetched summaries (stored separately)
      const summaryData = await prisma.bulkSyncSummaries.findMany({
        where: { userId },
        select: { activityId: true },
      });
      activityIds = summaryData.map(s => Number(s.activityId));
    }

    // Filter out already processed activities
    const processedIds = JSON.parse(state.processedActivityIds || '[]');
    const remainingIds = activityIds.filter(id => !processedIds.includes(id));

    logger.info(`Total activities: ${activityIds.length}, Already processed: ${processedIds.length}, Remaining: ${remainingIds.length}`);

    let remainingRequests = this.getRemainingRequests(state);
    let requestsUsed = 0;
    let processedCount = 0;

    // Process activities in batches
    for (let i = 0; i < remainingIds.length && remainingRequests > 0; i += this.batchSize) {
      const batch = remainingIds.slice(i, i + this.batchSize);
      const requestsNeeded = Math.min(batch.length, remainingRequests);
      const batchToProcess = batch.slice(0, requestsNeeded);

      logger.info(`Processing detail batch ${Math.floor(i / this.batchSize) + 1}: activities ${i + 1}-${i + batchToProcess.length} (${remainingRequests} requests left)`);

      try {
        // Fetch details for this batch
        const detailedActivities = await stravaService.fetchActivityDetails(
          accessToken, 
          batchToProcess,
          this.batchSize
        );

        requestsUsed += batchToProcess.length;
        remainingRequests -= batchToProcess.length;
        processedCount += detailedActivities.length;

        // Transform and store activities
        for (const activity of detailedActivities) {
          const transformed = stravaService.transformActivity(activity);
          await activityService.upsertActivity(transformed);

          // --- NEW: Upsert segments for each activity ---
          if (activity.segment_efforts) {
            const segmentIds = new Set();
            for (const effort of activity.segment_efforts) {
              if (effort.segment && effort.segment.id) {
                segmentIds.add(effort.segment.id);
              }
            }
            const segmentIdList = Array.from(segmentIds);
            const concurrency = 5;
            for (let i = 0; i < segmentIdList.length; i += concurrency) {
              const batch = segmentIdList.slice(i, i + concurrency);
              const batchPromises = batch.map(async (segmentId) => {
                try {
                  const segmentDataRaw = await stravaService.makeRequest(`/segments/${segmentId}`, accessToken);
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
              if (i + concurrency < segmentIdList.length) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            }
          }
          // --- END NEW ---
        }

        // Update processed IDs
        processedIds.push(...batchToProcess);
        
        // Update progress
        await this.updateBulkSyncState(userId, {
          processedActivities: processedIds.length,
          requestsUsedToday: state.requestsUsedToday + requestsUsed,
          processedActivityIds: JSON.stringify(processedIds),
        });

        logger.info(`Batch complete: ${detailedActivities.length} activities processed`);

        // Delay between batches
        if (i + this.batchSize < remainingIds.length && remainingRequests > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches));
        }

      } catch (error) {
        logger.error(`Error processing detail batch:`, error.message);
        
        await this.updateBulkSyncState(userId, {
          requestsUsedToday: state.requestsUsedToday + requestsUsed,
          status: 'error',
          errorMessage: error.message,
        });
        
        throw error;
      }
    }

    // Update final state
    const isComplete = processedIds.length >= activityIds.length;
    const finalState = await this.updateBulkSyncState(userId, {
      phase: isComplete ? 'complete' : 'paused_daily_limit',
      status: isComplete ? 'complete' : 'paused',
      processedActivities: processedIds.length,
      requestsUsedToday: state.requestsUsedToday + requestsUsed,
      completedAt: isComplete ? new Date() : null,
    });

    if (isComplete) {
      logger.info(`🎉 Bulk sync complete! Processed ${processedIds.length} activities total`);
    } else {
      logger.info(`📊 Daily limit reached. Progress: ${processedIds.length}/${activityIds.length} activities processed`);
      logger.info(`📅 Resume tomorrow to continue bulk sync`);
    }

    return {
      processedCount,
      totalProcessed: processedIds.length,
      totalActivities: activityIds.length,
      requestsUsed,
      remainingRequests,
      isComplete,
    };
  }

  /**
   * Bulk sync entry point: fetch gear, then activities
   */
  async runBulkSync(userId, accessToken) {
    // Get user and athleteId
    const user = await activityService.getUserByName(userId);
    if (!user) throw new Error(`User ${userId} not found`);
    const athleteId = user.athleteId;

    // Step 1: Fetch and upsert all gear for athlete
    await stravaService.fetchAndUpsertAthleteGear(accessToken, athleteId);

    // Step 2: Proceed with normal bulk sync (summaries, details, upsert activities)
    let state = await this.getBulkSyncState(userId);

    // Determine which phase to start with
    if (state.phase === 'summary_fetch' || state.phase === 'paused_daily_limit') {
      return await this.fetchAllSummariesPhase(userId, accessToken);
    } else if (state.phase === 'detail_fetch') {
      return await this.fetchDetailsPhase(userId, accessToken);
    }

    throw new Error(`Unknown phase: ${state.phase}`);
  }

  /**
   * Resume bulk sync from where it left off
   */
  async resumeBulkSync(userId, accessToken) {
    logger.info(`Resuming bulk sync for user ${userId}`);
    
    const state = await this.getBulkSyncState(userId);
    
    logger.info(`Current state: ${state.status}, Phase: ${state.phase}`);
    logger.info(`Progress: ${state.processedActivities}/${state.totalActivities} activities`);

    if (state.status === 'complete') {
      logger.info('Bulk sync already complete!');
      return { alreadyComplete: true };
    }

    // Reset daily limit if it's a new day
    if (this.checkDailyReset(state)) {
      await this.updateBulkSyncState(userId, {
        requestsUsedToday: 0,
        lastResetDate: new Date(),
        status: 'running',
      });
    }

    if (state.phase === 'summary_fetch' || state.phase === 'paused_daily_limit') {
      return await this.fetchAllSummariesPhase(userId, accessToken);
    } else if (state.phase === 'detail_fetch') {
      return await this.fetchDetailsPhase(userId, accessToken);
    }

    throw new Error(`Unknown phase: ${state.phase}`);
  }

  /**
   * Get bulk sync progress/status
   */
  async getBulkSyncProgress(userId) {
    const state = await this.getBulkSyncState(userId);
    const remainingRequests = this.getRemainingRequests(state);
    
    return {
      status: state.status,
      phase: state.phase,
      progress: {
        totalActivities: state.totalActivities,
        processedActivities: state.processedActivities,
        processedSummaries: state.processedSummaries,
        percentage: state.totalActivities > 0 
          ? Math.round((state.processedActivities / state.totalActivities) * 100)
          : 0,
      },
      rateLimits: {
        requestsUsedToday: state.requestsUsedToday,
        remainingToday: remainingRequests,
        dailyLimit: Math.min(this.dailyLimit, 950),
      },
      timing: {
        startDate: state.startDate,
        lastUpdate: state.updatedAt,
        completedAt: state.completedAt,
      },
      error: state.errorMessage,
    };
  }
}

export default new BulkSyncManager();
