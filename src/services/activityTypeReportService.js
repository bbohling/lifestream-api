// Activity Type Breakdown Service
// Aggregates activity counts and total distance by activity type for a user
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
const prisma = new PrismaClient();

/**
 * Returns activity type breakdown for the given athleteId
 * @param {bigint} athleteId
 * @returns {Promise<Array>} Array of { activityType, count, totalDistance (miles) }
 */
export async function getActivityTypeBreakdown(athleteId) {
  try {
    const activities = await prisma.activity.findMany({
      where: { athleteId },
      select: {
        activityType: true,
        distance: true,
      },
    });
    const breakdown = {};
    for (const a of activities) {
      if (!a.activityType) continue;
      if (!breakdown[a.activityType]) {
        breakdown[a.activityType] = { count: 0, totalDistance: 0 };
      }
      breakdown[a.activityType].count++;
      breakdown[a.activityType].totalDistance += a.distance || 0;
    }
    return Object.entries(breakdown).map(([activityType, data]) => ({
      activityType,
      count: data.count,
      totalDistance: Math.round(data.totalDistance * 10) / 10, // round to the tenth place
    }));
  } catch (err) {
    logger.error('Failed to generate activity type breakdown', { athleteId, error: err });
    throw new Error('Could not generate activity type breakdown');
  }
}
