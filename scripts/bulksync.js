#!/usr/bin/env node

/**
 * CLI script for managing bulk sync operations
 * Usage:
 *   npm run bulksync:start <userId>     # Start bulk sync
 *   npm run bulksync:resume <userId>    # Resume paused bulk sync
 *   npm run bulksync:status <userId>    # Check status
 *   npm run bulksync:reset <userId>     # Reset and start over
 *   npm run bulksync:overview           # Show all bulk sync operations
 */

import bulkSyncManager from '../src/services/bulkSyncManager.js';
import activityService from '../src/services/activityService.js';
import stravaService from '../src/services/stravaService.js';
import { logger } from '../src/utils/logger.js';

const command = process.argv[2];
const userId = process.argv[3];

async function main() {
  try {
    if (command === 'start' && userId) {
      logger.info(`Starting bulk sync for user: ${userId}`);
      
      // Get user and tokens
      const user = await activityService.getUserByName(userId);
      if (!user) {
        console.error(`❌ User ${userId} not found`);
        process.exit(1);
      }

      let accessToken = user.accessToken;
      if (stravaService.isTokenExpired(user.expiresAt)) {
        logger.info('🔄 Refreshing expired access token...');
        const tokenData = await stravaService.refreshToken(user.refreshToken);
        await activityService.updateUserTokens(userId, tokenData);
        accessToken = tokenData.accessToken;
      } else {
        logger.info('✅ Access token is still valid');
      }

      const result = await bulkSyncManager.resumeBulkSync(userId, accessToken);
      const progress = await bulkSyncManager.getBulkSyncProgress(userId);

      console.log('\n=== Bulk Sync Results ===');
      if (result.alreadyComplete) {
        console.log('✅ Bulk sync was already complete!');
      } else if (result.isComplete) {
        console.log('🎉 Bulk sync completed successfully!');
      } else {
        console.log('⏸️  Bulk sync paused (daily limit reached)');
        console.log('📅 Resume tomorrow or later to continue');
      }
      
      printProgress(progress);
      
    } else if (command === 'resume' && userId) {
      logger.info(`Resuming bulk sync for user: ${userId}`);
      
      const user = await activityService.getUserByName(userId);
      if (!user) {
        console.error(`❌ User ${userId} not found`);
        process.exit(1);
      }

      let accessToken = user.accessToken;
      if (stravaService.isTokenExpired(user.expiresAt)) {
        logger.info('🔄 Refreshing expired access token...');
        const tokenData = await stravaService.refreshToken(user.refreshToken);
        await activityService.updateUserTokens(userId, tokenData);
        accessToken = tokenData.accessToken;
      } else {
        logger.info('✅ Access token is still valid');
      }

      const result = await bulkSyncManager.resumeBulkSync(userId, accessToken);
      const progress = await bulkSyncManager.getBulkSyncProgress(userId);

      console.log('\n=== Resume Results ===');
      if (result.alreadyComplete) {
        console.log('✅ Bulk sync was already complete!');
      } else if (result.isComplete) {
        console.log('🎉 Bulk sync completed successfully!');
      } else {
        console.log('⏸️  Bulk sync paused (daily limit reached)');
        console.log('📅 Resume tomorrow or later to continue');
      }
      
      printProgress(progress);
      
    } else if (command === 'status' && userId) {
      const progress = await bulkSyncManager.getBulkSyncProgress(userId);
      
      console.log(`\n=== Bulk Sync Status for ${userId} ===`);
      printProgress(progress);
      
    } else if (command === 'reset' && userId) {
      console.log(`🔄 Resetting bulk sync state for user: ${userId}`);
      
      // Import Prisma here to reset state
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      try {
        await prisma.bulkSyncSummaries.deleteMany({
          where: { userId },
        });

        await prisma.bulkSyncState.deleteMany({
          where: { userId },
        });

        console.log('✅ Bulk sync state reset successfully');
        console.log('💡 You can now start a fresh bulk sync');

      } finally {
        await prisma.$disconnect();
      }
      
    } else if (command === 'overview') {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      try {
        const allStates = await prisma.bulkSyncState.findMany({
          orderBy: { updatedAt: 'desc' },
        });

        console.log('\n=== Bulk Sync Overview ===');
        
        if (allStates.length === 0) {
          console.log('No bulk sync operations found');
        } else {
          console.log(`Total operations: ${allStates.length}\n`);
          
          allStates.forEach((state, index) => {
            const progress = state.totalActivities > 0 
              ? Math.round((state.processedActivities / state.totalActivities) * 100)
              : 0;
              
            console.log(`${index + 1}. User: ${state.userId}`);
            console.log(`   Status: ${getStatusEmoji(state.status)} ${state.status} (${state.phase})`);
            console.log(`   Progress: ${state.processedActivities}/${state.totalActivities} (${progress}%)`);
            console.log(`   Requests used today: ${state.requestsUsedToday}/1000`);
            console.log(`   Last updated: ${state.updatedAt.toISOString()}`);
            console.log('');
          });
        }

      } finally {
        await prisma.$disconnect();
      }
      
    } else {
      console.log('Bulk Sync Management Tool');
      console.log('');
      console.log('Usage:');
      console.log('  node scripts/bulksync.js start <userId>      # Start bulk sync');
      console.log('  node scripts/bulksync.js resume <userId>     # Resume paused bulk sync');
      console.log('  node scripts/bulksync.js status <userId>     # Check status');
      console.log('  node scripts/bulksync.js reset <userId>      # Reset and start over');
      console.log('  node scripts/bulksync.js overview            # Show all operations');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/bulksync.js start brandon');
      console.log('  node scripts/bulksync.js status brandon');
      console.log('  node scripts/bulksync.js overview');
      process.exit(1);
    }
    
    process.exit(0);
    
  } catch (error) {
    logger.error('Bulk sync CLI error:', error.message);
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function printProgress(progress) {
  console.log(`Status: ${getStatusEmoji(progress.status)} ${progress.status} (${progress.phase})`);
  console.log(`Progress: ${progress.progress.processedActivities}/${progress.progress.totalActivities} activities (${progress.progress.percentage}%)`);
  console.log(`Rate Limits: ${progress.rateLimits.requestsUsedToday}/${progress.rateLimits.dailyLimit} requests used today`);
  console.log(`Remaining: ${progress.rateLimits.remainingToday} requests`);
  
  if (progress.timing.startDate) {
    console.log(`Started: ${new Date(progress.timing.startDate).toISOString()}`);
  }
  if (progress.timing.completedAt) {
    console.log(`Completed: ${new Date(progress.timing.completedAt).toISOString()}`);
  }
  if (progress.error) {
    console.log(`❌ Last Error: ${progress.error}`);
  }
}

function getStatusEmoji(status) {
  switch (status) {
    case 'complete': return '✅';
    case 'running': return '🏃';
    case 'paused': return '⏸️';
    case 'pending': return '⏳';
    case 'error': return '❌';
    default: return '❓';
  }
}

main();
