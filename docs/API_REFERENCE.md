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
  "rateLimit": "100,1000",
  "rateUsage": "10,100"
}
```

## Request/Response Patterns
- All endpoints return `{ msg: "success" }` for success, `{ error: "Error message" }` for errors
- Proper HTTP status codes: 400 (bad request), 404 (not found), 500 (server error)
- All inputs validated with Zod

## Units & Time
- Distance: miles (output)
- Elevation: feet (output)
- Speed: mph (output)
- Temperature: Fahrenheit (output)
- All times in Pacific Time (UTC-8)

## Error Handling
- All errors logged with context
- User-friendly error messages
- No sensitive data exposed

---
See [Data Model](./DATA_MODEL.md) for database schema details.
