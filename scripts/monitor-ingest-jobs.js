#!/usr/bin/env node

/**
 * Monitor ingestion logs
 * Check recent ingestion results and alert on failures
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger.js';

const prisma = new PrismaClient();

async function checkRecentIngests() {
    try {
        // Get logs from last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const recentLogs = await prisma.ingestLog.findMany({
            where: {
                timestamp: {
                    gte: oneDayAgo,
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
        });

        console.log(`\n📊 INGESTION LOG SUMMARY (Last 24 hours)`);
        console.log('='.repeat(50));

        const successful = recentLogs.filter(log => log.success);
        const failed = recentLogs.filter(log => !log.success);

        console.log(`Total runs: ${recentLogs.length}`);
        console.log(`Successful: ${successful.length}`);
        console.log(`Failed: ${failed.length}`);

        if (successful.length > 0) {
            const totalAdded = successful.reduce((sum, log) => sum + (log.added || 0), 0);
            const totalUpdated = successful.reduce((sum, log) => sum + (log.updated || 0), 0);
            const totalKoms = successful.reduce((sum, log) => sum + (log.komsAdded || 0), 0);
            const avgDuration = successful.reduce((sum, log) => sum + (log.duration || 0), 0) / successful.length;

            console.log(`\n✅ SUCCESS STATS:`);
            console.log(`   Activities added: ${totalAdded}`);
            console.log(`   Activities updated: ${totalUpdated}`);
            console.log(`   KOMs added: ${totalKoms}`);
            console.log(`   Avg duration: ${Math.round(avgDuration)}ms`);
        }

        if (failed.length > 0) {
            console.log(`\n❌ RECENT FAILURES:`);
            failed.slice(0, 5).forEach(log => {
                console.log(`   ${log.timestamp.toISOString()}: ${log.error}`);
            });
        }

        // Show latest run
        if (recentLogs.length > 0) {
            const latest = recentLogs[0];
            console.log(`\n🕐 LATEST RUN:`);
            console.log(`   Time: ${latest.timestamp.toISOString()}`);
            console.log(`   Status: ${latest.success ? '✅ Success' : '❌ Failed'}`);
            if (latest.success) {
                console.log(`   Result: +${latest.added} added, ${latest.updated} updated, ${latest.komsAdded} KOMs`);
            } else {
                console.log(`   Error: ${latest.error}`);
            }
        }

    } catch (error) {
        logger.error('Error checking ingest logs:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecentIngests();