// Gear Usage Report Service
// Aggregates gear usage stats for a user
import { PrismaClient } from '@prisma/client';
import { secondsToHours } from '../utils/calculations.js';
import { logger } from '../utils/logger.js';
const prisma = new PrismaClient();

/**
 * Returns gear usage stats for the given athleteId
 * @param {bigint} athleteId
 * @returns {Promise<Array>} Array of gear usage objects
 */
export async function getGearUsageReport(athleteId) {
  try {
    const gears = await prisma.gear.findMany({
      where: { athleteId },
      include: {
        activities: {
          select: {
            id: true,
            movingTime: true,
            startDate: true,
          },
        },
      },
    });

    return gears.map(gear => {
      // gear.distance is now always in miles, do not convert
      const distance = gear.distance != null ? gear.distance : null;
      const activityDistance = gear.activities.reduce((sum, a) => sum + (a.distance || 0), 0); // Already in miles
      const totalMovingTime = gear.activities.reduce((sum, a) => sum + (a.movingTime || 0), 0);
      const lastUsed = gear.activities.length
        ? gear.activities.reduce((latest, a) => a.startDate > latest ? a.startDate : latest, gear.activities[0].startDate)
        : null;
      return {
        id: gear.id,
        name: gear.name,
        brandName: gear.brandName,
        modelName: gear.modelName,
        primary: gear.primary,
        activityCount: gear.activities.length,
        distance, // miles from Strava gear.distance
        activityDistance, // sum of activity distances in miles
        totalMovingTimeSeconds: totalMovingTime,
        totalMovingTimeHours: secondsToHours(totalMovingTime),
        lastUsed,
      };
    });
  } catch (err) {
    logger.error('Failed to generate gear usage report', { athleteId, error: err });
    throw new Error('Could not generate gear usage report');
  }
}
