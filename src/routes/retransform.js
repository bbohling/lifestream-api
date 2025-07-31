import express from 'express';
import { retransformAllActivities, retransformUserActivities } from '../utils/retransformActivities.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * POST /v1/retransform/all
 * Re-transform all activities using raw data and updated calculations
 */
router.post('/all', async (req, res, next) => {
  try {
    logger.info('Starting re-transformation of all activities via API');
    
    const result = await retransformAllActivities();
    
    res.json({
      success: true,
      message: 'Re-transformation completed successfully',
      stats: {
        total: result.total,
        processed: result.processed,
        errors: result.errors,
        successRate: result.total > 0 ? ((result.processed / result.total) * 100).toFixed(1) + '%' : '0%'
      }
    });
    
  } catch (error) {
    logger.error('Re-transformation API error:', error.message);
    next(error);
  }
});

/**
 * POST /v1/retransform/user/:athleteId
 * Re-transform activities for a specific user using raw data
 */
router.post('/user/:athleteId', async (req, res, next) => {
  try {
    const { athleteId } = req.params;
    
    if (!athleteId) {
      return res.status(400).json({ error: 'Athlete ID is required' });
    }
    
    logger.info(`Starting re-transformation for athlete ${athleteId} via API`);
    
    const result = await retransformUserActivities(athleteId);
    
    res.json({
      success: true,
      message: `Re-transformation completed for athlete ${athleteId}`,
      stats: {
        athleteId: result.athleteId,
        total: result.total,
        processed: result.processed,
        errors: result.errors,
        successRate: result.total > 0 ? ((result.processed / result.total) * 100).toFixed(1) + '%' : '0%'
      }
    });
    
  } catch (error) {
    logger.error('User re-transformation API error:', error.message);
    next(error);
  }
});

/**
 * GET /v1/retransform/status
 * Get statistics about raw activities available for re-transformation
 */
router.get('/status', async (req, res, next) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Get counts of activities and raw activities
      const [activityCount, rawActivityCount, usersWithActivities] = await Promise.all([
        prisma.activity.count(),
        prisma.rawActivity.count(),
        prisma.user.findMany({
          select: {
            athleteId: true,
            name: true,
            _count: {
              select: {
                activities: true
              }
            }
          },
          where: {
            activities: {
              some: {}
            }
          }
        })
      ]);
      
      res.json({
        success: true,
        stats: {
          totalActivities: activityCount,
          totalRawActivities: rawActivityCount,
          coverage: rawActivityCount > 0 ? ((rawActivityCount / activityCount) * 100).toFixed(1) + '%' : '0%',
          usersWithActivities: usersWithActivities.map(user => ({
            athleteId: user.athleteId.toString(),
            name: user.name,
            activityCount: user._count.activities
          }))
        }
      });
      
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    logger.error('Re-transformation status API error:', error.message);
    next(error);
  }
});

export default router;
