import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import StravaService from '../src/services/stravaService.js';
import ActivityService from '../src/services/activityService.js';

const prisma = new PrismaClient();

describe('Integration Tests - Raw Data Separation', () => {
  const testUserId = 'test-user-id';
  const testAthleteId = BigInt(99999999);
  const testActivityId = BigInt(88888888);

  beforeAll(async () => {
    // Create a test user
    await prisma.user.create({
      data: {
        id: testUserId,
        name: 'test-user',
        athleteId: testAthleteId,
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.rawActivity.deleteMany({
      where: { activityId: testActivityId },
    });
    await prisma.activity.deleteMany({
      where: { athleteId: testAthleteId },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  it('should store activity data and raw data in separate tables', async () => {
    // Mock activity data from Strava API
    const mockStravaActivity = {
      id: Number(testActivityId),
      name: 'Test Integration Ride',
      type: 'Ride',
      distance: 10000,
      moving_time: 1800,
      elapsed_time: 2000,
      total_elevation_gain: 200,
      start_date_local: '2024-01-15T08:00:00',
      athlete: { id: Number(testAthleteId) },
      segment_efforts: [
        {
          id: 11111,
          name: 'Test Segment',
          segment: { id: 22222, name: 'Test Segment' },
          kom_rank: 1,
          pr_rank: null,
          achievements: ['kom'],
          elapsed_time: 300,
          moving_time: 295,
          distance: 1000,
          start_index: 50,
          end_index: 100,
        },
      ],
      suffer_score: 50,
    };

    // Transform the activity using StravaService
    const transformed = StravaService.transformActivity(mockStravaActivity);

    // Verify the transformation structure
    expect(transformed).toHaveProperty('activityData');
    expect(transformed).toHaveProperty('rawData');
    expect(transformed.activityData.id).toBe(testActivityId);
    expect(transformed.activityData.komCount).toBe(1);
    expect(transformed.rawData).toBe(JSON.stringify(mockStravaActivity));

    // Upsert the activity using ActivityService
    const result = await ActivityService.upsertActivity(transformed);

    // Verify activity was stored in main table
    expect(result.id).toBe(testActivityId);
    expect(result.name).toBe('Test Integration Ride');
    expect(result.komCount).toBe(1);

    // Verify activity exists in database
    const storedActivity = await prisma.activity.findUnique({
      where: { id: testActivityId },
      include: { rawActivity: true },
    });

    expect(storedActivity).toBeTruthy();
    expect(storedActivity.name).toBe('Test Integration Ride');
    expect(storedActivity.komCount).toBe(1);
    expect(storedActivity.rawActivity).toBeTruthy();
    expect(storedActivity.rawActivity.rawData).toBe(JSON.stringify(mockStravaActivity));

    // Verify raw data is in separate table
    const rawActivity = await prisma.rawActivity.findUnique({
      where: { activityId: testActivityId },
    });

    expect(rawActivity).toBeTruthy();
    expect(rawActivity.rawData).toBe(JSON.stringify(mockStravaActivity));

    // Parse and verify the raw data is complete
    const parsedRawData = JSON.parse(rawActivity.rawData);
    expect(parsedRawData.segment_efforts).toHaveLength(1);
    expect(parsedRawData.segment_efforts[0].kom_rank).toBe(1);
  });

  it('should handle activity updates correctly', async () => {
    // Update the same activity with new data
    const updatedMockActivity = {
      id: Number(testActivityId),
      name: 'Updated Test Ride',
      type: 'Ride',
      distance: 12000, // Updated distance
      moving_time: 2000, // Updated time
      elapsed_time: 2200,
      total_elevation_gain: 250, // Updated elevation
      start_date_local: '2024-01-15T08:00:00',
      athlete: { id: Number(testAthleteId) },
      segment_efforts: [], // No segments this time
      suffer_score: 60, // Updated suffer score
    };

    const transformed = StravaService.transformActivity(updatedMockActivity);
    await ActivityService.upsertActivity(transformed);

    // Verify the activity was updated, not duplicated
    const activities = await prisma.activity.findMany({
      where: { id: testActivityId },
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].name).toBe('Updated Test Ride');
    expect(activities[0].distance).toBe(7.456472839797682); // 12000 meters converted to miles
    expect(activities[0].komCount).toBe(0); // No KOMs this time

    // Verify raw data was also updated
    const rawActivity = await prisma.rawActivity.findUnique({
      where: { activityId: testActivityId },
    });

    expect(rawActivity).toBeTruthy();
    const parsedRawData = JSON.parse(rawActivity.rawData);
    expect(parsedRawData.name).toBe('Updated Test Ride');
    expect(parsedRawData.distance).toBe(12000);
    expect(parsedRawData.segment_efforts).toHaveLength(0);
  });

  it('should upsert gear and link to activity', async () => {
    const gearId = 'test-gear-123';
    const mockStravaActivityWithGear = {
      id: Number(testActivityId) + 1,
      name: 'Ride with Gear',
      type: 'Ride',
      distance: 5000,
      moving_time: 1000,
      elapsed_time: 1200,
      total_elevation_gain: 100,
      start_date_local: '2024-01-16T08:00:00',
      athlete: { id: Number(testAthleteId) },
      gear_id: gearId,
      gear: {
        id: gearId,
        name: 'Test Bike',
        brand_name: 'TestBrand',
        model_name: 'ModelX',
        frame_type: 1,
        description: 'A test bike',
        distance: 12345,
        primary: true,
        resource_state: 2,
      },
      segment_efforts: [],
      suffer_score: 10,
    };

    const transformed = StravaService.transformActivity(mockStravaActivityWithGear);
    await ActivityService.upsertActivity(transformed);

    // Verify activity is linked to gear
    const activity = await prisma.activity.findUnique({
      where: { id: BigInt(mockStravaActivityWithGear.id) },
      include: { gear: true },
    });
    expect(activity).toBeTruthy();
    expect(activity.gearId).toBe(gearId);
    expect(activity.gear).toBeTruthy();
    expect(activity.gear.name).toBe('Test Bike');
    expect(activity.gear.brandName).toBe('TestBrand');
    expect(activity.gear.modelName).toBe('ModelX');
    expect(activity.gear.frameType).toBe(1);
    expect(activity.gear.primary).toBe(true);
    expect(activity.gear.description).toBe('A test bike');
    expect(activity.gear.distance).toBe(12345);

    // Verify gear exists in Gear table
    const gear = await prisma.gear.findUnique({ where: { id: gearId } });
    expect(gear).toBeTruthy();
    expect(gear.name).toBe('Test Bike');
    expect(gear.brandName).toBe('TestBrand');
    expect(gear.modelName).toBe('ModelX');
    expect(gear.frameType).toBe(1);
    expect(gear.primary).toBe(true);
    expect(gear.description).toBe('A test bike');
    expect(gear.distance).toBe(12345);
  });
});
