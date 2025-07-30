import express from 'express';
import reportService from '../services/reportService.js';
import { logger } from '../utils/logger.js';

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

export default router;
