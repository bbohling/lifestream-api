import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { retransformUserActivities } from '../src/utils/retransformActivities.js';

const prisma = new PrismaClient();

describe('Activity Re-transformation', () => {
  let testActivityId;
  let testAthleteId;

  beforeAll(async () => {
    // Create test data
    testAthleteId = BigInt(999999999);
    testActivityId = BigInt(888888888);

    // Insert a test user
    await prisma.user.upsert({
      where: { athleteId: testAthleteId },
      create: {
        name: 'test-retransform-user',
        athleteId: testAthleteId,
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      },
      update: {},
    });

    // Insert a test activity with metric values (pre-conversion)
    await prisma.activity.upsert({
      where: { id: testActivityId },
      create: {
        id: testActivityId,
        athleteId: testAthleteId,
        name: 'Test Retransform Activity',
        distance: 5000, // Metric value (should be converted to ~3.1 miles)
        totalElevationGain: 300, // Metric value (should be converted to ~984 feet)
        averageSpeed: 10, // Metric value (should be converted to ~22.7 mph)
        averageTemperature: 20, // Metric value (should be converted to 68°F)
        activityType: 'Ride',
        startDate: new Date('2024-01-01T08:00:00'),
        movingTime: 1800,
        elapsedTime: 1800,
      },
      update: {},
    });

    // Insert raw activity data with original Strava metric values
    const rawStravaData = {
      id: Number(testActivityId),
      name: 'Test Retransform Activity',
      distance: 5000, // meters
      total_elevation_gain: 300, // meters
      average_speed: 10, // m/s
      average_temp: 20, // Celsius
      type: 'Ride',
      start_date_local: '2024-01-01T08:00:00',
      moving_time: 1800,
      elapsed_time: 1800,
      athlete: { id: Number(testAthleteId) },
      segment_efforts: [],
    };

    await prisma.rawActivity.upsert({
      where: { activityId: testActivityId },
      create: {
        activityId: testActivityId,
        rawData: JSON.stringify(rawStravaData),
      },
      update: {
        rawData: JSON.stringify(rawStravaData),
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.rawActivity.deleteMany({
      where: { activityId: testActivityId },
    });
    await prisma.activity.deleteMany({
      where: { id: testActivityId },
    });
    await prisma.user.deleteMany({
      where: { athleteId: testAthleteId },
    });
    await prisma.$disconnect();
  });

  it('should re-transform activity data using raw data and conversions', async () => {
    // Get the activity before re-transformation
    const activityBefore = await prisma.activity.findUnique({
      where: { id: testActivityId },
    });

    expect(activityBefore).toBeTruthy();
    expect(activityBefore.distance).toBe(5000); // Original metric value

    // Run the re-transformation
    const result = await retransformUserActivities(testAthleteId.toString());

    expect(result.success).toBe(true);
    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);

    // Get the activity after re-transformation
    const activityAfter = await prisma.activity.findUnique({
      where: { id: testActivityId },
    });

    expect(activityAfter).toBeTruthy();
    
    // Verify conversions were applied
    expect(activityAfter.distance).toBeCloseTo(3.106864, 4); // 5000m converted to miles
    expect(activityAfter.totalElevationGain).toBeCloseTo(984.252, 3); // 300m converted to feet
    expect(activityAfter.averageSpeed).toBeCloseTo(22.727, 3); // 10 m/s converted to mph
    expect(activityAfter.averageTemperature).toBe(68); // 20°C converted to °F

    // Verify the updated timestamp changed
    expect(activityAfter.updatedAt.getTime()).toBeGreaterThan(activityBefore.updatedAt.getTime());
  });

  it('should handle missing raw data gracefully', async () => {
    // Create an activity without raw data
    const orphanActivityId = BigInt(777777777);
    
    await prisma.activity.create({
      data: {
        id: orphanActivityId,
        athleteId: testAthleteId,
        name: 'Orphan Activity',
        distance: 1000,
        activityType: 'Ride',
        startDate: new Date('2024-01-02T08:00:00'),
        movingTime: 600,
        elapsedTime: 600,
      },
    });

    // Re-transformation should skip activities without raw data
    const result = await retransformUserActivities(testAthleteId.toString());

    // Should still process the activity that has raw data
    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);

    // Clean up
    await prisma.activity.delete({
      where: { id: orphanActivityId },
    });
  });
});
