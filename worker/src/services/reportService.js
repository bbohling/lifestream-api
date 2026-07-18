import { dateUtils, reportCalculations } from '../utils/calculations.js';
import { logger } from '../utils/logger.js';

/**
 * Report Service
 * Handles cycling analytics and report generation.
 * All calculations use Pacific Time and already-converted units (miles, feet).
 */
export class ReportService {
  constructor(activityService) {
    this.activityService = activityService;
  }

  /**
   * Generate yearly cycling report for a user.
   * @param {string|number} userId - The user identifier.
   * @returns {Promise<Object>} Yearly report data.
   */
  async generateYearlyReport(userId) {
    try {
      // Log operation for audit
      logger.info(`Generating yearly report for user: ${userId}`);

      const user = await this.activityService.getUserByName(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const yearlyData = await this.activityService.getYearlyActivities(user.athleteId);

      return {
        data: yearlyData,
      };
    } catch (error) {
      // Log error with context
      logger.error(`Failed to generate yearly report for ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate progress comparison report (current year vs last year).
   * @param {string|number} userId - The user identifier.
   * @returns {Promise<Object>} Progress report data.
   */
  async generateProgressReport(userId) {
    try {
      logger.info(`Generating progress report for user: ${userId}`);

      const user = await this.activityService.getUserByName(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const currentYear = dateUtils.getCurrentYear();
      const lastYear = currentYear - 1;
      const currentDayOfYear = dateUtils.getCurrentDayOfYear();

      // Get current year activities (from start of year to now)
      const currentYearStart = dateUtils.getStartOfYear(currentYear);
      const now = new Date();

      const currentYearActivities = await this.activityService.getActivitiesForYearComparison(
        user.athleteId,
        currentYear,
        currentYearStart,
        now
      );

      // Get last year activities (same period - from start of year to same day of year)
      const lastYearStart = dateUtils.getStartOfYear(lastYear);
      const lastYearEnd = new Date(lastYear, 0, currentDayOfYear);

      const lastYearActivities = await this.activityService.getActivitiesForYearComparison(
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

export default ReportService;
