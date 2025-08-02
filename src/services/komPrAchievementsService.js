// KOM/PR Achievements Over Time Service
// Aggregates KOM and PR counts by month and year for a user
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
const prisma = new PrismaClient();

/**
 * Returns KOM and PR achievements over time for the given athleteId
 * @param {bigint} athleteId
 * @returns {Promise<Array>} Array of { year, month, komCount, prCount, bestKomRank, bestPrRank }
 */
export async function getKomPrAchievementsOverTime(athleteId) {
  try {
    const activities = await prisma.activity.findMany({
      where: { athleteId },
      select: {
        startDate: true,
        komCount: true,
        prCount: true,
        bestKomRank: true,
        bestPrRank: true,
      },
      orderBy: { startDate: 'asc' },
    });
    // Group by year and month
    const achievements = {};
    for (const a of activities) {
      const date = new Date(a.startDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-based
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      if (!achievements[key]) {
        achievements[key] = {
          year,
          month,
          komCount: 0,
          prCount: 0,
          bestKomRank: null,
          bestPrRank: null,
        };
      }
      achievements[key].komCount += a.komCount || 0;
      achievements[key].prCount += a.prCount || 0;
      // Track best (lowest) rank for the month
      if (a.bestKomRank != null && (achievements[key].bestKomRank == null || a.bestKomRank < achievements[key].bestKomRank)) {
        achievements[key].bestKomRank = a.bestKomRank;
      }
      if (a.bestPrRank != null && (achievements[key].bestPrRank == null || a.bestPrRank < achievements[key].bestPrRank)) {
        achievements[key].bestPrRank = a.bestPrRank;
      }
    }
    // Return sorted by year, month
    return Object.values(achievements).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
  } catch (err) {
    logger.error('Failed to generate KOM/PR achievements over time', { athleteId, error: err });
    throw new Error('Could not generate KOM/PR achievements report');
  }
}
