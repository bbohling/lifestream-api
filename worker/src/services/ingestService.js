import { logger } from '../utils/logger.js';

const STALENESS_MINUTES = 30;
const MIN_INTERVAL_MINUTES = 15;

/**
 * Per-isolate in-flight sync guards. On Workers these maps are best-effort:
 * concurrent isolates each have their own copy, so they dedupe syncs within
 * an isolate only. The durable staleness signal is User.lastSyncAt in D1 —
 * a completed sync makes every isolate see fresh data, and the worst case of
 * a lost race is one redundant Strava sync.
 */
const inFlightSyncPromise = new Map();
const lastSyncStartTime = new Map();

/**
 * Ingest Service (Workers port)
 * Same sync/staleness semantics as the Express version, with dependencies
 * injected per request and background work scheduled via ctx.waitUntil.
 */
export class IngestService {
  constructor(stravaService, activityService) {
    this.stravaService = stravaService;
    this.activityService = activityService;
  }

  /**
   * Perform full Strava sync for a user.
   * @param {string} userId - User identifier (e.g. "brandon")
   * @param {{ getAll?: boolean }} options - getAll: true for full historical sync
   * @returns {Promise<{ added: number, updated: number, komsAdded: number }>}
   */
  async syncUser(userId, options = {}) {
    const { getAll = false } = options;

    const user = await this.activityService.getUserByName(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    let accessToken = user.accessToken;

    if (this.stravaService.isTokenExpired(user.expiresAt)) {
      logger.info('Access token expired, refreshing...');
      const tokenData = await this.stravaService.refreshToken(user.refreshToken);
      await this.activityService.updateUserTokens(userId, tokenData);
      accessToken = tokenData.accessToken;
    }

    let activities;
    if (getAll) {
      logger.info('Performing full historical sync (all activities)');
      activities = await this.stravaService.fetchAllActivities(accessToken);
    } else {
      const stats = await this.activityService.getUserActivityStats(user.athleteId);
      logger.info(
        `User has ${stats.totalActivities} existing activities, latest: ${stats.latestActivityDate}`
      );
      logger.info('Performing smart incremental sync (since last sync with 1-week overlap)');
      activities = await this.stravaService.fetchIncrementalActivities(accessToken, user.lastSyncAt);
    }

    logger.info(`Fetched ${activities.length} activities from Strava`);

    const transformedActivities = activities.map((activity) =>
      this.stravaService.transformActivity(activity)
    );

    const { added, updated } =
      await this.activityService.upsertActivitiesWithCounts(transformedActivities);

    const koms = await this.stravaService.fetchKoms(user.athleteId, accessToken);
    const komResult = await this.stravaService.upsertKoms(koms, user.athleteId);

    await this.activityService.updateLastSyncAt(userId);

    logger.info(
      `Successfully processed ${transformedActivities.length} activities for user ${userId} (added: ${added}, updated: ${updated}), KOMs added: ${komResult.added}`
    );

    return { added, updated, komsAdded: komResult.added };
  }

  /**
   * Ensure data is fresh before proceeding. When stale, awaits sync; when fresh, resolves immediately.
   * Parallel requests for the same user (in this isolate) await the same in-progress sync.
   * @param {string} userId - User identifier
   * @returns {Promise<void>}
   */
  async ensureFresh(userId) {
    if (!userId) return;

    const user = await this.activityService.getUserByName(userId);
    if (!user) return;

    const now = new Date();
    const lastSync = user.lastSyncAt ? new Date(user.lastSyncAt) : null;
    const stalenessMs = STALENESS_MINUTES * 60 * 1000;
    const minIntervalMs = MIN_INTERVAL_MINUTES * 60 * 1000;

    const isStale = !lastSync || now - lastSync > stalenessMs;
    const lastStart = lastSyncStartTime.get(userId);
    const withinMinInterval = lastStart && now - lastStart < minIntervalMs;

    if (!isStale || withinMinInterval) {
      return;
    }

    logger.info(
      `Ensure-fresh: syncing stale data for user ${userId} (lastSyncAt: ${lastSync?.toISOString() ?? 'never'})`
    );

    // If a sync is already in progress, wait for it
    const existingPromise = inFlightSyncPromise.get(userId);
    if (existingPromise) {
      await existingPromise;
      return;
    }

    const syncPromise = (async () => {
      lastSyncStartTime.set(userId, new Date());
      try {
        await this.syncUser(userId);
      } finally {
        inFlightSyncPromise.delete(userId);
      }
    })();

    inFlightSyncPromise.set(userId, syncPromise);
    await syncPromise;
  }

  /**
   * Run sync in the background if data is stale. Fire-and-forget; does not
   * block the response. On Workers the background promise must be handed to
   * ctx.waitUntil or the runtime cancels it when the response is returned.
   * @param {string} userId - User identifier
   * @param {(p: Promise<unknown>) => void} waitUntil - ctx.waitUntil, bound
   */
  syncIfStale(userId, waitUntil) {
    if (!userId) return;
    waitUntil(
      this.ensureFresh(userId).catch((err) =>
        logger.error(`Background sync failed for ${userId}:`, err.message)
      )
    );
  }

  /**
   * Check if data is fresh. When stale, triggers background sync and returns syncing.
   * Non-blocking; use for GET /v1/ensure-fresh/:userId so UI can poll.
   * @param {string} userId - User identifier
   * @param {(p: Promise<unknown>) => void} waitUntil - ctx.waitUntil, bound
   * @returns {Promise<{ fresh: boolean, syncing?: boolean }>}
   */
  async checkFreshStatus(userId, waitUntil) {
    if (!userId) return { fresh: true };

    const user = await this.activityService.getUserByName(userId);
    if (!user) return { fresh: true };

    const now = new Date();
    const lastSync = user.lastSyncAt ? new Date(user.lastSyncAt) : null;
    const stalenessMs = STALENESS_MINUTES * 60 * 1000;
    const minIntervalMs = MIN_INTERVAL_MINUTES * 60 * 1000;

    const isStale = !lastSync || now - lastSync > stalenessMs;
    const lastStart = lastSyncStartTime.get(userId);
    const withinMinInterval = lastStart && now - lastStart < minIntervalMs;

    if (!isStale || withinMinInterval) {
      return { fresh: true };
    }

    // Data is stale - trigger background sync and tell client to poll
    this.syncIfStale(userId, waitUntil);
    return { fresh: false, syncing: true };
  }
}

export default IngestService;
