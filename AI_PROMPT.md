# AI Prompt: Modernize Lifestream API

## Overview
Create a modern Node.js API that replaces an outdated Sails.js v1.2.3 application. The system integrates with Strava to provide fitness activity tracking and cycling analytics. Preserve all existing functionality while using modern 2025 JavaScript technologies.

## Current System Architecture

### Technology Stack (OUTDATED - TO BE REPLACED)
- **Framework**: Sails.js v1.2.3 (140+ security vulnerabilities)
- **Runtime**: Node.js ^8.11 
- **Database**: MySQL with Sails ORM
- **HTTP Client**: request + request-promise (deprecated)
- **Date/Time**: moment.js 2.23.0 (legacy)
- **Concurrency**: bluebird Promise.map

### Recommended Modern Stack (2025)
- **Framework**: Express.js 5.x or Fastify 5.x
- **Runtime**: Node.js 22.x LTS
- **Database**: PostgreSQL 16+ with Prisma 6.x ORM
- **HTTP Client**: Native Fetch API
- **Date/Time**: date-fns 4.x or Day.js 1.11.x
- **Validation**: Zod 3.x
- **Testing**: Vitest 2.x
- **Build**: Vite 6.x

## Core Functionality Requirements

### 1. API Endpoints (MUST PRESERVE EXACTLY)

#### Data Ingestion
```
GET /v1/ingest/:userId[?getAll=true]
- Syncs user activities from Strava API
- getAll=true: Full historical sync (all activities)
- getAll=false/omitted: Incremental sync (200 most recent)
- Response: { "msg": "success" }
- Error: { "error": "No user provided." }
```

#### Annual Cycling Report
```
GET /v1/reports/cycling/yearly/:userId
- Returns yearly cycling statistics grouped by year
- Filters: activityType IN ('VirtualRide', 'Ride')
- Metrics: totalRides, rideDays, miles, hours, climbing, calories, avgSufferScore
- Response: { "data": [{ "year": 2024, "totalRides": 105, ... }] }
```

#### Progress Comparison Report
```
GET /v1/reports/cycling/progress/:userId
- Year-over-year comparison (current year vs same period last year)
- Pacific Time (UTC-8) calculations
- Response: { "data": { "thisYear": {...}, "lastYear": {...} } }
```

### 2. Strava Integration (CRITICAL)

#### OAuth 2.0 Flow
```javascript
// Token refresh endpoint
POST https://www.strava.com/oauth/token
{
  "client_id": "STRAVA_CLIENT_ID",
  "client_secret": "STRAVA_CLIENT_SECRET", 
  "grant_type": "refresh_token",
  "refresh_token": "user_refresh_token"
}

// Activity data endpoint  
GET https://www.strava.com/api/v3/athlete/activities
Headers: Authorization: Bearer {access_token}
Query: per_page=200, page=1
```

#### Token Management
- Automatic token expiration checking (Unix timestamps)
- Auto-refresh expired tokens before API calls
- Store tokens per user in database
- Handle token refresh failures gracefully

#### Data Synchronization
- **Incremental**: Fetch 200 most recent activities (1 page)
- **Full Sync**: Continue pagination until no more data
- **Concurrency**: Process 5 activities simultaneously
- **Upsert Pattern**: Update existing, create new activities

### 3. Data Models

#### User Model
```javascript
{
  name: String,           // User identifier (e.g., "brandon")
  athleteId: BigInt,      // Strava athlete ID for queries
  accessToken: String,    // OAuth access token
  refreshToken: String,   // OAuth refresh token  
  expiresAt: Number       // Token expiration (Unix timestamp)
}
```

