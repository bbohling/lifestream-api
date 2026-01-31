// Year-over-Year Progress Service
// Compares key metrics for the same period across years for a user
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
const prisma = new PrismaClient();

/**
 * Returns year-over-year progress for the given athleteId
 * @param {bigint} athleteId
 * @returns {Promise<Array>} Array of { year, rides, miles, elevation, movingTimeHours, kilojoules }
 */
export async function getYearOverYearProgress(athleteId) {
  try {
    const activities = await prisma.activity.findMany({
      where: { 
        athleteId,
        activityType: 'Ride',
      },
      select: {
        startDate: true,
        distance: true,
        totalElevationGain: true,
        kilojoules: true,
        movingTime: true,
      },
      orderBy: { startDate: 'asc' },
    });
    // Group by year
    const yearly = {};
    for (const a of activities) {
      const year = new Date(a.startDate).getFullYear();
      if (!yearly[year]) {
        yearly[year] = {
          year,
          rides: 0,
          miles: 0,
          elevation: 0,
          movingTime: 0,
          kilojoules: 0,
        };
      }
      yearly[year].rides++;
      yearly[year].miles += a.distance || 0;
      yearly[year].elevation += a.totalElevationGain || 0;
      yearly[year].movingTime += a.movingTime || 0;
      yearly[year].kilojoules += a.kilojoules || 0;
    }
    // Format and round
    return Object.values(yearly).map(y => ({
      year: y.year,
      rides: y.rides,
      miles: Math.round(y.miles * 10) / 10,
      elevation: Math.round(y.elevation),
      movingTimeHours: Math.round((y.movingTime / 3600) * 10) / 10,
      kilojoules: Math.round(y.kilojoules),
    })).sort((a, b) => a.year - b.year);
  } catch (err) {
    logger.error('Failed to generate year-over-year progress', { athleteId, error: err });
    throw new Error('Could not generate year-over-year progress report');
  }
}
