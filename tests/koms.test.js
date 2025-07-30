import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/server.js';

const prisma = new PrismaClient();

describe('KOM Endpoints', () => {
  const testUserId = 'test-kom-user';
  const testAthleteId = BigInt(77777777);
  const testActivityId = BigInt(99999999);

  beforeAll(async () => {
    // Create a test user
    await prisma.user.create({
      data: {
        id: testUserId,
        name: 'test-kom-user',
        athleteId: testAthleteId,
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      },
    });

    // Create a test activity with KOMs
    await prisma.activity.create({
      data: {
        id: testActivityId,
        athleteId: testAthleteId,
        name: 'Test KOM Activity',
        activityType: 'Ride',
        startDate: new Date('2024-01-15T08:00:00'),
        komCount: 2,
        bestKomRank: 1,
        bestPrRank: 3,
        segmentEfforts: JSON.stringify([
          {
            id: 111,
            name: 'Test Segment 1',
            segmentId: 222,
            segmentName: 'Test Segment 1',
            komRank: 1,
            prRank: null,
            achievements: ['kom'],
          },
          {
            id: 333,
            name: 'Test Segment 2',
            segmentId: 444,
            segmentName: 'Test Segment 2',
            komRank: 2,
            prRank: 3,
            achievements: ['kom', 'pr'],
          },
        ]),
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.activity.deleteMany({
      where: { athleteId: testAthleteId },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  it('should get KOM activities for a user', async () => {
    const response = await request(app).get('/v1/koms/test-kom-user').expect(200);

    expect(response.body).toHaveProperty('activities');
    expect(response.body).toHaveProperty('total');
    expect(response.body.activities).toHaveLength(1);

    const activity = response.body.activities[0];
    expect(activity.id).toBe(testActivityId.toString());
    expect(activity.name).toBe('Test KOM Activity');
    expect(activity.komCount).toBe(2);
    expect(activity.bestKomRank).toBe(1);
    expect(activity.bestPrRank).toBe(3);
    expect(activity.koms).toHaveLength(2);
    expect(activity.koms[0].segmentName).toBe('Test Segment 1');
    expect(activity.koms[0].rank).toBe(1);
  });

  it('should get KOM stats for a user', async () => {
    const response = await request(app).get('/v1/koms/test-kom-user/stats').expect(200);

    expect(response.body).toHaveProperty('user', 'test-kom-user');
    expect(response.body).toHaveProperty('stats');

    const stats = response.body.stats;
    expect(stats.totalKoms).toBe(2);
    expect(stats.activitiesWithKoms).toBe(1);
    expect(stats.bestKomRank).toBe(1);
  });

  it('should return 404 for non-existent user KOM activities', async () => {
    const response = await request(app).get('/v1/koms/nonexistent-user').expect(404);

    expect(response.body).toHaveProperty('error', 'User not found.');
  });

  it('should return 404 for non-existent user KOM stats', async () => {
    const response = await request(app).get('/v1/koms/nonexistent-user/stats').expect(404);

    expect(response.body).toHaveProperty('error', 'User not found.');
  });
});