#### Activity Model (25+ fields from Strava)
```javascript
{
  id: BigInt,                    // Strava activity ID (primary key)
  athleteId: BigInt,             // Links to user
  name: String,                  // Activity title
  distance: Float,               // Distance in meters
  movingTime: Number,            // Moving time in seconds
  elapsedTime: Number,           // Total time in seconds
  totalElevationGain: Float,     // Elevation gain in meters
  activityType: String,          // 'Ride', 'VirtualRide', 'Run', etc.
  startDate: DateTime,           // Activity start time
  averageSpeed: Float,           // Average speed in m/s
  maxSpeed: Float,               // Maximum speed in m/s
  averageWatts: Float,           // Average power in watts
  maxWatts: Number,              // Maximum power in watts
  kilojoules: Float,             // Energy expenditure
  averageHeartRate: Float,       // Average HR in BPM
  maxHeartRate: Number,          // Maximum HR in BPM
  sufferScore: Number,           // Strava relative effort (default: 0)
  trainer: Boolean,              // Indoor trainer flag
  commute: Boolean,              // Commute activity flag
  gear: String,                  // Equipment ID
  // ... additional fields for cadence, temperature, elevation, etc.
}
```

### 4. Data Processing & Calculations

#### Unit Conversions (PRESERVE EXACTLY)
```javascript
// Distance: meters to miles
miles = meters / 1609.34

// Elevation: meters to feet  
feet = meters / 0.3048

// Speed: m/s to mph
mph = mps * 25 / 11

// Temperature: Celsius to Fahrenheit
fahrenheit = celsius * 9 / 5 + 32
```

#### Date/Time Handling
- **Timezone**: Pacific Time (UTC-8 offset) 
- **Current vs Previous Year**: Dynamic year boundary calculations
- **Day Calculations**: Day-of-year for daily averages
- **Date Deduplication**: Unique riding days (by date)

#### Report Calculations
```javascript
// Annual Report (SQL aggregation)
SELECT YEAR(startDate) as year,
  COUNT(*) as totalRides,
  COUNT(DISTINCT DATE(startDate)) as rideDays,
  ROUND(SUM(distance)/1609.34, 0) as miles,
  ROUND(SUM(movingTime)/3600) as hours,
  ROUND(SUM(totalElevationGain)/0.3048, 0) as climbing,
  ROUND(SUM(kilojoules), 0) as calories,
  ROUND(AVG(sufferScore)) as avgSufferScore
FROM activities 
WHERE athleteId = ? AND activityType IN ('VirtualRide', 'Ride')
GROUP BY YEAR(startDate)

// Progress Report Metrics
{
  rides: count,
  daysRidden: uniqueDates.length,
  miles: Math.ceil(totalDistance / 1609.34),
  rideAverage: miles / rides,
  dailyAverage: miles / dayOfYear,  
  percentageOfDays: (daysRidden / dayOfYear) * 100,
  climbing: Math.ceil(totalElevation / 0.3048),
  calories: Math.ceil(totalKilojoules),
  movingTimeMinutes: Math.ceil(totalMovingTime / 60),
  averageSufferScore: Math.round(totalSufferScore / rides)
}
```

### 5. Configuration & Environment

#### Required Environment Variables
```bash
NODE_ENV=production|development
PORT=3000
DATABASE_URL=postgresql://user:pass@host:port/db
STRAVA_CLIENT_ID=your_strava_app_id
STRAVA_CLIENT_SECRET=your_strava_app_secret
JWT_SECRET=your_jwt_secret
```

#### User Configuration (per user setup)
```javascript
// Currently stored in config, should move to database
users: {
  'brandon': {
    athleteId: 12345,           // For database filtering
    refreshToken: 'abc123...'   // For OAuth refresh
  }
  // Add more users as needed
}
```

### 6. Error Handling & Security

#### Error Scenarios
- Missing userId parameter → 400 Bad Request
- Token expiration → Auto-refresh workflow
- Strava API failures → Graceful error responses
- Database connection issues → 503 Service Unavailable
- Rate limiting → Respect Strava limits (100/15min, 1000/day)

#### Security Requirements
- JWT authentication for API access
- OAuth 2.0 token management
- Input validation with Zod schemas
- Rate limiting protection
- CORS configuration
- Environment variable security

### 7. Performance Requirements

#### Response Times
- API responses: < 200ms (95th percentile)
- Database queries: < 100ms
- Full sync: < 30 seconds for 1000 activities

#### Database Optimization
- Indexes on athleteId, startDate, activityType
- Connection pooling
- Query optimization for aggregations

