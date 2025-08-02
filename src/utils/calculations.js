import { format, startOfYear, endOfYear, getDayOfYear } from 'date-fns';
import { PACIFIC_OFFSET_HOURS } from '../config.js';

/**
 * Unit conversion utilities matching the original implementation.
 * All formulas are exact and documented for maintainability.
 */
export const conversions = {
  /**
   * Convert meters to miles.
   * @param {number} meters
   * @returns {number} miles
   */
  metersToMiles: (meters) => meters / 1609.34,
  /**
   * Convert meters to feet.
   * @param {number} meters
   * @returns {number} feet
   */
  metersToFeet: (meters) => meters / 0.3048,
  /**
   * Convert meters/second to miles/hour.
   * @param {number} mps
   * @returns {number} mph
   */
  mpsToMph: (mps) => (mps * 25) / 11,
  /**
   * Convert Celsius to Fahrenheit.
   * @param {number} celsius
   * @returns {number} fahrenheit
   */
  celsiusToFahrenheit: (celsius) => (celsius * 9) / 5 + 32,
};

/**
 * Date utilities for Pacific Time calculations.
 * All date operations use UTC-8 offset for consistency.
 */
export const dateUtils = {
  /**
   * Get current year in Pacific Time.
   * @returns {number} year
   */
  getCurrentYear: () => {
    const now = new Date();
    // Convert to Pacific Time by adding offset
    const pacificTime = new Date(now.getTime() + PACIFIC_OFFSET_HOURS * 60 * 60 * 1000);
    return pacificTime.getFullYear();
  },

  /**
   * Get start of year in Pacific Time.
   * @returns {Date}
   */
  getStartOfYear: () => {
    return new Date(year, 0, 1);
  },

  /**
   * Get end of year in Pacific Time.
   * @returns {Date}
   */
  getEndOfYear: () => {
    return new Date(year, 11, 31, 23, 59, 59, 999);
  },

  /**
   * Get day of year for a given date
   */
  getDayOfYear: (date) => {
    return getDayOfYear(date);
  },

  /**
   * Get current day of year in Pacific Time
   */
  getCurrentDayOfYear: () => {
    const now = new Date();
    return getDayOfYear(now);
  },

  /**
   * Format date for database storage (remove Z suffix as per original)
   */
  formatForStorage: (dateString) => {
    return dateString.replace('Z', '');
  },

  /**
   * Convert date to Pacific Time zone
   */
  toPacificTime: (date) => {
    return new Date(date.getTime() + PACIFIC_OFFSET_HOURS * 60 * 60 * 1000);
  },

  /**
   * Get unique dates from activities (for day counting)
   */
  getUniqueDates: (activities) => {
    const dates = new Set();
    activities.forEach((activity) => {
      const dateKey = format(activity.startDate, 'yyyy-MM-dd');
      dates.add(dateKey);
    });
    return Array.from(dates);
  },
};

/**
 * Calculate cycling report metrics
 */
export const reportCalculations = {
  /**
   * Calculate progress report metrics for a set of activities
   */
  calculateProgressMetrics: (activities, dayOfYear) => {
    // Sum distance in meters, then convert to miles
    const totalDistanceMeters = activities.reduce((sum, a) => sum + (a.distance || 0), 0); // meters
    const miles = Math.round(conversions.metersToMiles(totalDistanceMeters) * 10) / 10;
    const totalElevation = activities.reduce((sum, a) => sum + (a.totalElevationGain || 0), 0); // feet
    const totalMovingTime = activities.reduce((sum, a) => sum + (a.movingTime || 0), 0);
    const totalKilojoules = activities.reduce((sum, a) => sum + (a.kilojoules || 0), 0); // fixed spelling
    const totalSufferScore = activities.reduce((sum, a) => sum + (a.sufferScore || 0), 0);

    const daysRidden = dateUtils.getUniqueDates(activities).length;
    const rides = activities.length;

    return {
      rides,
      daysRidden,
      miles,
      rideAverage: rides > 0 ? Math.round((miles / rides) * 10) / 10 : 0,
      dailyAverage: dayOfYear > 0 ? Math.round((miles / dayOfYear) * 10) / 10 : 0,
      percentageOfDays: dayOfYear > 0 ? Math.floor((daysRidden / dayOfYear) * 100) : 0,
      climbing: Math.round(totalElevation),
      calories: Math.round(totalKilojoules),
      movingTimeMinutes: Math.round(totalMovingTime / 60),
      averageSufferScore: rides > 0 ? Math.round(totalSufferScore / rides) : 0,
    };
  },
};

/**
 * Convert seconds to hours (float)
 * @param {number} seconds
 * @returns {number} hours
 */
export function secondsToHours(seconds) {
  return seconds / 3600;
}
