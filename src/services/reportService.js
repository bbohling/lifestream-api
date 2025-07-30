import { dateUtils, reportCalculations } from '../utils/calculations.js';
import activityService from './activityService.js';
import { logger } from '../utils/logger.js';

/**
 * Report Service
 * Handles cycling analytics and report generation
 */
export class ReportService {
  /**
   * Generate yearly cycling report
   */
  async generateYearlyReport(userId) {
    try {
      logger.info(`Generating yearly report for user: ${userId}`);

      const user = await activityService.getUserByName(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const yearlyData = await activityService.getYearlyActivities(user.athleteId);

      return {
        data: yearlyData,
      };
    } catch (error) {
      logger.error(`Failed to generate yearly report for ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate progress comparison report (current year vs last year)
   */
  async generateProgressReport(userId) {
    try {
      logger.info(`Generating progress report for user: ${userId}`);

      const user = await activityService.getUserByName(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const currentYear = dateUtils.getCurrentYear();
      const lastYear = currentYear - 1;
      const currentDayOfYear = dateUtils.getCurrentDayOfYear();

      // Get current year activities (from start of year to now)
      const currentYearStart = dateUtils.getStartOfYear(currentYear);
      const now = new Date();

      const currentYearActivities = await activityService.getActivitiesForYearComparison(
        user.athleteId,
        currentYear,
        currentYearStart,
        now
      );

      // Get last year activities (same period - from start of year to same day of year)
      const lastYearStart = dateUtils.getStartOfYear(lastYear);
      const lastYearEnd = new Date(lastYear, 0, currentDayOfYear);

      const lastYearActivities = await activityService.getActivitiesForYearComparison(
        user.athleteId,
        lastYear,
        lastYearStart,
        lastYearEnd
      );

      // Calculate metrics for both periods
      const thisYearMetrics = reportCalculations.calculateProgressMetrics(
        currentYearActivities,
        currentDayOfYear
      );

      const lastYearMetrics = reportCalculations.calculateProgressMetrics(
        lastYearActivities,
        currentDayOfYear
      );

      logger.info(
        `Progress report generated: ${thisYearMetrics.rides} rides this year, ${lastYearMetrics.rides} rides last year`
      );

      return {
        data: {
          thisYear: thisYearMetrics,
          lastYear: lastYearMetrics,
        },
      };
    } catch (error) {
      logger.error(`Failed to generate progress report for ${userId}:`, error.message);
      throw error;
    }
  }
}

export default new ReportService();
