#!/usr/bin/env node

/**
 * Setup verification script to check Strava API credentials
 */

import { logger } from '../src/utils/logger.js';

async function verifySetup() {
  console.log('🔍 Verifying Strava API Setup...\n');

  let allGood = true;

  // Check environment variables
  console.log('📋 Checking Environment Variables:');
  
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId) {
    console.log('❌ STRAVA_CLIENT_ID is not set');
    allGood = false;
  } else if (clientId === 'your_strava_client_id') {
    console.log('❌ STRAVA_CLIENT_ID is still the placeholder value');
    console.log('   Please update with your actual Client ID from https://www.strava.com/settings/api');
    allGood = false;
  } else if (!/^\d+$/.test(clientId)) {
    console.log('❌ STRAVA_CLIENT_ID should be numeric (e.g., 12345)');
    console.log('   Current value appears to be invalid:', clientId);
    allGood = false;
  } else {
    console.log('✅ STRAVA_CLIENT_ID is configured');
  }

  if (!clientSecret) {
    console.log('❌ STRAVA_CLIENT_SECRET is not set');
    allGood = false;
  } else if (clientSecret === 'your_strava_client_secret') {
    console.log('❌ STRAVA_CLIENT_SECRET is still the placeholder value');
    console.log('   Please update with your actual Client Secret from https://www.strava.com/settings/api');
    allGood = false;
  } else if (clientSecret.length < 20) {
    console.log('❌ STRAVA_CLIENT_SECRET appears to be too short');
    console.log('   Strava client secrets are typically 40+ characters long');
    allGood = false;
  } else {
    console.log('✅ STRAVA_CLIENT_SECRET is configured');
  }

  console.log('');

  // Check database connectivity
  console.log('🗄️  Checking Database Connectivity:');
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.user.count();
    console.log('✅ Database connection successful');
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    allGood = false;
  }

  console.log('');

  // Check for users in database
  console.log('👥 Checking User Setup:');
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('⚠️  No users found in database');
      console.log('   You\'ll need to set up user authentication and store Strava tokens');
      console.log('   See docs/STRAVA_SETUP.md for the authorization flow');
    } else {
      console.log(`✅ Found ${userCount} user(s) in database`);
      
      // Check if users have valid tokens
      const usersWithTokens = await prisma.user.findMany({
        where: {
          AND: [
            { accessToken: { not: "" } },
            { refreshToken: { not: "" } },
            { expiresAt: { not: 0 } }
          ]
        }
      });
      
      console.log(`   ${usersWithTokens.length} user(s) have authentication tokens`);
      
      if (usersWithTokens.length > 0) {
        // Check token expiration
        const now = Math.floor(Date.now() / 1000);
        const expiredTokens = usersWithTokens.filter(u => u.expiresAt <= now);
        
        if (expiredTokens.length > 0) {
          console.log(`   ⚠️  ${expiredTokens.length} user(s) have expired tokens (will auto-refresh)`);
        }
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Error checking users:', error.message);
    allGood = false;
  }

  console.log('');

  // Test Strava service initialization
  console.log('🔧 Testing Strava Service:');
  try {
    const stravaService = await import('../src/services/stravaService.js');
    console.log('✅ Strava service initialized successfully');
  } catch (error) {
    console.log('❌ Strava service initialization failed:', error.message);
    allGood = false;
  }

  console.log('');

  // Final result
  if (allGood) {
    console.log('🎉 Setup verification completed successfully!');
    console.log('');
    console.log('You can now run:');
    console.log('  npm run bulksync:start <username>');
    console.log('  npm run dev (to start the server)');
    console.log('');
  } else {
    console.log('❌ Setup verification found issues that need to be resolved.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Review the errors above');
    console.log('2. Check docs/STRAVA_SETUP.md for detailed setup instructions');
    console.log('3. Update your .env file with correct Strava API credentials');
    console.log('4. Set up user authentication and store tokens in the database');
    console.log('');
    process.exit(1);
  }
}

verifySetup().catch(error => {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
});
