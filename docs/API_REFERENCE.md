# Lifestream API Reference

## Overview
Modern Node.js API for Strava fitness activity tracking and cycling analytics. Integrates with Strava OAuth 2.0 and provides cycling reports.

## Endpoints

### Ingest
- `POST /v1/ingest` — Sync Strava activities

### Reports
- `GET /v1/reports/cycling/yearly/:userId` — Yearly cycling statistics grouped by year
- `GET /v1/reports/cycling/progress/:userId` — Year-over-year comparison (current year vs same period last year)
- `GET /v1/reports/gear-usage/:userId` — Gear usage stats for the specified user
- `GET /v1/reports/activity-type/:userId` — Activity type breakdown for the specified user
- `GET /v1/reports/kom-pr-achievements/:userId` — KOM/PR achievements over time for the specified user
- `GET /v1/reports/year-over-year/:userId` — Year-over-year progress for the specified user
- `GET /reports/gear-usage` — Gear usage stats for the authenticated user (session-based)

#### Example Response
```json
{
  "msg": "success",
  "data": { ... }
}
```

### KOMs
- `/v1/koms` — Segment efforts and KOMs

### Bulk Sync
- `/v1/bulksync` — Bulk sync status and control

### Retransform
- `/v1/retransform` — Data reprocessing

### Limits
- `GET /v1/limits/:userId` — Get current Strava API rate limit status for the specified user

#### Example Response
```json
{
  "msg": "success",
}
```

# API Reference — Implementation-first

  This document is generated from the code in `src/routes/` and is the reference that reflects the actual implemented API surface.

  Canonical rule

  - The implementation in `src/` is the source of truth. Update `src/` first, then update this document.

  Base path

  - All routes below are mounted under `/v1` unless explicitly noted.

  ---


## Misc / Server

- GET /health
  - Purpose: Lightweight health check for the running server.
  - Implemented in: `src/server.js`.
  - Response: `{ status: 'ok', timestamp: '<ISO>', environment: '<NODE_ENV>' }`.

- 404 handling
  - Unmatched routes return 404 with JSON `{ error: 'Route not found', path: '<requested path>' }`.

## Ingestion

- GET /v1/ingest/:userId[?getAll=true]
  - Purpose: Sync user activities from Strava.
  - Query params: `getAll=true` for full historical sync; omitted = smart incremental sync since `user.lastSyncAt` (with 1-week overlap).
  - Route file: `src/routes/ingest.js` (router.get('/:userId', ...))
  - Services used: `src/services/stravaService.js`, `src/services/activityService.js`
  - Response: `{ msg: 'success', added, updated, komsAdded }` on success; uses 400/404 for missing params/user and passes errors to middleware.

- POST /v1/activities
  - Purpose: Upsert a single activity.
  - Body: JSON activity object validated by `activitySchema` in `src/utils/validation.js`.
  - Route file: `src/routes/ingest.js` (router.post('/', ...))
  - Service: `src/services/activityService.js`
  - Response: `{ msg: 'success', data: <upsert-result> }`.

---

## Bulk sync

- POST /v1/bulksync/:userId/start
  - Purpose: Start or resume a user's bulk historical sync.
  - Body: `{ force: boolean }` — when `true`, resets a completed sync to fetch new activities.
  - Route file: `src/routes/bulksync.js` (router.post('/:userId/start', ...))
  - Primary services: `src/services/bulkSyncManager.js`, `src/services/stravaService.js`, `src/services/activityService.js`
  - Response: `{ success: true, message, result, komsAdded, progress }`.

- GET /v1/bulksync/:userId/status
  - Purpose: Return current progress/state for a user's bulk sync.
  - Route file: `src/routes/bulksync.js` (router.get('/:userId/status', ...))
  - Response: `{ success: true, progress }`.

- POST /v1/bulksync/:userId/resume
  - Purpose: Resume a paused bulk sync.
  - Route file: `src/routes/bulksync.js` (router.post('/:userId/resume', ...))
  - Response: `{ success: true, message, result, progress }`.

- DELETE /v1/bulksync/:userId/reset
  - Purpose: Reset bulk sync state for a user (clears `bulkSyncSummaries` and `bulkSyncState` Prisma tables).
  - Route file: `src/routes/bulksync.js` (router.delete('/:userId/reset', ...))
  - Response: `{ success: true, message: 'Bulk sync state reset successfully' }`.

- GET /v1/bulksync/overview
  - Purpose: Overview of bulk sync states across users; returns summary and per-user progress.
  - Route file: `src/routes/bulksync.js` (router.get('/overview', ...))
  - Response: `{ success: true, summary, states: [...] }`.

---

## KOMs

