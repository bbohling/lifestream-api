import express from 'express';
import bulkSyncManager from '../services/bulkSyncManager.js';
import activityService from '../services/activityService.js';
import stravaService from '../services/stravaService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /v1/bulksync/:userId/start
 * Start a new bulk sync or resume existing one
 */
router.post('/:userId/start', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { force = false } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    logger.info(`Starting bulk sync for user: ${userId}`);

    // Get user and check tokens
    const user = await activityService.getUserByName(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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
      return res.json({
        success: true,
        message: 'Bulk sync already complete',
        alreadyComplete: true,
        progress: currentProgress,
      });
    }

    if (currentProgress.status === 'running') {
      return res.json({
        success: true,
        message: 'Bulk sync already running',
        alreadyRunning: true,
        progress: currentProgress,
      });
    }

    // Start or resume bulk sync
    const result = await bulkSyncManager.resumeBulkSync(userId, accessToken);

    res.json({
      success: true,
      message: result.alreadyComplete 
        ? 'Bulk sync was already complete'
        : result.isComplete 
          ? 'Bulk sync completed successfully'
          : 'Bulk sync started/resumed - will continue tomorrow if daily limit reached',
      result,
      progress: await bulkSyncManager.getBulkSyncProgress(userId),
    });

  } catch (error) {
    logger.error('Bulk sync start error:', error.message);
    next(error);
  }
});

/**
 * GET /v1/bulksync/:userId/status
 * Get current bulk sync progress and status
 */
router.get('/:userId/status', async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const progress = await bulkSyncManager.getBulkSyncProgress(userId);

    res.json({
      success: true,
      progress,
    });

  } catch (error) {
    logger.error('Bulk sync status error:', error.message);
    next(error);
  }
});

/**
 * POST /v1/bulksync/:userId/resume
 * Resume a paused bulk sync
 */
router.post('/:userId/resume', async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    logger.info(`Resuming bulk sync for user: ${userId}`);

    // Get user and refresh token if needed
    const user = await activityService.getUserByName(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
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

    res.json({
      success: true,
      message: result.alreadyComplete 
        ? 'Bulk sync was already complete'
        : result.isComplete
          ? 'Bulk sync completed successfully'
          : 'Bulk sync resumed - will continue tomorrow if daily limit reached',
      result,
      progress: await bulkSyncManager.getBulkSyncProgress(userId),
    });

  } catch (error) {
    logger.error('Bulk sync resume error:', error.message);
    next(error);
  }
});

/**
 * DELETE /v1/bulksync/:userId/reset
 * Reset bulk sync state (start over)
 */
router.delete('/:userId/reset', async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    logger.info(`Resetting bulk sync state for user: ${userId}`);

    // Delete existing bulk sync state
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      await prisma.bulkSyncSummaries.deleteMany({
        where: { userId },
      });

      await prisma.bulkSyncState.deleteMany({
        where: { userId },
      });

      res.json({
        success: true,
        message: 'Bulk sync state reset successfully',
      });

    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    logger.error('Bulk sync reset error:', error.message);
    next(error);
  }
});

/**
 * GET /v1/bulksync/overview
 * Get overview of all bulk sync operations
 */
router.get('/overview', async (req, res, next) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
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

      allStates.forEach(state => {
        summary.byStatus[state.status] = (summary.byStatus[state.status] || 0) + 1;
        summary.byPhase[state.phase] = (summary.byPhase[state.phase] || 0) + 1;
      });

      res.json({
        success: true,
        summary,
        states: allStates.map(state => ({
          ...state,
          athleteId: state.athleteId.toString(),
          progress: state.totalActivities > 0 
            ? Math.round((state.processedActivities / state.totalActivities) * 100)
            : 0,
        })),
      });

    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    logger.error('Bulk sync overview error:', error.message);
    next(error);
  }
});

export default router;
