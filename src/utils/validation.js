import { z } from 'zod';

/**
 * Zod schema for environment variables.
 * Ensures all required env vars are present and valid.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),
  DATABASE_URL: z.string().url(),
  STRAVA_CLIENT_ID: z.string().min(1),
  STRAVA_CLIENT_SECRET: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().url().optional(),
});

/**
 * Zod schema for user data.
 * Validates user fields and Strava tokens.
 */
export const userSchema = z.object({
  name: z.string().min(1).max(100),
  athleteId: z.bigint().positive(),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number().int().positive(),
});

/**
 * Zod schema for activity data.
 * Validates all key activity fields, including BigInt IDs and dates.
 */
export const activitySchema = z.object({
  id: z.bigint().positive(),
  athleteId: z.bigint().positive(),
  name: z.string().default(''),
  distance: z.number().nonnegative().nullable(),
  movingTime: z.number().int().nonnegative().nullable(),
  elapsedTime: z.number().int().nonnegative().nullable(),
  totalElevationGain: z.number().nonnegative().nullable(),
  elevationHigh: z.number().nullable(),
  elevationLow: z.number().nullable(),
  activityType: z.string().min(1),
  startDate: z.date(),
  achievementCount: z.number().int().nonnegative().nullable(),
  prCount: z.number().int().nonnegative().nullable(),
  trainer: z.boolean().default(false),
  commute: z.boolean().default(false),
  gear: z.string().nullable(),
  averageSpeed: z.number().nonnegative().nullable(),
  maxSpeed: z.number().nonnegative().nullable(),
  averageCadence: z.number().nonnegative().nullable(),
  averageTemperature: z.number().nullable(),
  averageWatts: z.number().nonnegative().nullable(),
  maxWatts: z.number().int().nonnegative().nullable(),
  weightedAverageWatts: z.number().int().nonnegative().nullable(),
  kilojoules: z.number().nonnegative().nullable(),
  deviceWatts: z.boolean().nullable(),
  averageHeartRate: z.number().nonnegative().nullable(),
  maxHeartRate: z.number().int().nonnegative().nullable(),
  sufferScore: z.number().int().nonnegative().default(0),
});

/**
 * Zod schema for request parameters.
 * Validates userId and query parameters for ingestion.
 */
export const userIdSchema = z.object({
  userId: z.string().min(1),
});

export const ingestQuerySchema = z.object({
  getAll: z.enum(['true', 'false']).optional(),
});
