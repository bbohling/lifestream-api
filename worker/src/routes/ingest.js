import { Hono } from 'hono';
import { logger } from '../utils/logger.js';
import { activitySchema } from '../utils/validation.js';
import { ValidationError } from '../utils/errors.js';

const ingest = new Hono();

/**
 * GET /v1/ingest/:userId[?getAll=true]
 * Syncs user activities from Strava API
 */
ingest.get('/:userId', async (c) => {
  const userId = c.req.param('userId');
  const getAll = c.req.query('getAll');

  if (!userId) {
    return c.json({ error: 'No user provided.' }, 400);
  }

  logger.info(`Starting data ingestion for user: ${userId}, getAll: ${getAll}`);

  const { activityService, ingestService } = c.get('services');
  const user = await activityService.getUserByName(userId);
  if (!user) {
    return c.json({ error: 'User not found.' }, 404);
  }

  const { added, updated, komsAdded } = await ingestService.syncUser(userId, {
    getAll: getAll === 'true',
  });

  return c.json({ msg: 'success', added, updated, komsAdded });
});

/**
 * POST /v1/ingest
 * Upserts a single activity
 */
ingest.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Invalid activity data');
  }
  const { activityService } = c.get('services');
  const result = await activityService.upsertActivity(parsed.data);
  return c.json({ msg: 'success', data: result }, 200);
});

export default ingest;