### 8. Strava API Data Mapping

#### Activity Field Mapping (Strava → Database)
```javascript
{
  id: activity.id,
  athleteId: activity.athlete.id,
  name: activity.name || '',
  distance: activity.distance,
  movingTime: activity.moving_time,
  elapsedTime: activity.elapsed_time,
  totalElevationGain: activity.total_elevation_gain,
  elevationHigh: activity.elev_high,
  elevationLow: activity.elev_low,
  activityType: activity.type,
  startDate: activity.start_date_local.replace('Z', ''), // Remove Z suffix
  achievementCount: activity.achievement_count,
  prCount: activity.pr_count,
  trainer: activity.trainer,
  commute: activity.commute,
  gear: activity.gear_id || '',
  averageSpeed: activity.average_speed,
  maxSpeed: activity.max_speed,
  averageCadence: activity.average_cadence,
  averageTemperature: activity.average_temp,
  averageWatts: activity.average_watts,
  maxWatts: activity.max_watts,  // Note: original has typo "maxWattts"
  weightedAverageWatts: activity.weighted_average_watts,
  kilojoules: activity.kilojoules,
  deviceWatts: activity.device_watts,
  averageHeartRate: activity.average_heartrate,
  maxHeartRate: activity.max_heartrate,
  sufferScore: activity.suffer_score || 0
}
```

### 9. Implementation Guidelines

#### Project Structure
```
src/
├── controllers/     # Request handlers
├── services/        # Business logic (Strava, Activity, Report)
├── models/          # Database models (Prisma)
├── middleware/      # Auth, validation, error handling
├── routes/          # API route definitions
├── utils/           # Date helpers, conversions, logging
├── config/          # App configuration
└── tests/           # Test files
```

#### Key Services to Implement
- **StravaService**: OAuth, token refresh, activity fetching
- **ActivityService**: Data transformation, upsert operations
- **ReportService**: Calculations, aggregations, formatting
- **AuthService**: JWT tokens, user authentication

#### Testing Requirements
- Unit tests for calculations and transformations
- Integration tests for API endpoints
- Mock Strava API responses
- Database test fixtures
- 90%+ code coverage

### 10. Migration Considerations

#### Data Migration
- Export existing MySQL data
- Transform for PostgreSQL schema
- Preserve all activity data and user tokens
- Validate data integrity

#### Backward Compatibility
- Maintain exact API contract
- Same request/response formats
- No breaking changes for consumers
- Gradual cutover strategy

## Success Criteria

1. **Functional Parity**: All existing endpoints work identically
2. **Performance**: < 200ms response times maintained
3. **Security**: Zero vulnerabilities from dependencies
4. **Reliability**: 99.9% uptime with proper error handling
5. **Maintainability**: Modern codebase with good test coverage

## Example API Responses (PRESERVE EXACTLY)

### Yearly Report Response
```json
{
  "data": [
    {
      "year": 2024,
      "totalRides": 105,
      "rideDays": 91, 
      "miles": 2168,
      "hours": 168,
      "climbing": 161495,
      "calories": 100418,
      "avgSufferScore": 45
    }
  ]
}
```

### Progress Report Response
```json
{
  "data": {
    "thisYear": {
      "rides": 105,
      "daysRidden": 91,
      "miles": 2168,
      "rideAverage": 20.6,
      "dailyAverage": 6.0,
      "percentageOfDays": 25,
      "climbing": 161495,
      "calories": 100418,
      "movingTimeMinutes": 10089,
      "averageSufferScore": 45
    },
    "lastYear": {
      "rides": 83,
      "daysRidden": 76,
      "miles": 2065,
      "rideAverage": 24.9,
      "dailyAverage": 5.7,
      "percentageOfDays": 20,
      "climbing": 148667,
      "calories": 104663,
      "movingTimeMinutes": 9179,
      "averageSufferScore": 52
    }
  }
}
```

---

**Goal**: Build a modern, secure, performant Node.js API that perfectly replicates the existing functionality while using 2025 best practices and eliminating 140+ security vulnerabilities from the current outdated stack.