// Centralized configuration for Lifestream API (Workers port).
// Strava credentials come from Worker secrets (env.STRAVA_CLIENT_ID /
// env.STRAVA_CLIENT_SECRET) and are passed to StravaService per request —
// process.env does not exist on Workers.

export const STRAVA_API_BASE_URL = 'https://www.strava.com/api/v3';
export const STRAVA_OAUTH_URL = 'https://www.strava.com/oauth/token';

// Strava API Rate Limits
// Default limits: 200 requests/15min, 2,000 requests/day
// Elevated limits (approved apps): 300/3,000 (read), 600/6,000 (overall)
// These are initial defaults; actual values are updated from API response headers
export const RATE_LIMITS = {
  read: { limit15min: 300, limitDaily: 3000 }, // Non-upload endpoints (GET requests)
  overall: { limit15min: 600, limitDaily: 6000 }, // All endpoints combined
};

export const BULK_SYNC = {
  dailyLimit: 2500, // Conservative limit (leaves 500 buffer from 3,000 read limit)
  batchSize: 5,
  delayBetweenBatches: 2000, // ms
};

// Workers cap outbound subrequests per invocation (50 on the free plan).
// Long-running sync work (bulksync, full ingest) spends its budget and then
// pauses; state is persisted so another request resumes where it left off.
export const SUBREQUEST_BUDGET = 40;

export const PACIFIC_OFFSET_HOURS = -8;
