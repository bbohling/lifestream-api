import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bulkSyncManager from '../src/services/bulkSyncManager.js';

const prisma = new PrismaClient();

describe('Bulk Sync Manager', () => {
  let testUserId;
  let testAthleteId;

  beforeAll(async () => {
    testUserId = 'test-bulk-sync-user';
    testAthleteId = BigInt(888888888);

    // Create test user
    await prisma.user.upsert({
      where: { athleteId: testAthleteId },
      create: {
        name: testUserId,
        athleteId: testAthleteId,
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      },
      update: {},
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.bulkSyncSummaries.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.bulkSyncState.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.deleteMany({
      where: { athleteId: testAthleteId },
    });
    await prisma.$disconnect();
  });

  it('should create initial bulk sync state', async () => {
    const state = await bulkSyncManager.getBulkSyncState(testUserId);

    expect(state).toBeTruthy();
    expect(state.userId).toBe(testUserId);
    expect(state.athleteId).toBe(testAthleteId);
    expect(state.status).toBe('pending');
    expect(state.phase).toBe('summary_fetch');
    expect(state.totalActivities).toBe(0);
    expect(state.processedActivities).toBe(0);
  });

  it('should track bulk sync progress', async () => {
    const progress = await bulkSyncManager.getBulkSyncProgress(testUserId);

    expect(progress).toBeTruthy();
    expect(progress.status).toBe('pending');
    expect(progress.phase).toBe('summary_fetch');
    expect(progress.progress.percentage).toBe(0);
    expect(progress.rateLimits.dailyLimit).toBe(950);
    expect(progress.rateLimits.remainingToday).toBe(950);
  });

  it('should update bulk sync state', async () => {
    await bulkSyncManager.updateBulkSyncState(testUserId, {
      status: 'running',
      totalActivities: 100,
      processedActivities: 25,
      requestsUsedToday: 25,
    });

    const progress = await bulkSyncManager.getBulkSyncProgress(testUserId);

    expect(progress.status).toBe('running');
    expect(progress.progress.totalActivities).toBe(100);
    expect(progress.progress.processedActivities).toBe(25);
    expect(progress.progress.percentage).toBe(25);
    expect(progress.rateLimits.requestsUsedToday).toBe(25);
    expect(progress.rateLimits.remainingToday).toBe(925);
  });

  it('should handle daily reset logic', async () => {
    const state = await bulkSyncManager.getBulkSyncState(testUserId);
    
    // Test with same day - should not reset
    expect(bulkSyncManager.checkDailyReset(state)).toBe(false);
    
    // Test with different day - simulate by changing lastResetDate
    const yesterdayState = {
      ...state,
      lastResetDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    };
    
    expect(bulkSyncManager.checkDailyReset(yesterdayState)).toBe(true);
  });

  it('should calculate remaining requests correctly', async () => {
    const state = await bulkSyncManager.getBulkSyncState(testUserId);
    
    // Should return full limit for fresh day
    const remaining = bulkSyncManager.getRemainingRequests(state);
    expect(remaining).toBeLessThanOrEqual(950);
    expect(remaining).toBeGreaterThanOrEqual(0);
  });
});
