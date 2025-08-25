# Lifestream API Data Model

## Overview
Database uses Prisma ORM (PostgreSQL/SQLite). All Strava IDs are BigInt. Key indexes for performance.

## Main Models
### Activity
- Strava activity data (cycling, etc.)
- Indexed by athleteId, startDate, activityType
- All Strava fields mapped

### RateLimitLog
- Logs Strava API rate limits after every request
- Fields: timestamp, athleteId, limitType, usage, limit

### SegmentEffort
- Individual segment efforts per activity
- Linked to Activity and Segment

## Indexes
- athleteId
- startDate
- activityType

## Data Types
- Strava IDs: BigInt
- Dates: ISO8601 (no 'Z' suffix)

---
See `prisma/schema.prisma` for full schema and relationships.
