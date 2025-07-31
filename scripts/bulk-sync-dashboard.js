#!/usr/bin/env node

/**
 * Bulk Sync Rate Limit Dashboard
 * Real-time monitoring of rate limits during bulk sync operations
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger.js';

const prisma = new PrismaClient();

async function showBulkSyncDashboard() {
  try {
    // Clear screen for dashboard effect
    console.clear();
    
    console.log('🚀 BULK SYNC RATE LIMIT DASHBOARD');
    console.log('=' * 60);
    console.log(`Last Updated: ${new Date().toLocaleString()}`);
    console.log();

    // Get bulk sync status
    const bulkSyncState = await prisma.bulkSyncState.findFirst({
      where: { userId: 'brandon' }
    });

    if (bulkSyncState) {
      console.log('📊 BULK SYNC STATUS:');
      console.log(`   Status: ${bulkSyncState.status}`);
      console.log(`   Phase: ${bulkSyncState.phase}`);
      console.log(`   Progress: ${bulkSyncState.processedActivities}/${bulkSyncState.totalActivities} activities (${Math.round((bulkSyncState.processedActivities / bulkSyncState.totalActivities) * 100)}%)`);
      console.log(`   Summaries: ${bulkSyncState.processedSummaries} processed`);
      console.log(`   Requests Used Today: ${bulkSyncState.requestsUsedToday}/1000`);
      console.log(`   Started: ${new Date(bulkSyncState.startDate).toLocaleString()}`);
      console.log();
    }

    // Get latest rate limit data
    const latestLog = await prisma.rateLimitLog.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    if (latestLog) {
      console.log('🔥 CURRENT RATE LIMITS:');
      
      // Calculate percentages
      const readDailyPct = Math.round((latestLog.readUsageDaily / latestLog.readLimitDaily) * 100);
      const read15minPct = Math.round((latestLog.readUsage15min / latestLog.readLimit15min) * 100);
      const overallDailyPct = Math.round((latestLog.overallUsageDaily / latestLog.overallLimitDaily) * 100);
      
      // Color coding based on usage
      const getDailyStatus = (pct) => {
        if (pct >= 90) return '🚨 CRITICAL';
        if (pct >= 80) return '⚠️  HIGH';
        if (pct >= 60) return '📈 MODERATE';
        return '✅ GOOD';
      };
      
      console.log(`   Daily Read: ${latestLog.readUsageDaily}/${latestLog.readLimitDaily} (${readDailyPct}%) ${getDailyStatus(readDailyPct)}`);
      console.log(`   15-min Read: ${latestLog.readUsage15min}/${latestLog.readLimit15min} (${read15minPct}%)`);
      console.log(`   Daily Overall: ${latestLog.overallUsageDaily}/${latestLog.overallLimitDaily} (${overallDailyPct}%)`);
      console.log(`   Remaining Today: ${latestLog.readLimitDaily - latestLog.readUsageDaily} read requests`);
      console.log();

      // Show trend over last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentLogs = await prisma.rateLimitLog.findMany({
        where: {
          timestamp: {
            gte: oneHourAgo
          }
        },
        orderBy: { timestamp: 'asc' },
        select: {
          timestamp: true,
          readUsageDaily: true,
          endpoint: true,
          delayAppliedMs: true,
          wasRateLimited: true,
        }
      });

      if (recentLogs.length > 1) {
        const firstLog = recentLogs[0];
        const lastLog = recentLogs[recentLogs.length - 1];
        const requestsInLastHour = lastLog.readUsageDaily - firstLog.readUsageDaily;
        const timeSpan = (new Date(lastLog.timestamp) - new Date(firstLog.timestamp)) / 1000 / 60; // minutes
        const requestsPerMinute = timeSpan > 0 ? (requestsInLastHour / timeSpan).toFixed(2) : 0;
        
        console.log('📈 RECENT ACTIVITY:');
        console.log(`   Requests in last ${Math.round(timeSpan)} minutes: ${requestsInLastHour}`);
        console.log(`   Average rate: ${requestsPerMinute} requests/minute`);
        
        // Check for rate limiting events
        const rateLimitedCalls = recentLogs.filter(log => log.wasRateLimited).length;
        const delayedCalls = recentLogs.filter(log => log.delayAppliedMs > 0).length;
        
        if (rateLimitedCalls > 0) {
          console.log(`   🚨 Rate limited calls: ${rateLimitedCalls}`);
        }
        if (delayedCalls > 0) {
          console.log(`   ⏱️  Delayed calls: ${delayedCalls}`);
        }
        console.log();
      }

      // Show endpoint breakdown
      const endpointStats = await prisma.rateLimitLog.groupBy({
        by: ['endpoint'],
        where: {
          timestamp: {
            gte: oneHourAgo
          }
        },
        _count: {
          endpoint: true
        },
        orderBy: {
          _count: {
            endpoint: 'desc'
          }
        }
      });

      if (endpointStats.length > 0) {
        console.log('🎯 ENDPOINT USAGE (last hour):');
        endpointStats.forEach(stat => {
          console.log(`   ${stat.endpoint}: ${stat._count.endpoint} calls`);
        });
        console.log();
      }

      // Show upcoming limits
      const hoursUntilReset = Math.ceil((24 - new Date().getUTCHours()) % 24);
      const estimatedResetTime = new Date();
      estimatedResetTime.setUTCHours(24, 0, 0, 0);
      
      console.log('⏰ RESET INFO:');
      console.log(`   Daily limits reset in ~${hoursUntilReset} hours (${estimatedResetTime.toLocaleTimeString()} local)`);        // Estimate if we'll hit limits today
        if (recentLogs.length > 1 && parseFloat(requestsPerMinute) > 0) {
          const remaining = latestLog.readLimitDaily - latestLog.readUsageDaily;
          const minutesUntilReset = hoursUntilReset * 60;
          const projectedUsage = parseFloat(requestsPerMinute) * minutesUntilReset;
        
        if (projectedUsage > remaining) {
          console.log(`   🚨 WARNING: At current rate (${requestsPerMinute}/min), may hit daily limit before reset`);
        } else {
          console.log(`   ✅ At current rate, should stay within daily limits`);
        }
      }
    } else {
      console.log('No rate limit data available yet.');
    }

    console.log();
    console.log('=' * 60);
    console.log('Press Ctrl+C to stop monitoring');

  } catch (error) {
    console.error('Dashboard error:', error.message);
  }
}

// Dashboard mode - updates every 10 seconds
async function runDashboard() {
  while (true) {
    await showBulkSyncDashboard();
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n👋 Stopping dashboard...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run dashboard
runDashboard().catch(async (error) => {
  console.error('Dashboard failed:', error);
  await prisma.$disconnect();
  process.exit(1);
});
