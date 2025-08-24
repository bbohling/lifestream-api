import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

class KomService {
  /**
   * Return activities that contain KOMs for the given athlete.
   * Groups KOM rows by activityId and returns activity-level metadata with embedded kom efforts.
   */
  async getKomActivities(athleteId, limit = 50) {
    try {
      const aid = BigInt(athleteId);
      const komRows = await prisma.kom.findMany({
        where: { athleteId: aid },
        orderBy: { startDate: 'desc' },
      });
      // If no kom rows exist, return an empty array (do not fallback to legacy activity table)
      if (!komRows || komRows.length === 0) {
        logger.info(`No kom rows found for athlete ${athleteId}`);
        return [];
      }

      // Determine ordered, unique activityIds
      const orderedActivityIds = Array.from(
        new Set(komRows.map((k) => k.activityId.toString()))
      )
        .slice(0, limit)
        .map((id) => BigInt(id));

      // Fetch activity metadata for the selected activityIds
      const activitiesMeta = await prisma.activity.findMany({
        where: { id: { in: orderedActivityIds } },
        select: {
          id: true,
          name: true,
          startDate: true,
          komCount: true,
          bestKomRank: true,
          bestPrRank: true,
        },
      });

      const metaById = new Map(activitiesMeta.map((a) => [a.id.toString(), a]));

      // Group komRows by activityId and build enriched activities
      const activities = [];
      for (const activityId of orderedActivityIds) {
        const aidStr = activityId.toString();
        const meta = metaById.get(aidStr) || {
          id: activityId,
          name: '',
          startDate: null,
          komCount: null,
          bestKomRank: null,
          bestPrRank: null,
        };

        const efforts = komRows
          .filter((k) => k.activityId.toString() === aidStr)
          .map((k) => {
            let segmentName = k.name || null;
            try {
              const seg = k.segment ? JSON.parse(k.segment) : null;
              if (seg && seg.name) segmentName = seg.name;
            } catch (e) {
              // ignore parse errors and fall back to k.name
            }
            return {
              segmentId: k.segmentId?.toString?.() ?? null,
              segmentName,
              rank: k.komRank,
              prRank: k.prRank,
              achievements: JSON.parse(k.achievements || '[]'),
              elapsedTime: k.elapsedTime,
              movingTime: k.movingTime,
              startIndex: k.startIndex,
              endIndex: k.endIndex,
            };
          });

        activities.push({
          id: meta.id.toString(),
          name: meta.name,
          date: meta.startDate,
          komCount: meta.komCount || efforts.length,
          bestKomRank: meta.bestKomRank,
          bestPrRank: meta.bestPrRank,
          koms: efforts,
        });
      }

      return activities;
    } catch (error) {
      logger.error(`Failed to get KOM activities for athlete ${athleteId}:`, error.message);
      throw error;
    }
  }

  /**
   * Aggregate KOM stats for an athlete using the koms table
   */
  async getKomStats(athleteId) {
    try {
      const aid = BigInt(athleteId);

      const totalKoms = await prisma.kom.count({ where: { athleteId: aid, komRank: { not: null } } });

      const activityRows = await prisma.kom.findMany({ where: { athleteId: aid }, select: { activityId: true } });
      const activitiesWithKoms = new Set(activityRows.map((r) => r.activityId.toString())).size;

      const best = await prisma.kom.aggregate({ where: { athleteId: aid, komRank: { not: null } }, _min: { komRank: true } });

      return {
        totalKoms: totalKoms || 0,
        activitiesWithKoms,
        bestKomRank: best._min?.komRank ?? null,
      };
    } catch (error) {
      logger.error(`Failed to get KOM stats for athlete ${athleteId}:`, error.message);
      throw error;
    }
  }

  /**
   * Return all KOMs with details for a user (flattened kom rows)
   */
  async getAllKomsWithDetails(athleteId) {
    try {
      const aid = BigInt(athleteId);
      const komRows = await prisma.kom.findMany({
        where: { athleteId: aid },
        orderBy: { startDate: 'desc' },
      });

      if (!komRows || komRows.length === 0) {
        logger.info(`No kom rows for athlete ${athleteId}`);
        return [];
      }

      // Fetch activity metadata for activities present in komRows
      const activityIds = Array.from(new Set(komRows.map((k) => k.activityId.toString()))).map((id) => BigInt(id));
      const activitiesMeta = await prisma.activity.findMany({ where: { id: { in: activityIds } }, select: { id: true, name: true, startDate: true } });
      const metaById = new Map(activitiesMeta.map((a) => [a.id.toString(), a]));

      const koms = komRows.map((k) => {
        let segment = null;
        try {
          segment = k.segment ? JSON.parse(k.segment) : null;
        } catch (e) {
          segment = null;
        }
        const activityMeta = metaById.get(k.activityId.toString()) || {};
        return {
          id: k.id.toString(),
          athleteId: k.athleteId?.toString?.() ?? null,
          activityId: k.activityId.toString(),
          activityName: activityMeta.name || null,
          activityDate: activityMeta.startDate || null,
          segmentId: k.segmentId,
          segmentName: segment?.name || k.name || null,
          komRank: k.komRank,
          prRank: k.prRank,
          elapsedTime: k.elapsedTime,
          movingTime: k.movingTime,
          achievements: JSON.parse(k.achievements || '[]'),
          segment: segment,
          distance: k.distance,
          startIndex: k.startIndex,
          endIndex: k.endIndex,
        };
      });

      return koms;
    } catch (error) {
      logger.error(`Failed to get all KOMs for athlete ${athleteId}:`, error.message);
      throw error;
    }
  }
}

export default new KomService();
