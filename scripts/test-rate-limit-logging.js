#!/usr/bin/env node

/**
 * Test script to verify rate limit logging functionality
 * This will make a simple API call and check if rate limit data is logged
 */

import { StravaService } from '../src/services/stravaService.js';
import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger.js';

const prisma = new PrismaClient();

async function testRateLimitLogging() {
  try {
    logger.info('🧪 Testing rate limit logging functionality...');

    // Get a user to test with
    const user = await prisma.user.findFirst({
      where: { name: 'brandon' }
    });

    if (!user) {
      logger.error('No user found with name "brandon"');
      process.exit(1);
    }

    logger.info(`Found user: ${user.name} (athleteId: ${user.athleteId})`);

    // Count existing rate limit logs
    const beforeCount = await prisma.rateLimitLog.count();
    logger.info(`Rate limit logs before test: ${beforeCount}`);

    // Create Strava service and make a test API call
    const stravaService = new StravaService();
    
    // Check if token is still valid
    if (stravaService.isTokenExpired(user.expiresAt)) {
      logger.info('Token expired, refreshing...');
      const newTokens = await stravaService.refreshToken(user.refreshToken);
      
      // Update user with new tokens
      await prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresAt: newTokens.expiresAt,
        },
      });
      
      user.accessToken = newTokens.accessToken;
      logger.info('Token refreshed successfully');
    }

    // Make a simple API call (get athlete info - this is lightweight)
    logger.info('Making test API call to /athlete...');
    
    try {
      const athlete = await stravaService.makeRequest('/athlete', user.accessToken);
      logger.info(`✅ API call successful. Athlete: ${athlete.firstname} ${athlete.lastname}`);
    } catch (error) {
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        logger.warn('⚠️  Hit rate limit during test - this is expected behavior');
      } else {
        logger.error('API call failed:', error.message);
      }
    }

    // Check if rate limit log was created
    const afterCount = await prisma.rateLimitLog.count();
    logger.info(`Rate limit logs after test: ${afterCount}`);

    if (afterCount > beforeCount) {
      logger.info('✅ SUCCESS: Rate limit logging is working!');
      
      // Show the latest log
      const latestLog = await prisma.rateLimitLog.findFirst({
        orderBy: { timestamp: 'desc' }
      });
      
      if (latestLog) {
        logger.info('📊 Latest rate limit log:');
        console.log(JSON.stringify({
          endpoint: latestLog.endpoint,
          timestamp: latestLog.timestamp,
          readUsageDaily: latestLog.readUsageDaily,
          readLimitDaily: latestLog.readLimitDaily,
          maxUtilizationPercent: latestLog.maxUtilizationPercent,
          delayAppliedMs: latestLog.delayAppliedMs,
          wasRateLimited: latestLog.wasRateLimited,
        }, null, 2));
      }
    } else {
      logger.warn('⚠️  No new rate limit logs created. This could be due to:');
      logger.warn('   - Daily rate limit already reached');
      logger.warn('   - API call failed before logging');
      logger.warn('   - Rate limit logging is not working correctly');
    }

  } catch (error) {
    logger.error('Test failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRateLimitLogging();
