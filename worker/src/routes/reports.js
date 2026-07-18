import { Hono } from 'hono';
import { logger } from '../utils/logger.js';
import { getGearUsageReport } from '../services/gearReportService.js';
import { getActivityTypeBreakdown } from '../services/activityTypeReportService.js';
import { getKomPrAchievementsOverTime } from '../services/komPrAchievementsService.js';
import { getYearOverYearProgress } from '../services/yearOverYearProgressService.js';
import { ensureFreshMiddleware } from '../middleware/ensureFresh.js';

const reports = new Hono();

/**
 * GET /v1/reports/cycling/yearly/:userId
 * Returns yearly cycling statistics grouped by year
 */
reports.get('/cycling/yearly/:userId', ensureFreshMiddleware, async (c) => {
  const userId = c.req.param('userId');

  if (!userId) {
    return c.json({ error: 'No user provided.' }, 400);
  }

  logger.info(`Generating yearly cycling report for user: ${userId}`);

  const { reportService } = c.get('services');
  const report = await reportService.generateYearlyReport(userId);

  return c.json(report);
});

/**
 * GET /v1/reports/cycling/progress/:userId
 * Year-over-year comparison (current year vs same period last year)
 */
reports.get('/cycling/progress/:userId', ensureFreshMiddleware, async (c) => {
  const userId = c.req.param('userId');

  if (!userId) {
    return c.json({ error: 'No user provided.' }, 400);
  }

  logger.info(`Generating progress report for user: ${userId}`);

  const { reportService } = c.get('services');
  const report = await reportService.generateProgressReport(userId);

  return c.json(report);
});

/**
 * GET /v1/reports/gear-usage/:userId
 * Returns gear usage stats for the specified user
 */
reports.get('/gear-usage/:userId', ensureFreshMiddleware, async (c) => {
  const userId = c.req.param('userId');
  if (!userId) {
    return c.json({ error: 'No user provided.' }, 400);
  }
  logger.info(`Generating gear usage report for user: ${userId}`);
  const { prisma, activityService } = c.get('services');
  // Look up athleteId by user name
  const user = await activityService.getUserByName(userId);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  const report = await getGearUsageReport(prisma, user.athleteId);
  return c.json({ msg: 'success', data: report });
});

/**
 * GET /v1/reports/activity-type/:userId
 * Returns activity type breakdown for the specified user
 */
reports.get('/activity-type/:userId', ensureFreshMiddleware, async (c) => {
  const userId = c.req.param('userId');
  if (!userId) {
    return c.json({ error: 'No user provided.' }, 400);
  }
  logger.info(`Generating activity type breakdown for user: ${userId}`);
  const { prisma, activityService } = c.get('services');
  const user = await activityService.getUserByName(userId);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  const breakdown = await getActivityTypeBreakdown(prisma, user.athleteId);
  return c.json({ msg: 'success', data: breakdown });
});

/**
 * GET /v1/reports/kom-pr-achievements/:userId
 * Returns KOM/PR achievements over time for the specified user
 */
reports.get('/kom-pr-achievements/:userId', ensureFreshMiddleware, async (c) => {
  const userId = c.req.param('userId');
  if (!userId) {
    return c.json({ error: 'No user provided.' }, 400);
  }
  logger.info(`Generating KOM/PR achievements report for user: ${userId}`);
  const { prisma, activityService } = c.get('services');
  const user = await activityService.getUserByName(userId);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  const achievements = await getKomPrAchievementsOverTime(prisma, user.athleteId);
  return c.json({ msg: 'success', data: achievements });
});

/**
 * GET /v1/reports/year-over-year/:userId
 * Returns year-over-year progress for the specified user
 */
reports.get('/year-over-year/:userId', ensureFreshMiddleware, async (c) => {
  const userId = c.req.param('userId');
  if (!userId) {
    return c.json({ error: 'No user provided.' }, 400);
  }
  logger.info(`Generating year-over-year progress report for user: ${userId}`);
  const { prisma, activityService } = c.get('services');
  const user = await activityService.getUserByName(userId);
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  const progress = await getYearOverYearProgress(prisma, user.athleteId);
  return c.json({ msg: 'success', data: progress });
});

export default reports;
