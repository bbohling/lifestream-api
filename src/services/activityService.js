import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Activity Service
 * Handles database operations for activities
 */
export class ActivityService {
  /**
   * Upsert activity (update if exists, create if not)
   * Now handles both activity data and raw data separately
   */
  async upsertActivity(transformedActivity) {
    try {
      const { activityData, rawData } = transformedActivity;

      const activity = await prisma.activity.upsert({
        where: { id: activityData.id },
        update: activityData,
        create: activityData,
      });

      // Store raw data in separate table
      await prisma.rawActivity.upsert({
        where: { activityId: activityData.id },
        update: { rawData },
        create: {
          activityId: activityData.id,
          rawData,
        },
      });

      return activity;
    } catch (error) {
      logger.error(
        `Failed to upsert activity ${transformedActivity.activityData?.id || 'unknown'}:`,
        error.message
      );
      throw error;
    }
  }

  /**
   * Batch upsert activities with concurrency control
   */
  async upsertActivities(activities, concurrency = 5) {
    const results = [];

    // Process activities in batches to avoid overwhelming the database
    for (let i = 0; i < activities.length; i += concurrency) {
      const batch = activities.slice(i, i + concurrency);
      const batchPromises = batch.map((activity) => this.upsertActivity(activity));

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        logger.info(
          `Processed activities ${i + 1} to ${Math.min(i + concurrency, activities.length)} of ${activities.length}`
        );
      } catch (error) {
        logger.error(`Error processing batch ${i / concurrency + 1}:`, error.message);
        throw error;
      }
    }

    return results;
  }

  /**
   * Get activities for yearly report
   */
  async getYearlyActivities(athleteId) {
    try {
      const activities = await prisma.activity.findMany({
        where: {
          athleteId: BigInt(athleteId),
          activityType: {
            in: ['VirtualRide', 'Ride'],
          },
        },
        select: {
          startDate: true,
          distance: true,
          movingTime: true,
          totalElevationGain: true,
          kilojoules: true,
          sufferScore: true,
        },
        orderBy: {
          startDate: 'asc',
        },
      });

      // Group by year and calculate aggregates
      const yearlyData = {};

      activities.forEach((activity) => {
        const year = activity.startDate.getFullYear();

        if (!yearlyData[year]) {
          yearlyData[year] = {
            activities: [],
            dates: new Set(),
          };
        }

        yearlyData[year].activities.push(activity);
        yearlyData[year].dates.add(activity.startDate.toDateString());
      });

      // Calculate metrics for each year
      const results = Object.entries(yearlyData).map(([year, data]) => {
        const { activities: yearActivities, dates } = data;

        const totalDistance = yearActivities.reduce((sum, a) => sum + (a.distance || 0), 0);
        const totalElevation = yearActivities.reduce(
          (sum, a) => sum + (a.totalElevationGain || 0),
          0
        );
        const totalMovingTime = yearActivities.reduce((sum, a) => sum + (a.movingTime || 0), 0);
        const totalKilojoules = yearActivities.reduce((sum, a) => sum + (a.kilojoules || 0), 0);
        const totalSufferScore = yearActivities.reduce((sum, a) => sum + (a.sufferScore || 0), 0);

        return {
          year: parseInt(year),
          totalRides: yearActivities.length,
          rideDays: dates.size,
          miles: Math.round(totalDistance / 1609.34),
          hours: Math.round(totalMovingTime / 3600),
          climbing: Math.round(totalElevation / 0.3048),
          calories: Math.round(totalKilojoules),
          avgSufferScore:
            yearActivities.length > 0 ? Math.round(totalSufferScore / yearActivities.length) : 0,
        };
      });

      return results.sort((a, b) => b.year - a.year);
    } catch (error) {
      logger.error(`Failed to get yearly activities for athlete ${athleteId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get activities for progress report (year comparison)
   */
  async getActivitiesForYearComparison(athleteId, currentYear, startDate, endDate) {
    try {
      const activities = await prisma.activity.findMany({
        where: {
          athleteId: BigInt(athleteId),
          activityType: {
            in: ['VirtualRide', 'Ride'],
          },
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          startDate: true,
          distance: true,
          movingTime: true,
          totalElevationGain: true,
          kilojoules: true,
          sufferScore: true,
        },
        orderBy: {
          startDate: 'asc',
        },
      });

      return activities;
    } catch (error) {
      logger.error(`Failed to get activities for year comparison:`, error.message);
      throw error;
    }
  }

  /**
   * Get user by name
   */
  async getUserByName(name) {
    try {
      return await prisma.user.findUnique({
        where: { name },
      });
    } catch (error) {
      logger.error(`Failed to get user by name ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Update user tokens
   */
  async updateUserTokens(name, tokenData) {
    try {
      return await prisma.user.update({
        where: { name },
        data: {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresAt: tokenData.expiresAt,
        },
      });
    } catch (error) {
      logger.error(`Failed to update tokens for user ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Update user's last sync timestamp
   */
  async updateLastSyncAt(name) {
    try {
      return await prisma.user.update({
        where: { name },
        data: {
          lastSyncAt: new Date(),
        },
      });
    } catch (error) {
      logger.error(`Failed to update lastSyncAt for user ${name}:`, error.message);
      throw error;
    }
  }

  /**
   * Get activities count and latest activity date for a user
   */
  async getUserActivityStats(athleteId) {
    try {
      const [total, latest] = await Promise.all([
        prisma.activity.count({
          where: { athleteId: BigInt(athleteId) },
        }),
        prisma.activity.findFirst({
          where: { athleteId: BigInt(athleteId) },
          orderBy: { startDate: 'desc' },
          select: { startDate: true },
        }),
      ]);

      return {
        totalActivities: total,
        latestActivityDate: latest?.startDate || null,
      };
    } catch (error) {
      logger.error(`Failed to get activity stats for athlete ${athleteId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get KOM activities for a user
   */
  async getKomActivities(athleteId, limit = 50) {
    try {
      return await prisma.activity.findMany({
        where: {
          athleteId: BigInt(athleteId),
          komCount: {
            gt: 0,
          },
        },
        select: {
          id: true,
          name: true,
          startDate: true,
          komCount: true,
          bestKomRank: true,
          bestPrRank: true,
          segmentEfforts: true,
        },
        orderBy: [{ komCount: 'desc' }, { bestKomRank: 'asc' }],
        take: limit,
      });
    } catch (error) {
      logger.error(`Failed to get KOM activities for athlete ${athleteId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get KOM statistics for a user
   */
  async getKomStats(athleteId) {
    try {
      const [totalKoms, totalActivitiesWithKoms, bestRank] = await Promise.all([
        // Total KOMs across all activities
        prisma.activity.aggregate({
          where: {
            athleteId: BigInt(athleteId),
            komCount: { gt: 0 },
          },
          _sum: { komCount: true },
        }),
        // Total activities with at least one KOM
        prisma.activity.count({
          where: {
            athleteId: BigInt(athleteId),
            komCount: { gt: 0 },
          },
        }),
        // Best KOM rank achieved
        prisma.activity.aggregate({
          where: {
            athleteId: BigInt(athleteId),
            bestKomRank: { not: null },
          },
          _min: { bestKomRank: true },
        }),
      ]);

      return {
        totalKoms: totalKoms._sum.komCount || 0,
        activitiesWithKoms: totalActivitiesWithKoms,
        bestKomRank: bestRank._min.bestKomRank,
      };
    } catch (error) {
      logger.error(`Failed to get KOM stats for athlete ${athleteId}:`, error.message);
      throw error;
    }
  }
}

export default new ActivityService();
