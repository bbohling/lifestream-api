# Modern Lifestream API

A modern Node.js API for Strava fitness activity tracking and cycling analytics, built with Express.js, Prisma, and SQLite. This replaces an outdated Sails.js v1.2.3 application while preserving all existing functionality.

## 🚀 Features

- **Strava Integration**: OAuth 2.0 authentication and automatic token refresh
- **Rate Limiting**: Intelligent rate limiting with progressive delays and automatic retry handling
- **Data Ingestion**: Sync activities from Strava (incremental or full sync) with detailed segment efforts
- **KOM/PR Tracking**: Captures King of the Mountain rankings, Personal Records, and segment achievements
- **Cycling Analytics**: Yearly reports and year-over-year progress comparisons
- **Modern Stack**: Express.js 5.x, Prisma 6.x, SQLite, Zod validation
- **High Performance**: Response times < 200ms, optimized database queries
- **Security**: Helmet, CORS, rate limiting, JWT authentication
- **Testing**: Comprehensive test suite with Vitest (26/26 tests passing)

## 📋 Prerequisites

- Node.js 22.x LTS or higher
- Strava application credentials (Client ID and Secret)

## 🛠️ Installation

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Environment setup:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup:**

   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run database migrations
   npm run prisma:migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Environment
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="file:./production.db"

# Strava OAuth
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-here

# CORS (optional)
CORS_ORIGIN=http://localhost:3000
```

### User Setup

Before using the API, you need to create users in the database with their Strava credentials:

```sql
INSERT INTO users (name, athlete_id, access_token, refresh_token, expires_at)
VALUES ('brandon', 12345, 'access_token_here', 'refresh_token_here', 1735689600);
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000
```

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-07-29T10:30:00.000Z",
  "environment": "development"
}
```

### Data Ingestion

#### Sync User Activities

```http
GET /v1/ingest/:userId[?getAll=true]
```

Syncs activities from Strava using a two-step process to capture complete data including segment efforts:

1. **Step 1 - Activity Summaries**: Fetches basic activity data from `/athlete/activities` endpoint

   - Fast bulk retrieval (200 activities per request)
   - Minimal API usage for pagination
   - Identifies activities that need detailed processing

2. **Step 2 - Detailed Activity Data**: Fetches complete data from `/activities/{id}` endpoint
   - Includes segment efforts with KOM/PR rankings
   - Achievement data and performance metrics
   - Full activity analytics data
   - Concurrency-controlled batch processing (5 simultaneous requests)

**Benefits of Two-Step Process:**

- **Comprehensive Data**: Captures all segment efforts, KOMs, and PRs that aren't available in summaries
- **Rate Limit Friendly**: Intelligent batching and progressive delays
- **Resilient**: Continues processing even if individual activities fail
- **Efficient**: Only fetches detailed data for activities that exist
- **Future-Proof**: Stores complete raw API responses for future data mining

**Raw Data Persistence:**

- **Complete API Response Storage**: Every Strava API response is stored in `rawData` field
- **Future Data Mining**: Enables extraction of additional fields without re-calling API
- **API Evolution Tracking**: Preserves historical data structure changes
- **Zero Re-ingestion Cost**: Access all original data without rate limit impact

**Parameters:**

- `userId` (string): User identifier (e.g., "brandon")
- `getAll` (query, optional):
  - `true`: Full historical sync (all activities from Strava)
  - `false` or omitted: **Smart incremental sync** (only new activities since last sync)

**Smart Incremental Sync Features:**

- **Date-based filtering**: Uses `lastSyncAt` timestamp to fetch only new activities
- **Safety overlap**: Includes 1-week buffer to ensure no activities are missed
- **Rate limit optimization**: Dramatically reduces API calls for regular usage
- **Activity tracking**: Logs existing activity count and latest activity date

**Response:**

```json
{
  "msg": "success"
}
```

**Rate Limiting:**

The API automatically respects Strava's rate limits:

- **Overall**: 200 requests per 15 minutes, 2000 per day
- **Read endpoints**: 100 requests per 15 minutes, 1000 per day

Progressive delay system:

- **50-70% usage**: 1 second delay
- **70-80% usage**: 2 second delay
- **80-90% usage**: 5 second delay
- **90%+ usage**: 10 second delay
- **429 responses**: Automatic retry with exponential backoff

**Error Response:**

```json
{
  "error": "No user provided."
}
```

### KOM Endpoints

#### Get KOM Activities

```http
GET /v1/koms/:userId[?limit=50]
```

Returns activities with King of the Mountain (KOM) achievements, sorted by KOM count and best KOM rank.

**Parameters:**

- `userId` (string): User identifier (e.g., "brandon")
- `limit` (query, optional): Maximum number of activities to return (default: 50)

**Response:**

