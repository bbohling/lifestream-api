#!/usr/bin/env node

/**
 * CLI script to re-transform activities using raw data and updated calculations
 * Usage:
 *   npm run retransform:all          # Re-transform all activities
 *   npm run retransform:user 12345   # Re-transform activities for specific athlete ID
 */

import { retransformAllActivities, retransformUserActivities } from '../src/utils/retransformActivities.js';
import { logger } from '../src/utils/logger.js';

const command = process.argv[2];
const athleteId = process.argv[3];

async function main() {
  try {
    if (command === 'all') {
      logger.info('Re-transforming all activities...');
      const result = await retransformAllActivities();
      
      console.log('\n=== Re-transformation Results ===');
      console.log(`Total activities: ${result.total}`);
      console.log(`Successfully processed: ${result.processed}`);
      console.log(`Errors: ${result.errors}`);
      console.log(`Success rate: ${((result.processed / result.total) * 100).toFixed(1)}%`);
      
    } else if (command === 'user' && athleteId) {
      logger.info(`Re-transforming activities for athlete ${athleteId}...`);
      const result = await retransformUserActivities(athleteId);
      
      console.log('\n=== Re-transformation Results ===');
      console.log(`Athlete ID: ${result.athleteId}`);
      console.log(`Total activities: ${result.total}`);
      console.log(`Successfully processed: ${result.processed}`);
      console.log(`Errors: ${result.errors}`);
      console.log(`Success rate: ${((result.processed / result.total) * 100).toFixed(1)}%`);
      
    } else {
      console.log('Usage:');
      console.log('  node scripts/retransform-activities.js all              # Re-transform all activities');
      console.log('  node scripts/retransform-activities.js user <athleteId> # Re-transform activities for specific athlete');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/retransform-activities.js all');
      console.log('  node scripts/retransform-activities.js user 12345678');
      process.exit(1);
    }
    
    logger.info('Re-transformation completed successfully!');
    process.exit(0);
    
  } catch (error) {
    logger.error('Re-transformation failed:', error.message);
    process.exit(1);
  }
}

main();
