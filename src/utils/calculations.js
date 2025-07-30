import { format, startOfYear, endOfYear, getDayOfYear } from 'date-fns';

// Pacific Time zone offset (UTC-8, or UTC-7 during DST)
// For simplicity in testing, we'll use a fixed offset
const PACIFIC_OFFSET_HOURS = -8;

/**
 * Unit conversion utilities matching the original implementation
 */
export const conversions = {
  // Distance: meters to miles
  metersToMiles: (meters) => meters / 1609.34,

  // Elevation: meters to feet
  metersToFeet: (meters) => meters / 0.3048,

  // Speed: m/s to mph
  mpsToMph: (mps) => (mps * 25) / 11,

  // Temperature: Celsius to Fahrenheit
  celsiusToFahrenheit: (celsius) => (celsius * 9) / 5 + 32,
};

/**
 * Date utilities for Pacific Time calculations
 */
export const dateUtils = {
  /**
   * Get current year in Pacific Time
   */
  getCurrentYear: () => {
    const now = new Date();
    // Convert to Pacific Time by adding offset
    const pacificTime = new Date(now.getTime() + PACIFIC_OFFSET_HOURS * 60 * 60 * 1000);
    return pacificTime.getFullYear();
  },

  /**
   * Get start of year in Pacific Time
   */
  getStartOfYear: (year) => {
    return new Date(year, 0, 1);
  },

  /**
   * Get end of year in Pacific Time
   */
  getEndOfYear: (year) => {
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
    const totalDistance = activities.reduce((sum, a) => sum + (a.distance || 0), 0);
    const totalElevation = activities.reduce((sum, a) => sum + (a.totalElevationGain || 0), 0);
    const totalMovingTime = activities.reduce((sum, a) => sum + (a.movingTime || 0), 0);
    const totalKilojoules = activities.reduce((sum, a) => sum + (a.kilojoules || 0), 0);
    const totalSufferScore = activities.reduce((sum, a) => sum + (a.sufferScore || 0), 0);

    const miles = Math.ceil(conversions.metersToMiles(totalDistance));
    const daysRidden = dateUtils.getUniqueDates(activities).length;
    const rides = activities.length;

    return {
      rides,
      daysRidden,
      miles,
      rideAverage: rides > 0 ? Math.round((miles / rides) * 10) / 10 : 0,
      dailyAverage: dayOfYear > 0 ? Math.round((miles / dayOfYear) * 10) / 10 : 0,
      percentageOfDays: dayOfYear > 0 ? Math.round((daysRidden / dayOfYear) * 100) : 0,
      climbing: Math.ceil(conversions.metersToFeet(totalElevation)),
      calories: Math.ceil(totalKilojoules),
      movingTimeMinutes: Math.ceil(totalMovingTime / 60),
      averageSufferScore: rides > 0 ? Math.round(totalSufferScore / rides) : 0,
    };
  },
};
