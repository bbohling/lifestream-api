// Centralized configuration for Lifestream API
// All config values should be imported from this file

export const STRAVA_API_BASE_URL = 'https://www.strava.com/api/v3';
export const STRAVA_OAUTH_URL = 'https://www.strava.com/oauth/token';
export const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
export const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
export const RATE_LIMITS = {
  read: { limit15min: 100, limitDaily: 2000 }, // Conservative daily limit; actual is 3,000 (READ) daily
  overall: { limit15min: 200, limitDaily: 5000 }, // actual is 6,000 (OVERALL) daily
};
export const BULK_SYNC = {
  dailyLimit: 1200, // Conservative daily limit
  batchSize: 5,
  delayBetweenBatches: 2000, // ms
};
export const PACIFIC_OFFSET_HOURS = -8;
