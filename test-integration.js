#!/usr/bin/env node

/**
 * Quick integration test to verify the rawData refactoring works correctly
 * This test verifies that we can transform and store activities with the new structure
 */

import StravaService from './src/services/stravaService.js';
import ActivityService from './src/services/activityService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRawDataRefactor() {
  try {
    console.log('🧪 Testing rawData refactor...');

    // Mock activity data similar to what Strava would return
    const mockStravaActivity = {
      id: 999999999,
      name: 'Test Integration Activity',
      type: 'Ride',
      distance: 15000,
      moving_time: 2400,
      elapsed_time: 2700,
      total_elevation_gain: 300,
      start_date: '2024-07-30T10:00:00Z',
      athlete: { id: 12345678 },
      segment_efforts: [
        {
          id: 111111,
          name: 'Test Segment',
          segment: { id: 222222, name: 'Test Segment' },
          kom_rank: 1,
          pr_rank: null,
          achievements: ['kom'],
          elapsed_time: 180,
          moving_time: 175,
          distance: 800,
          start_index: 50,
          end_index: 100,
        },
      ],
    };

    // Test transformation
    console.log('  ✓ Transforming activity...');
    const transformed = StravaService.transformActivity(mockStravaActivity);

    // Verify structure
    if (!transformed.activityData || !transformed.rawData) {
      throw new Error('Transform failed: missing activityData or rawData');
    }

    if (transformed.activityData.id !== BigInt(999999999)) {
      throw new Error('Transform failed: incorrect activity ID');
    }

    if (transformed.activityData.komCount !== 1) {
      throw new Error('Transform failed: incorrect KOM count');
    }

    // Test database storage
    console.log('  ✓ Storing in database...');
    const storedActivity = await ActivityService.upsertActivity(transformed);

    // Verify activity was stored
    const retrievedActivity = await prisma.activity.findUnique({
      where: { id: BigInt(999999999) },
    });

    if (!retrievedActivity) {
      throw new Error('Activity not found in database');
    }

    // Verify raw data was stored separately
    const retrievedRawData = await prisma.rawActivity.findUnique({
      where: { activityId: BigInt(999999999) },
    });

    if (!retrievedRawData) {
      throw new Error('Raw data not found in database');
    }

    // Verify raw data content
    const parsedRawData = JSON.parse(retrievedRawData.rawData);
    if (parsedRawData.id !== 999999999) {
      throw new Error('Raw data content incorrect');
    }

    // Cleanup
    console.log('  ✓ Cleaning up...');
    await prisma.rawActivity.delete({
      where: { activityId: BigInt(999999999) },
    });
    await prisma.activity.delete({
      where: { id: BigInt(999999999) },
    });

    console.log('✅ Integration test passed! RawData refactor working correctly.');
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testRawDataRefactor();
