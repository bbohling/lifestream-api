# Lifestream API — High level

This repository implements a Strava activity ingestion and cycling analytics API.

Primary rules

- The implementation in `src/` is the canonical source of truth for behavior and API surface.
- `README.md` (this file) is the high-level entry point for developers and users.
- Detailed, per-endpoint documentation lives in `docs/` (see `docs/API_REFERENCE.md`).

Quick links

- Code (source of truth): `src/`
- API reference (detailed): `docs/API_REFERENCE.md`
- Design / requirements: `PRD.md`
- Tests: `tests/` (Vitest)
- Database schema: `prisma/schema.prisma`

Status

- Codebase: v1.0 (implementation-focused)
- Docs: Implementation-first refactor in progress — use `src/` when unsure.

Base URL

- Default local base: `http://localhost:3000`

Supported endpoints (summary)

All implemented endpoints are rooted under `/v1` unless noted.

- GET  /v1/ingest/:userId[?getAll=true]        — Sync activities from Strava for a user
- POST /v1/activities                         — Upsert a single activity (JSON body)

- POST /v1/bulksync/:userId/start             — Start or resume a bulk sync
- GET  /v1/bulksync/:userId/status            — Get bulk sync progress
- POST /v1/bulksync/:userId/resume            — Resume a paused bulk sync
- DELETE /v1/bulksync/:userId/reset           — Reset bulk sync state for a user
- GET  /v1/bulksync/overview                  — Overview of all bulk sync operations

- GET  /v1/koms/:userId[?limit=50]            — List KOM activities for a user
- GET  /v1/koms/:userId/stats                 — KOM aggregate stats for a user
- GET  /v1/koms/:userId/all                   — All KOMs with details for a user

- GET  /v1/limits/:userId                     — Check Strava rate limit status for a user

- GET  /v1/reports/cycling/yearly/:userId     — Yearly cycling statistics
- GET  /v1/reports/cycling/progress/:userId   — Year-over-year progress comparison
- GET  /v1/reports/gear-usage/:userId         — Gear usage report for a user
- GET  /v1/reports/activity-type/:userId      — Activity type breakdown for a user
- GET  /v1/reports/kom-pr-achievements/:userId— KOM/PR achievements over time
- GET  /v1/reports/year-over-year/:userId     — Year-over-year progress (alternate)

- POST /v1/retransform/all                    — Re-transform all activities using raw data
- POST /v1/retransform/user/:athleteId        — Re-transform activities for a specific athlete
- GET  /v1/retransform/status                 — Re-transformation availability/status

Notes

- For exact parameter names, request/response shapes, and implementation notes, see `docs/API_REFERENCE.md` which maps each endpoint to its `src/routes/` file and service implementation.
- When updating an endpoint, update the `src/` implementation first, then update the matching entry in `docs/`.

How you can help

- If you want an OpenAPI / Swagger spec generated from `src/`, tell me and I will produce one (or convert `docs/API_REFERENCE.md`).
- If you want the docs published (e.g., GitHub Pages), I can add a small script to build a docs site.

Contributing

- Follow existing code style (ES modules, Zod validation, async/await).
- Update `docs/API_REFERENCE.md` when changing controllers or routes.

---

## todo

- [ ] general cleanup after AI spewings
- [ ] replace `/v1/reports/cycling/yearly` endpoint with the code from`/v1/reports/year-over-year`
- [ ] _more to come_