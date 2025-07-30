import { describe, it, expect, vi, beforeEach } from 'vitest';
import StravaService from '../src/services/stravaService.js';

// Mock fetch for testing
global.fetch = vi.fn();

describe('StravaService Refactoring', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Two-step activity fetching', () => {
    it('should fetch activity summaries first, then detailed data', async () => {
      const mockAccessToken = 'test_token';

      // Mock the activity summaries response
      const mockSummaries = [
        { id: 123, name: 'Test Activity 1', type: 'Ride' },
        { id: 456, name: 'Test Activity 2', type: 'Ride' },
      ];

      // Mock the detailed activity responses
      const mockDetailedActivity1 = {
        id: 123,
        name: 'Test Activity 1',
        type: 'Ride',
        distance: 25000,
        segment_efforts: [
          {
            id: 789,
            name: 'Test Segment',
            segment: { id: 101, name: 'Test Segment' },
            kom_rank: null,
            pr_rank: 2,
            achievements: [],
            elapsed_time: 300,
            moving_time: 295,
            distance: 1200,
            start_index: 100,
            end_index: 200,
          },
        ],
        athlete: { id: 12345 },
      };

      const mockDetailedActivity2 = {
        id: 456,
        name: 'Test Activity 2',
        type: 'Ride',
        distance: 15000,
        segment_efforts: [],
        athlete: { id: 12345 },
      };

      // Create mock headers object
      const createMockHeaders = () => ({
        get: vi.fn((name) => {
          const headers = {
            'x-ratelimit-limit': '100,1000',
            'x-ratelimit-usage': '5,50',
            'x-readratelimit-limit': '100,1000',
            'x-readratelimit-usage': '5,50',
          };
          return headers[name.toLowerCase()];
        }),
      });

      // Setup fetch mocks
      fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: createMockHeaders(),
          json: () => Promise.resolve(mockSummaries),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: createMockHeaders(),
          json: () => Promise.resolve(mockDetailedActivity1),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: createMockHeaders(),
          json: () => Promise.resolve(mockDetailedActivity2),
        });

      // Call the method
      const result = await StravaService.fetchRecentActivities(mockAccessToken);

      // Verify the calls
      expect(fetch).toHaveBeenCalledTimes(3);

      // First call should be for summaries
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        'https://www.strava.com/api/v3/athlete/activities?per_page=200&page=1',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test_token' },
        })
      );

      // Second and third calls should be for detailed data
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        'https://www.strava.com/api/v3/activities/123?include_all_efforts=true',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test_token' },
        })
      );

      expect(fetch).toHaveBeenNthCalledWith(
        3,
        'https://www.strava.com/api/v3/activities/456?include_all_efforts=true',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test_token' },
        })
      );

      // Verify results
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockDetailedActivity1);
      expect(result[1]).toEqual(mockDetailedActivity2);
    });

    it('should handle smart incremental sync with lastSyncAt', async () => {
      const mockAccessToken = 'test_token';
      const lastSyncAt = new Date('2024-01-01T00:00:00Z');

      // Mock summaries response
      const mockSummaries = [{ id: 789, name: 'New Activity', start_date: '2024-01-05T10:00:00Z' }];

      const mockDetailedActivity = {
        id: 789,
        name: 'New Activity',
        segment_efforts: [],
        athlete: { id: 12345 },
      };

      const createMockHeaders = () => ({
        get: vi.fn((name) => {
          const headers = {
            'x-ratelimit-limit': '100,1000',
            'x-ratelimit-usage': '5,50',
            'x-readratelimit-limit': '100,1000',
            'x-readratelimit-usage': '5,50',
          };
          return headers[name.toLowerCase()];
        }),
      });

      fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: createMockHeaders(),
          json: () => Promise.resolve(mockSummaries),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: createMockHeaders(),
          json: () => Promise.resolve(mockDetailedActivity),
        });

      const result = await StravaService.fetchIncrementalActivities(mockAccessToken, lastSyncAt);

      // Should call with 'after' parameter (1 week before lastSyncAt)
      const expectedAfter = Math.floor((lastSyncAt.getTime() - 7 * 24 * 60 * 60 * 1000) / 1000);
      expect(fetch).toHaveBeenCalledWith(
        `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=1&after=${expectedAfter}`,
        expect.objectContaining({
          headers: { Authorization: 'Bearer test_token' },
        })
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockDetailedActivity);
    });

    it('should transform activity with segment efforts correctly', () => {
      const mockDetailedActivity = {
        id: 123456789,
        name: 'Test Ride with Segments',
        type: 'Ride',
        distance: 25000,
        moving_time: 3600,
        segment_efforts: [
          {
            id: 987654321,
            name: 'Tunnel Road',
            segment: { id: 673683, name: 'Tunnel Road' },
            kom_rank: 5,
            pr_rank: null,
            achievements: ['pr'],
            elapsed_time: 420,
            moving_time: 415,
            distance: 1500,
            start_index: 150,
            end_index: 300,
          },
          {
            id: 987654322,
            name: 'Hawk Hill',
            segment: { id: 229781, name: 'Hawk Hill' },
            kom_rank: null,
            pr_rank: 3,
            achievements: [],
            elapsed_time: 680,
            moving_time: 675,
            distance: 2500,
            start_index: 400,
            end_index: 600,
          },
        ],
        athlete: { id: 12345678 },
      };

      const transformed = StravaService.transformActivity(mockDetailedActivity);

      expect(transformed.activityData.id).toBe(BigInt(123456789));
      expect(transformed.activityData.athleteId).toBe(BigInt(12345678));
      expect(transformed.activityData.name).toBe('Test Ride with Segments');

      // Check KOM/PR fields
      expect(transformed.activityData.komCount).toBe(1); // One KOM (rank 5)
      expect(transformed.activityData.bestKomRank).toBe(5); // Best KOM rank
      expect(transformed.activityData.bestPrRank).toBe(3); // Best PR rank

      // Check that segment efforts are stored as JSON string
      expect(transformed.activityData.segmentEfforts).toBeDefined();
      const segmentEfforts = JSON.parse(transformed.activityData.segmentEfforts);

      // Check that raw data is stored separately
      expect(transformed.rawData).toBeDefined();
      const rawData = JSON.parse(transformed.rawData);
      expect(rawData).toEqual(mockDetailedActivity);

      expect(segmentEfforts).toHaveLength(2);
      expect(segmentEfforts[0]).toEqual({
        id: 987654321,
        name: 'Tunnel Road',
        segmentId: 673683,
        segmentName: 'Tunnel Road',
        komRank: 5,
        prRank: null,
        achievements: ['pr'],
        elapsedTime: 420,
        movingTime: 415,
        distance: 1500,
        startIndex: 150,
        endIndex: 300,
      });

      expect(segmentEfforts[1]).toEqual({
        id: 987654322,
        name: 'Hawk Hill',
        segmentId: 229781,
        segmentName: 'Hawk Hill',
        komRank: null,
        prRank: 3,
        achievements: [],
        elapsedTime: 680,
        movingTime: 675,
        distance: 2500,
        startIndex: 400,
        endIndex: 600,
      });
    });

    it('should handle activities without segment efforts', () => {
      const mockActivityWithoutSegments = {
        id: 123456789,
        name: 'Indoor Trainer Ride',
        type: 'VirtualRide',
        distance: 20000,
        moving_time: 3000,
        // No segment_efforts field
        athlete: { id: 12345678 },
      };

      const transformed = StravaService.transformActivity(mockActivityWithoutSegments);

      expect(transformed.activityData.segmentEfforts).toBe('[]');
      expect(transformed.activityData.komCount).toBe(0);
      expect(transformed.activityData.bestKomRank).toBeNull();
      expect(transformed.activityData.bestPrRank).toBeNull();
    });

    it('should calculate KOM statistics correctly', () => {
      const mockActivityWithMultipleKoms = {
        id: 555666777,
        name: 'Epic KOM Hunt',
        type: 'Ride',
        segment_efforts: [
          {
            id: 1,
            name: 'Climb 1',
            segment: { id: 101, name: 'Climb 1' },
            kom_rank: 3, // KOM rank 3
            pr_rank: 1, // PR rank 1
            achievements: ['kom', 'pr'],
          },
          {
            id: 2,
            name: 'Climb 2',
            segment: { id: 102, name: 'Climb 2' },
            kom_rank: 1, // KOM rank 1 (best)
            pr_rank: null,
            achievements: ['kom'],
          },
          {
            id: 3,
            name: 'Flat Section',
            segment: { id: 103, name: 'Flat Section' },
            kom_rank: null,
            pr_rank: 2, // PR rank 2
            achievements: ['pr'],
          },
        ],
        athlete: { id: 99999 },
      };

      const transformed = StravaService.transformActivity(mockActivityWithMultipleKoms);

      expect(transformed.activityData.komCount).toBe(2); // Two KOMs
      expect(transformed.activityData.bestKomRank).toBe(1); // Best KOM rank is 1
      expect(transformed.activityData.bestPrRank).toBe(1); // Best PR rank is 1
    });

    it('should handle API errors gracefully during detail fetching', async () => {
      const mockAccessToken = 'test_token';

      // Mock summaries response
      const mockSummaries = [
        { id: 123, name: 'Test Activity 1' },
        { id: 456, name: 'Test Activity 2' },
      ];

      // Mock responses: summaries succeed, first detail fails, second succeeds
      const mockDetailedActivity2 = {
        id: 456,
        name: 'Test Activity 2',
        segment_efforts: [],
        athlete: { id: 12345 },
      };

      // Create mock headers object
      const createMockHeaders = () => ({
        get: vi.fn((name) => {
          const headers = {
            'x-ratelimit-limit': '100,1000',
            'x-ratelimit-usage': '10,100',
            'x-readratelimit-limit': '100,1000',
            'x-readratelimit-usage': '10,100',
          };
          return headers[name.toLowerCase()];
        }),
      });

      fetch
        .mockResolvedValueOnce({
          ok: true,
          headers: createMockHeaders(),
          json: () => Promise.resolve(mockSummaries),
        })
        .mockRejectedValueOnce(new Error('API Rate Limited'))
        .mockResolvedValueOnce({
          ok: true,
          headers: createMockHeaders(),
          json: () => Promise.resolve(mockDetailedActivity2),
        });

      const result = await StravaService.fetchRecentActivities(mockAccessToken);

      // Should only return the successful activity
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockDetailedActivity2);
    });
  });

  describe('Rate Limiting', () => {
    it('should parse rate limit headers correctly', async () => {
      const mockAccessToken = 'test_token';

      const mockHeaders = {
        get: vi.fn((name) => {
          const headers = {
            'x-ratelimit-limit': '200,2000',
            'x-ratelimit-usage': '150,1500',
            'x-readratelimit-limit': '100,1000',
            'x-readratelimit-usage': '80,800',
          };
          return headers[name.toLowerCase()];
        }),
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        headers: mockHeaders,
        json: () => Promise.resolve([]),
      });

      await StravaService.fetchActivitySummaries(mockAccessToken);

      // Check that rate limit state was updated
      expect(StravaService.rateLimitState.overall.limit15min).toBe(200);
      expect(StravaService.rateLimitState.overall.limitDaily).toBe(2000);
      expect(StravaService.rateLimitState.overall.usage15min).toBe(150);
      expect(StravaService.rateLimitState.overall.usageDaily).toBe(1500);

      expect(StravaService.rateLimitState.read.limit15min).toBe(100);
      expect(StravaService.rateLimitState.read.limitDaily).toBe(1000);
      expect(StravaService.rateLimitState.read.usage15min).toBe(80);
      expect(StravaService.rateLimitState.read.usageDaily).toBe(800);
    });

    it('should calculate delays based on usage percentage', () => {
      // Set high usage to trigger delays
      StravaService.rateLimitState.read.usage15min = 95;
      StravaService.rateLimitState.read.limit15min = 100;
      StravaService.rateLimitState.read.usageDaily = 500;
      StravaService.rateLimitState.read.limitDaily = 1000;

      const delay = StravaService.calculateRateLimitDelay();
      expect(delay).toBeGreaterThan(0); // Should apply delay for high usage
    });

    it('should handle 429 rate limit response with retry', async () => {
      const mockAccessToken = 'test_token';

      const mockHeaders = {
        get: vi.fn((name) => {
          if (name === 'retry-after') return '60'; // 60 seconds
          return null;
        }),
      };

      // First call returns 429, second call succeeds
      fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: mockHeaders,
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: vi.fn(() => null), // No rate limit headers on retry
          },
          json: () => Promise.resolve([]),
        });

      // Mock setTimeout to avoid actual delays in tests
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((fn) => fn());

      const result = await StravaService.fetchActivitySummaries(mockAccessToken);

      // Should retry and succeed
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual([]);

      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    });

    it('should reset rate limit counters at appropriate intervals', () => {
      const now = new Date();

      // Set old reset times to trigger reset
      StravaService.rateLimitState.overall.lastReset15min = new Date(
        now.getTime() - 16 * 60 * 1000
      ); // 16 minutes ago
      StravaService.rateLimitState.overall.lastResetDaily = new Date(
        now.getTime() - 25 * 60 * 60 * 1000
      ); // 25 hours ago

      // Set some usage
      StravaService.rateLimitState.overall.usage15min = 50;
      StravaService.rateLimitState.overall.usageDaily = 500;

      StravaService.checkAndResetRateLimits();

      // Usage should be reset
      expect(StravaService.rateLimitState.overall.usage15min).toBe(0);
      expect(StravaService.rateLimitState.overall.usageDaily).toBe(0);
    });
  });
});
