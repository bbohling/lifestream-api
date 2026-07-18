import { Hono } from 'hono';
import { logger } from '../utils/logger.js';

const bulksync = new Hono();

/**
 * GET /v1/bulksync/overview
 * Get overview of all bulk sync operations
 * (registered before /:userId routes so "overview" isn't captured as a userId)
 */
bulksync.get('/overview', async (c) => {
  const { prisma } = c.get('services');

  const allStates = await prisma.bulkSyncState.findMany({
    select: {
      userId: true,
      athleteId: true,
      status: true,
      phase: true,
      totalActivities: true,
      processedActivities: true,
      requestsUsedToday: true,
      startDate: true,
      completedAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  const summary = {
    total: allStates.length,
    byStatus: {},
    byPhase: {},
  };

  allStates.forEach((state) => {
    summary.byStatus[state.status] = (summary.byStatus[state.status] || 0) + 1;
    summary.byPhase[state.phase] = (summary.byPhase[state.phase] || 0) + 1;
  });

  return c.json({
    success: true,
    summary,
    states: allStates.map((state) => ({
      ...state,
      athleteId: state.athleteId.toString(),
      progress:
        state.totalActivities > 0
          ? Math.round((state.processedActivities / state.totalActivities) * 100)
          : 0,
    })),
  });
});

/**
 * POST /v1/bulksync/:userId/start
 * Start a new bulk sync or resume existing one
 */
bulksync.post('/:userId/start', async (c) => {
  const userId = c.req.param('userId');
  const body = await c.req.json().catch(() => ({}));
  const { force = false } = body;

  if (!userId) {
    return c.json({ error: 'User ID is required' }, 400);
  }

  logger.info(`Starting bulk sync for user: ${userId}`);

  const { activityService, stravaService, bulkSyncManager } = c.get('services');

  // Get user and check tokens
  const user = await activityService.getUserByName(userId);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Check if token needs refreshing
  let accessToken = user.accessToken;
  if (stravaService.isTokenExpired(user.expiresAt)) {
    logger.info('Access token expired, refreshing...');
    const tokenData = await stravaService.refreshToken(user.refreshToken);
    await activityService.updateUserTokens(userId, tokenData);
    accessToken = tokenData.accessToken;
  }

  // Check existing state
  const currentProgress = await bulkSyncManager.getBulkSyncProgress(userId);

  if (currentProgress.status === 'complete' && !force) {
    return c.json({
      success: true,
      message: 'Bulk sync already complete',
      alreadyComplete: true,
      progress: currentProgress,
    });
  }

  if (currentProgress.status === 'running') {
    return c.json({
      success: true,
      message: 'Bulk sync already running',
      alreadyRunning: true,
      progress: currentProgress,
    });
  }

  // If force is true and sync was complete, reset to fetch new activities
  if (force && currentProgress.status === 'complete') {
    logger.info(`Force flag set - resetting bulk sync state to fetch new activities`);
    await bulkSyncManager.resetBulkSync(userId);
  }

  // Start or resume bulk sync
  const result = await bulkSyncManager.resumeBulkSync(userId, accessToken);

  // Fetch and upsert KOMs for athlete after bulk sync
  const koms = await stravaService.fetchKoms(user.athleteId, accessToken);
  const komResult = await stravaService.upsertKoms(koms, user.athleteId);

  return c.json({
    success: true,
    message: result.alreadyComplete
      ? 'Bulk sync was already complete'
      : result.isComplete
        ? 'Bulk sync completed successfully'
        : 'Bulk sync started/resumed - will continue tomorrow if daily limit reached',
    result,
    komsAdded: komResult.added,
    progress: await bulkSyncManager.getBulkSyncProgress(userId),
  });
});

/**
 * GET /v1/bulksync/:userId/status
 * Get current bulk sync progress and status
 */
bulksync.get('/:userId/status', async (c) => {
  const userId = c.req.param('userId');

  if (!userId) {
    return c.json({ error: 'User ID is required' }, 400);
  }

  const { bulkSyncManager } = c.get('services');
  const progress = await bulkSyncManager.getBulkSyncProgress(userId);

  return c.json({
    success: true,
    progress,
  });
});

/**
 * POST /v1/bulksync/:userId/resume
 * Resume a paused bulk sync
 */
bulksync.post('/:userId/resume', async (c) => {
  const userId = c.req.param('userId');

  if (!userId) {
    return c.json({ error: 'User ID is required' }, 400);
  }

  logger.info(`Resuming bulk sync for user: ${userId}`);

  const { activityService, stravaService, bulkSyncManager } = c.get('services');

  // Get user and refresh token if needed
  const user = await activityService.getUserByName(userId);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  let accessToken = user.accessToken;
  if (stravaService.isTokenExpired(user.expiresAt)) {
    logger.info('Access token expired, refreshing...');
    const tokenData = await stravaService.refreshToken(user.refreshToken);
    await activityService.updateUserTokens(userId, tokenData);
    accessToken = tokenData.accessToken;
  }

  // Resume bulk sync
  const result = await bulkSyncManager.resumeBulkSync(userId, accessToken);

  return c.json({
    success: true,
    message: result.alreadyComplete
      ? 'Bulk sync was already complete'
      : result.isComplete
        ? 'Bulk sync completed successfully'
        : 'Bulk sync resumed - will continue tomorrow if daily limit reached',
    result,
    progress: await bulkSyncManager.getBulkSyncProgress(userId),
  });
});

/**
 * DELETE /v1/bulksync/:userId/reset
 * Reset bulk sync state (start over)
 */
bulksync.delete('/:userId/reset', async (c) => {
  const userId = c.req.param('userId');

  if (!userId) {
    return c.json({ error: 'User ID is required' }, 400);
  }

  logger.info(`Resetting bulk sync state for user: ${userId}`);

  const { prisma } = c.get('services');

  await prisma.bulkSyncSummaries.deleteMany({
    where: { userId },
  });

  await prisma.bulkSyncState.deleteMany({
    where: { userId },
  });

  return c.json({
    success: true,
    message: 'Bulk sync state reset successfully',
  });
});

export default bulksync;