- GET /v1/koms/:userId[?limit=50]
  - Purpose: Return activities for a user that include KOM achievements.
  - Query params: `limit` default 50.
  - Route file: `src/routes/koms.js` (router.get('/:userId', ...))
  - Service: `src/services/activityService.js` (`getKomActivities`).
  - Response: `{ activities: [...], total: <number> }` where `activities[].koms` is parsed from `segmentEfforts` JSON.

- GET /v1/koms/:userId/stats
  - Purpose: Aggregate KOM statistics for a user.
  - Route file: `src/routes/koms.js` (router.get('/:userId/stats', ...))
  - Service: `src/services/activityService.js` (`getKomStats`).
  - Response: `{ user: <userId>, stats: {...} }`.

- GET /v1/koms/:userId/all
  - Purpose: List all KOMs with details for a user.
  - Route file: `src/routes/koms.js` (router.get('/:userId/all', ...))
  - Service: `src/services/activityService.js` (`getAllKomsWithDetails`).
  - Response: `{ koms: [...], total: <number> }`.

---

## Rate limits / Limits

- GET /v1/limits/:userId
  - Purpose: Return Strava API rate limit info for the user's token.
  - Route file: `src/routes/limits.js` (router.get('/:userId', ...))
  - Behavior: Refreshes token if expired; calls Strava `/athlete` to read `x-ratelimit-*` headers; returns `{ msg: 'success', rateLimit, rateUsage }`.

---

## Reports

- GET /v1/reports/cycling/yearly/:userId
  - Purpose: Yearly cycling statistics grouped by year.
  - Route file: `src/routes/reports.js` (router.get('/cycling/yearly/:userId', ...))
  - Service: `src/services/reportService.js` (`generateYearlyReport`).

- GET /v1/reports/cycling/progress/:userId
  - Purpose: Year-over-year progress comparison (uses Pacific Time and day-of-year logic).
  - Route file: `src/routes/reports.js` (router.get('/cycling/progress/:userId', ...))
  - Service: `src/services/reportService.js` (`generateProgressReport`).

- GET /v1/reports/gear-usage/:userId
  - Purpose: Gear usage stats for a specified user.
  - Route file: `src/routes/reports.js` (router.get('/gear-usage/:userId', ...))
  - Service: `src/services/gearReportService.js` (`getGearUsageReport`).

- GET /v1/reports/activity-type/:userId
  - Purpose: Activity type breakdown for a specified user.
  - Route file: `src/routes/reports.js` (router.get('/activity-type/:userId', ...))
  - Service: `src/services/activityTypeReportService.js` (`getActivityTypeBreakdown`).

- GET /v1/reports/kom-pr-achievements/:userId
  - Purpose: KOM/PR achievements over time.
  - Route file: `src/routes/reports.js` (router.get('/kom-pr-achievements/:userId', ...))
  - Service: `src/services/komPrAchievementsService.js` (`getKomPrAchievementsOverTime`).

- GET /v1/reports/year-over-year/:userId
  - Purpose: Year-over-year progress (alternate endpoint).
  - Route file: `src/routes/reports.js` (router.get('/year-over-year/:userId', ...))
  - Service: `src/services/yearOverYearProgressService.js` (`getYearOverYearProgress`).

---

## Re-transformation

- POST /v1/retransform/all
  - Purpose: Re-run transformation logic across all activities using stored raw activity data.
  - Route file: `src/routes/retransform.js` (router.post('/all', ...))
  - Implementation: `src/utils/retransformActivities.js` (`retransformAllActivities`).
  - Response: `{ success: true, message, stats: { total, processed, errors, successRate } }`.

- POST /v1/retransform/user/:athleteId
  - Purpose: Re-run transformation for a specific athlete.
  - Route file: `src/routes/retransform.js` (router.post('/user/:athleteId', ...))
  - Implementation: `src/utils/retransformActivities.js` (`retransformUserActivities`).

- GET /v1/retransform/status
  - Purpose: Return counts and coverage statistics for raw activities.
  - Route file: `src/routes/retransform.js` (router.get('/status', ...))
  - Response: `{ success: true, stats: { totalActivities, totalRawActivities, coverage, usersWithActivities } }`.

---

## Request / response patterns

- Success responses commonly include `{ msg: 'success' }` or `{ success: true }` and data fields. Inspect route handlers for exact shapes.
- Errors: routes use appropriate HTTP status codes (400, 404, 500) and forward exceptions to error middleware.
- Validation: Zod schemas are used where applicable; see `src/utils/validation.js`.

## Units & Time

- Unit conversions and formulas are implemented in `src/utils/calculations.js` and tested in `tests/calculations.test.js`.
- Date/time calculations use Pacific Time where documented in the code and services.

---


Last updated: generated from `src/routes/` on 2025-08-24
