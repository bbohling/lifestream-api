import { PrismaClient } from '@prisma/client';
import stravaService from '../services/stravaService.js';
import { logger } from './logger.js';

const prisma = new PrismaClient();

/**
 * Re-transform all activities using the raw data and updated calculations
 * This is useful after updating the unit conversion logic
 */
export async function retransformAllActivities() {
  try {
    logger.info('Starting activity re-transformation using raw data...');

    // Get all raw activities with their corresponding activity IDs
    const rawActivities = await prisma.rawActivity.findMany({
      select: {
        activityId: true,
        rawData: true,
      },
    });

    logger.info(`Found ${rawActivities.length} raw activities to re-transform`);

    if (rawActivities.length === 0) {
      logger.info('No raw activities found. Nothing to re-transform.');
      return { success: true, processed: 0, errors: 0 };
    }

    let processed = 0;
    let errors = 0;

    // Process activities in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < rawActivities.length; i += batchSize) {
      const batch = rawActivities.slice(i, i + batchSize);
      
      logger.info(`Processing batch ${Math.floor(i / batchSize) + 1} (activities ${i + 1}-${Math.min(i + batchSize, rawActivities.length)})`);

      for (const rawActivity of batch) {
        try {
          // Parse the raw Strava data
          const stravaActivity = JSON.parse(rawActivity.rawData);

          // Transform using the updated conversion logic
          const transformed = stravaService.transformActivity(stravaActivity);

          // Upsert gear if present
          let gearId = null;
          const { gearData } = transformed;
          if (gearData && gearData.id) {
            await prisma.gear.upsert({
              where: { id: gearData.id },
              update: gearData,
              create: gearData,
            });
            gearId = gearData.id;
          }

          // Update the activity record with the new transformed data and gearId
          await prisma.activity.update({
            where: {
              id: rawActivity.activityId,
            },
            data: {
              // Update all the converted fields
              distance: transformed.activityData.distance,
              totalElevationGain: transformed.activityData.totalElevationGain,
              elevationHigh: transformed.activityData.elevationHigh,
              elevationLow: transformed.activityData.elevationLow,
              averageSpeed: transformed.activityData.averageSpeed,
              maxSpeed: transformed.activityData.maxSpeed,
              averageTemperature: transformed.activityData.averageTemperature,
              segmentEfforts: transformed.activityData.segmentEfforts,
              komCount: transformed.activityData.komCount,
              bestKomRank: transformed.activityData.bestKomRank,
              bestPrRank: transformed.activityData.bestPrRank,
              updatedAt: new Date(),
              gearId: gearId,
            },
          });

          processed++;
        } catch (error) {
          logger.error(`Failed to re-transform activity ${rawActivity.activityId}:`, error.message);
          errors++;
        }
      }

      // Add a small delay between batches to be gentle on the database
      if (i + batchSize < rawActivities.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    logger.info(`Re-transformation complete. Processed: ${processed}, Errors: ${errors}`);
    
    return {
      success: true,
      processed,
      errors,
      total: rawActivities.length
    };

  } catch (error) {
    logger.error('Error during activity re-transformation:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Re-transform activities for a specific user
 */
export async function retransformUserActivities(athleteId) {
  try {
    logger.info(`Starting activity re-transformation for athlete ${athleteId}...`);

    // Get raw activities for the specific user
    const rawActivities = await prisma.rawActivity.findMany({
      where: {
        activity: {
          athleteId: BigInt(athleteId)
        }
      },
      select: {
        activityId: true,
        rawData: true,
      },
    });

    logger.info(`Found ${rawActivities.length} raw activities for athlete ${athleteId}`);

    if (rawActivities.length === 0) {
      logger.info(`No raw activities found for athlete ${athleteId}. Nothing to re-transform.`);
      return { success: true, processed: 0, errors: 0 };
    }

    let processed = 0;
    let errors = 0;

    for (const rawActivity of rawActivities) {
      try {
        // Parse the raw Strava data
        const stravaActivity = JSON.parse(rawActivity.rawData);

        // Transform using the updated conversion logic
        const transformed = stravaService.transformActivity(stravaActivity);

        // Upsert gear if present
        let gearId = null;
        const { gearData } = transformed;
        if (gearData && gearData.id) {
          await prisma.gear.upsert({
            where: { id: gearData.id },
            update: gearData,
            create: gearData,
          });
          gearId = gearData.id;
        }

        // Update the activity record
        await prisma.activity.update({
          where: {
            id: rawActivity.activityId,
          },
          data: {
            distance: transformed.activityData.distance,
            totalElevationGain: transformed.activityData.totalElevationGain,
            elevationHigh: transformed.activityData.elevationHigh,
            elevationLow: transformed.activityData.elevationLow,
            averageSpeed: transformed.activityData.averageSpeed,
            maxSpeed: transformed.activityData.maxSpeed,
            averageTemperature: transformed.activityData.averageTemperature,
            segmentEfforts: transformed.activityData.segmentEfforts,
            komCount: transformed.activityData.komCount,
            bestKomRank: transformed.activityData.bestKomRank,
            bestPrRank: transformed.activityData.bestPrRank,
            updatedAt: new Date(),
            gearId: gearId,
          },
        });

        processed++;
      } catch (error) {
        logger.error(`Failed to re-transform activity ${rawActivity.activityId}:`, error.message);
        errors++;
      }
    }

    logger.info(`Re-transformation complete for athlete ${athleteId}. Processed: ${processed}, Errors: ${errors}`);
    
    return {
      success: true,
      processed,
      errors,
      total: rawActivities.length,
      athleteId
    };

  } catch (error) {
    logger.error(`Error during activity re-transformation for athlete ${athleteId}:`, error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export functions for direct usage
export { retransformAllActivities as default };