```json
{
  "activities": [
    {
      "id": "987654321",
      "name": "Epic Climb Session",
      "date": "2024-01-15T08:00:00.000Z",
      "komCount": 3,
      "bestKomRank": 1,
      "bestPrRank": 2,
      "koms": [
        {
          "segmentName": "Tunnel Road",
          "rank": 1,
          "achievements": ["kom"]
        },
        {
          "segmentName": "Hawk Hill",
          "rank": 2,
          "achievements": ["kom"]
        }
      ]
    }
  ],
  "total": 25
}
```

#### Get KOM Statistics

```http
GET /v1/koms/:userId/stats
```

Returns aggregate KOM statistics for a user.

**Response:**

```json
{
  "user": "brandon",
  "stats": {
    "totalKoms": 47,
    "activitiesWithKoms": 15,
    "bestKomRank": 1
  }
}
```

### Reports

#### Yearly Cycling Report

```http
GET /v1/reports/cycling/yearly/:userId
```

Returns yearly cycling statistics grouped by year for activities where `activityType` is 'VirtualRide' or 'Ride'.

**Response:**

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

#### Progress Comparison Report

```http
GET /v1/reports/cycling/progress/:userId
```

Year-over-year comparison using Pacific Time calculations.

**Response:**

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

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  athlete_id BIGINT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  last_sync_at TIMESTAMP, -- For incremental sync optimization
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Activities Table

```sql
CREATE TABLE activities (
  id BIGINT PRIMARY KEY,
  athlete_id BIGINT NOT NULL,
  name TEXT DEFAULT '',
  distance REAL,
  moving_time INTEGER,
  elapsed_time INTEGER,
  total_elevation_gain REAL,
  activity_type TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  -- KOM/PR specific fields
  kom_count INTEGER DEFAULT 0,
  best_kom_rank INTEGER,
  best_pr_rank INTEGER,
  segment_efforts TEXT DEFAULT '[]', -- JSON array
  -- ... 20+ additional fields for comprehensive activity data
  FOREIGN KEY (athlete_id) REFERENCES users(athlete_id)
);
```

### Raw Activities Table

```sql
CREATE TABLE raw_activities (
  activity_id BIGINT PRIMARY KEY,
  raw_data TEXT NOT NULL, -- Complete Strava API response
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);
```

**Performance Benefits:**

- Raw data stored separately to keep main activity queries fast
- Activity table optimized for reporting and analytics queries
- Raw data available for future feature development and data mining
- Cascade delete ensures data consistency

**KOM-Optimized Indexes:**

- `athlete_id, kom_count` - Fast KOM activity queries
- `kom_count` - Global KOM leaderboards
- `best_kom_rank` - Best performance queries

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## 📊 Database Management

```bash
# View database in Prisma Studio
npm run prisma:studio

# Reset database (development only)
npm run prisma:reset

# Deploy migrations (production)
npm run prisma:deploy
```

## 🔄 Unit Conversions

The API uses the exact conversion formulas from the original system:

- **Distance**: meters to miles = `meters / 1609.34`
- **Elevation**: meters to feet = `meters / 0.3048`
- **Speed**: m/s to mph = `mps * 25 / 11`
- **Temperature**: Celsius to Fahrenheit = `celsius * 9 / 5 + 32`

## 🕒 Date/Time Handling

- **Timezone**: Pacific Time (UTC-8 offset)
- **Current vs Previous Year**: Dynamic year boundary calculations
- **Day Calculations**: Day-of-year for daily averages
- **Date Deduplication**: Unique riding days (by date)

## 🚦 Performance & Monitoring

- Database queries optimized with proper indexes
- Response time target: < 200ms (95th percentile)
- Rate limiting: 100 requests per 15 minutes per IP
- Automatic Strava token refresh
- Comprehensive error handling and logging

## 🔐 Security Features

- Helmet.js security headers
- CORS protection
- Rate limiting
- Input validation with Zod
- JWT authentication ready
- Environment variable protection

## 🚀 Deployment

The application is production-ready with:

- Graceful shutdown handling
- Health check endpoint
- Environment-based configuration
- Database connection pooling
- Comprehensive error handling

## 📁 Project Structure

```
src/
├── server.js              # Express app setup
├── middleware/            # Custom middleware
│   └── errorHandler.js   # Global error handling
├── routes/               # API route handlers
│   ├── ingest.js        # Data ingestion endpoints
│   └── reports.js       # Report generation endpoints
├── services/            # Business logic
│   ├── stravaService.js # Strava API integration
│   ├── activityService.js # Database operations
│   └── reportService.js # Report calculations
└── utils/              # Utility functions
    ├── logger.js       # Logging utility
    ├── calculations.js # Math and date utilities
    └── validation.js   # Zod schemas
```

## 🤝 Contributing

1. Follow the existing code style (Prettier configuration included)
2. Write tests for new features
3. Ensure all tests pass: `npm test`
4. Use conventional commit messages

## 📝 License

MIT License
