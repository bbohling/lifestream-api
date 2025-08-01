# Lifestream API Reference

## Overview
Modern Node.js API for Strava fitness activity tracking and cycling analytics. Integrates with Strava OAuth 2.0 and provides cycling reports.

## Endpoints
- `/ingest` — Sync Strava activities
- `/reports` — Get cycling analytics and progress reports
- `/koms` — Segment efforts and KOMs
- `/bulksync` — Bulk sync status and control
- `/retransform` — Data reprocessing

## Request/Response Patterns
- All endpoints return `{ msg: "success" }` for success, `{ error: "Error message" }` for errors
- Proper HTTP status codes: 400 (bad request), 404 (not found), 500 (server error)
- All inputs validated with Zod

## Units & Time
- Distance: meters (input), miles (output)
- Elevation: meters (input), feet (output)
- Speed: m/s (input), mph (output)
- Temperature: Celsius (input), Fahrenheit (output)
- All times in Pacific Time (UTC-8)

## Error Handling
- All errors logged with context
- User-friendly error messages
- No sensitive data exposed

## Example Response
```json
{
  "msg": "success",
  "data": { ... }
}
```

---
See [Data Model](./DATA_MODEL.md) for database schema details.
