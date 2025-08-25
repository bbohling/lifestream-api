import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { conversions } from '../utils/calculations.js';

const prisma = new PrismaClient();

/**
 * Segment Service
 * Handles upsert and retrieval of Strava segment data, including KOM info.
 * All inputs should be validated with Zod schemas before calling these methods.
 */
export class SegmentService {
  /**
   * Upsert segment (update if exists, create if not)
   * @param {Object} segmentData - Transformed segment data from Strava API
   * @returns {Promise<Object>} The upserted segment record
   */
  async upsertSegment(segmentData) {
    try {
      const segment = await prisma.segment.upsert({
        where: { id: segmentData.id },
        update: segmentData,
        create: segmentData,
      });
      return segment;
    } catch (error) {
      logger.error(`Failed to upsert segment ${segmentData.id}:`, error.message);
      throw new Error('Could not upsert segment');
    }
  }

  /**
   * Get segment by ID
   * @param {bigint} id - Strava segment ID
   * @returns {Promise<Object|null>} Segment record or null
   */
  async getSegmentById(id) {
    return prisma.segment.findUnique({ where: { id } });
  }
}

export default new SegmentService();
