import express from 'express';
import reportService from '../services/reportService.js';
import { logger } from '../utils/logger.js';
import { getGearUsageReport } from '../services/gearReportService.js';
import activityService from '../services/activityService.js';
import { getActivityTypeBreakdown } from '../services/activityTypeReportService.js';
import { getKomPrAchievementsOverTime } from '../services/komPrAchievementsService.js';
import { getYearOverYearProgress } from '../services/yearOverYearProgressService.js';

const router = express.Router();

/**
 * GET /v1/reports/cycling/yearly/:userId
 * Returns yearly cycling statistics grouped by year
 */
router.get('/cycling/yearly/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'No user provided.' });
    }

    logger.info(`Generating yearly cycling report for user: ${userId}`);

    const report = await reportService.generateYearlyReport(userId);

    res.json(report);
  } catch (error) {
    logger.error('Yearly report error:', error.message);
    next(error);
  }
});

/**
 * GET /v1/reports/cycling/progress/:userId
 * Year-over-year comparison (current year vs same period last year)
 */
router.get('/cycling/progress/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'No user provided.' });
    }

    logger.info(`Generating progress report for user: ${userId}`);

    const report = await reportService.generateProgressReport(userId);

    res.json(report);
  } catch (error) {
    logger.error('Progress report error:', error.message);
    next(error);
  }
});

/**
 * GET /reports/gear-usage
 * Returns gear usage stats for the authenticated user
 */
router.get('/gear-usage', async (req, res) => {
  try {
    const athleteId = req.user.athleteId;
    const report = await getGearUsageReport(athleteId);
    res.json({ msg: 'success', data: report });
  } catch (err) {
    req.logger?.error('Gear usage report error', { user: req.user?.name, error: err });
    res.status(500).json({ error: 'Failed to generate gear usage report' });
  }
});

/**
 * GET /v1/reports/gear-usage/:userId
 * Returns gear usage stats for the specified user
 */
router.get('/gear-usage/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'No user provided.' });
    }
    logger.info(`Generating gear usage report for user: ${userId}`);
    // Look up athleteId by user name
    const user = await activityService.getUserByName(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const report = await getGearUsageReport(user.athleteId);
    res.json({ msg: 'success', data: report });
  } catch (err) {
    logger.error('Gear usage report error', err.message);
    next(err);
  }
});

/**
 * GET /v1/reports/activity-type/:userId
 * Returns activity type breakdown for the specified user
 */
router.get('/activity-type/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'No user provided.' });
    }
    logger.info(`Generating activity type breakdown for user: ${userId}`);
    // Look up athleteId by user name
    const user = await activityService.getUserByName(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const breakdown = await getActivityTypeBreakdown(user.athleteId);
    res.json({ msg: 'success', data: breakdown });
  } catch (err) {
    logger.error('Activity type breakdown error', err.message);
    next(err);
  }
});

/**
 * GET /v1/reports/kom-pr-achievements/:userId
 * Returns KOM/PR achievements over time for the specified user
 */
router.get('/kom-pr-achievements/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'No user provided.' });
    }
    logger.info(`Generating KOM/PR achievements report for user: ${userId}`);
    // Look up athleteId by user name
    const user = await activityService.getUserByName(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const achievements = await getKomPrAchievementsOverTime(user.athleteId);
    res.json({ msg: 'success', data: achievements });
  } catch (err) {
    logger.error('KOM/PR achievements report error', err.message);
    next(err);
  }
});

/**
 * GET /v1/reports/year-over-year/:userId
 * Returns year-over-year progress for the specified user
 */
router.get('/year-over-year/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'No user provided.' });
    }
    logger.info(`Generating year-over-year progress report for user: ${userId}`);
    // Look up athleteId by user name
    const user = await activityService.getUserByName(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const progress = await getYearOverYearProgress(user.athleteId);
    res.json({ msg: 'success', data: progress });
  } catch (err) {
    logger.error('Year-over-year progress report error', err.message);
    next(err);
  }
});

export default router;
