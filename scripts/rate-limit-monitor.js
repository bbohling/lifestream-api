#!/usr/bin/env node

/**
 * Rate Limit Monitoring Script
 * Shows current Strava API rate limit usage and recent activity
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger.js';

const prisma = new PrismaClient();

async function showRateLimitStatus() {
  try {
    logger.info('📊 Strava API Rate Limit Status');
    console.log('='.repeat(50));

    // Get the most recent rate limit log
    const latestLog = await prisma.rateLimitLog.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    if (!latestLog) {
      logger.info('No rate limit data available yet.');
      return;
    }

    // Current usage status
    console.log('\n🔥 CURRENT USAGE (from latest API call):');
    console.log(`   Read Requests: ${latestLog.readUsageDaily}/${latestLog.readLimitDaily} daily (${Math.round((latestLog.readUsageDaily / latestLog.readLimitDaily) * 100)}%)`);
    console.log(`   Overall Requests: ${latestLog.overallUsageDaily}/${latestLog.overallLimitDaily} daily (${Math.round((latestLog.overallUsageDaily / latestLog.overallLimitDaily) * 100)}%)`);
    console.log(`   15-min Read: ${latestLog.readUsage15min}/${latestLog.readLimit15min} (${Math.round((latestLog.readUsage15min / latestLog.readLimit15min) * 100)}%)`);
    console.log(`   15-min Overall: ${latestLog.overallUsage15min}/${latestLog.overallLimit15min} (${Math.round((latestLog.overallUsage15min / latestLog.overallLimit15min) * 100)}%)`);
    console.log(`   Max Utilization: ${latestLog.maxUtilizationPercent}%`);
    console.log(`   Last Updated: ${new Date(latestLog.timestamp).toLocaleString()}`);

    // Warning thresholds
    if (latestLog.readUsageDaily >= 2500) {
      console.log('\n🚨 CRITICAL: Approaching daily read limit!');
    } else if (latestLog.readUsageDaily >= 2000) {
      console.log('\n⚠️  WARNING: High daily read usage');
    } else if (latestLog.readUsageDaily >= 1500) {
      console.log('\n📈 INFO: Moderate daily read usage');
    }

    // Recent activity summary
    const recentLogs = await prisma.rateLimitLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        timestamp: true,
        endpoint: true,
        readUsageDaily: true,
        maxUtilizationPercent: true,
        delayAppliedMs: true,
        wasRateLimited: true,
      }
    });

    console.log('\n📋 RECENT API ACTIVITY (last 10 calls):');
    console.log('Time                | Endpoint                    | Daily Usage | Util% | Delay | Limited');
    console.log('-'.repeat(95));
    
    recentLogs.forEach(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      const endpoint = log.endpoint.padEnd(25);
      const usage = `${log.readUsageDaily}`.padEnd(9);
      const util = `${log.maxUtilizationPercent}%`.padEnd(5);
      const delay = log.delayAppliedMs > 0 ? `${log.delayAppliedMs}ms`.padEnd(5) : '0ms'.padEnd(5);
      const limited = log.wasRateLimited ? '❌ YES' : '✅ NO';
      
      console.log(`${time}   | ${endpoint} | ${usage} | ${util} | ${delay} | ${limited}`);
    });

    // Daily usage trends
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const hourlyUsage = await prisma.rateLimitLog.groupBy({
      by: ['timestamp'],
      where: {
        timestamp: {
          gte: todayStart
        }
      },
      _max: {
        readUsageDaily: true
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    if (hourlyUsage.length > 1) {
      const firstUsage = hourlyUsage[0]._max.readUsageDaily || 0;
      const lastUsage = hourlyUsage[hourlyUsage.length - 1]._max.readUsageDaily || 0;
      const requestsToday = lastUsage - firstUsage;
      
      console.log('\n📈 TODAY\'S USAGE:');
      console.log(`   Requests made today: ${requestsToday}`);
      console.log(`   Current total: ${lastUsage}/3000`);
      console.log(`   Remaining: ${3000 - lastUsage}`);
    }

    // Rate limit violations
    const violations = await prisma.rateLimitLog.count({
      where: {
        wasRateLimited: true,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (violations > 0) {
      console.log(`\n⚠️  Rate limit violations in last 24h: ${violations}`);
    }

    console.log('\n' + '='.repeat(50));

  } catch (error) {
    logger.error('Failed to show rate limit status:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle command line arguments
const command = process.argv[2];

if (command === 'watch') {
  // Watch mode - update every 30 seconds
  logger.info('🔍 Watching rate limits (press Ctrl+C to stop)...');
  
  const watchRateLimits = async () => {
    console.clear();
    await showRateLimitStatus();
    setTimeout(watchRateLimits, 30000); // 30 seconds
  };
  
  watchRateLimits();
} else {
  // Single run
  showRateLimitStatus();
}
