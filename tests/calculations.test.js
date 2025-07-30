import { describe, it, expect } from 'vitest';
import { conversions, dateUtils, reportCalculations } from '../src/utils/calculations.js';

describe('Unit Conversions', () => {
  it('should convert meters to miles correctly', () => {
    expect(conversions.metersToMiles(1609.34)).toBeCloseTo(1, 2);
    expect(conversions.metersToMiles(0)).toBe(0);
  });

  it('should convert meters to feet correctly', () => {
    expect(conversions.metersToFeet(0.3048)).toBeCloseTo(1, 2);
    expect(conversions.metersToFeet(0)).toBe(0);
  });

  it('should convert m/s to mph correctly', () => {
    expect(conversions.mpsToMph(11)).toBeCloseTo(25, 2);
    expect(conversions.mpsToMph(0)).toBe(0);
  });

  it('should convert Celsius to Fahrenheit correctly', () => {
    expect(conversions.celsiusToFahrenheit(0)).toBe(32);
    expect(conversions.celsiusToFahrenheit(100)).toBe(212);
  });
});

describe('Date Utilities', () => {
  it('should get current year', () => {
    const year = dateUtils.getCurrentYear();
    expect(typeof year).toBe('number');
    expect(year).toBeGreaterThan(2020);
  });

  it('should get day of year correctly', () => {
    const jan1 = new Date('2024-01-01T12:00:00');
    expect(dateUtils.getDayOfYear(jan1)).toBe(1);

    const dec31 = new Date('2024-12-31T12:00:00');
    expect(dateUtils.getDayOfYear(dec31)).toBe(366); // 2024 is a leap year
  });

  it('should format date for storage', () => {
    const dateString = '2024-01-01T12:00:00Z';
    expect(dateUtils.formatForStorage(dateString)).toBe('2024-01-01T12:00:00');
  });

  it('should get unique dates from activities', () => {
    const activities = [
      { startDate: new Date('2024-01-01T08:00:00') },
      { startDate: new Date('2024-01-01T14:00:00') }, // Same day
      { startDate: new Date('2024-01-02T08:00:00') },
    ];

    const uniqueDates = dateUtils.getUniqueDates(activities);
    expect(uniqueDates).toHaveLength(2);
  });
});

describe('Report Calculations', () => {
  const mockActivities = [
    {
      distance: 16093.4, // ~10 miles
      totalElevationGain: 304.8, // ~1000 feet
      movingTime: 3600, // 1 hour
      kilojoules: 1000,
      sufferScore: 50,
      startDate: new Date('2024-01-01T08:00:00'),
    },
    {
      distance: 32186.8, // ~20 miles
      totalElevationGain: 609.6, // ~2000 feet
      movingTime: 7200, // 2 hours
      kilojoules: 2000,
      sufferScore: 75,
      startDate: new Date('2024-01-02T08:00:00'),
    },
  ];

  it('should calculate progress metrics correctly', () => {
    const dayOfYear = 100;
    const metrics = reportCalculations.calculateProgressMetrics(mockActivities, dayOfYear);

    expect(metrics.rides).toBe(2);
    expect(metrics.daysRidden).toBe(2);
    expect(metrics.miles).toBe(30); // Ceil of 29.97
    expect(metrics.rideAverage).toBe(15.0);
    expect(metrics.dailyAverage).toBe(0.3);
    expect(metrics.percentageOfDays).toBe(2);
    expect(metrics.climbing).toBe(3000); // Ceil of 3000.0 (exact)
    expect(metrics.calories).toBe(3000);
    expect(metrics.movingTimeMinutes).toBe(180); // 10800 seconds / 60
    expect(metrics.averageSufferScore).toBe(63); // (50 + 75) / 2 = 62.5, rounded to 63
  });

  it('should handle empty activities array', () => {
    const metrics = reportCalculations.calculateProgressMetrics([], 100);

    expect(metrics.rides).toBe(0);
    expect(metrics.daysRidden).toBe(0);
    expect(metrics.miles).toBe(0);
    expect(metrics.rideAverage).toBe(0);
    expect(metrics.dailyAverage).toBe(0);
    expect(metrics.averageSufferScore).toBe(0);
  });
});
