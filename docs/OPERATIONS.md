# Lifestream API Operations Guide

## Setup
- See [STRAVA_SETUP.md](./STRAVA_SETUP.md) for Strava OAuth and API keys
- Run migrations: `npx prisma migrate dev`
- Start dev server: `npm run dev`

## Strava Integration
- Tokens auto-refreshed on expiration
- Rate limits: 100 requests/15min, 1000/day
- All rate limit events logged to DB
- Max 5 concurrent Strava API calls

## Monitoring
- Use `scripts/rate-limit-monitor.js` for rate limit status
- Use `scripts/bulk-sync-dashboard.js` for bulk sync status

## Bulk Sync
- Upsert loop for all activities (no duplicates)
- Status and control via `/bulksync` endpoint

## Reporting
- Progress and yearly reports use already-converted units
- All calculations use Pacific Time

---
See [API Reference](./API_REFERENCE.md) for endpoint details.
